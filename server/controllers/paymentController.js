// server/controllers/paymentController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const StudentFinancial = require('../models/StudentFinancial');
const LoggingService = require('../services/loggingService');

// @desc    Create a cash payment record (aligned with new schema)
// @route   POST /api/payments
// @access  Private (Manager, Staff)
const Enrollment = require('../models/Enrollment');
const createPayment = async (req, res) => {
  try {
    const { enrollmentId, amount, kind, note, idempotencyKey, unitType, units, expectedPrice, taken, debtDelta } = req.body || {};
    if (!enrollmentId || !amount || !kind) {
      return res.status(400).json({ message: 'enrollmentId, amount, and kind are required.' });
    }
  if (!['pay_sessions', 'pay_cycles'].includes(kind)) {
      return res.status(400).json({ message: 'Invalid kind.' });
    }
    if (!mongoose.isValidObjectId(enrollmentId)) {
      return res.status(400).json({ message: 'Invalid enrollmentId.' });
    }
    // Normalize school id from authenticated user; fail if missing to avoid casting issues
    const schoolIdRaw = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!schoolIdRaw) {
      return res.status(400).json({ message: 'User is not assigned to a school.' });
    }
    if (!mongoose.isValidObjectId(schoolIdRaw)) {
      return res.status(400).json({ message: 'Invalid school assignment.' });
    }
    const schoolId = new mongoose.Types.ObjectId(schoolIdRaw);
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.schoolId.toString() !== schoolId.toString()) {
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    // Normalize idempotency key: ignore empty/null to avoid unique index conflicts on (enrollmentId, idempotencyKey)
    const normalizedIdem = typeof idempotencyKey === 'string' && idempotencyKey.trim().length > 0
      ? idempotencyKey.trim()
      : undefined;
    if (normalizedIdem) {
      const dup = await Payment.findOne({ enrollmentId, idempotencyKey: normalizedIdem });
      if (dup) return res.status(200).json(dup);
    }

    // Create payment first (audit log)
    const parsedAmount = Number(amount);
    const parsedExpected = Number(expectedPrice);
    const paid = typeof taken === 'number' ? taken : parsedAmount;
    const paymentPayload = {
      schoolId,
      classId: enrollment.classId,
      studentId: enrollment.studentId,
      enrollmentId,
      // amount represents the expected price for the units purchased
      amount: parsedAmount,
      kind,
      method: 'cash',
      note,
      unitType,
      units,
      expectedPrice: Number.isFinite(parsedExpected) ? parsedExpected : parsedAmount,
      taken: Number.isFinite(paid) ? paid : 0,
      // Align with UI: debt = taken - price
      debtDelta: typeof debtDelta === 'number' ? debtDelta : (Number.isFinite(paid) && Number.isFinite(parsedExpected) ? (paid - parsedExpected) : 0),
    };
    if (normalizedIdem) paymentPayload.idempotencyKey = normalizedIdem;
    const payment = await Payment.create(paymentPayload);

    // Adjust enrollment balance automatically
    // Prefer unit-based credit; fallback to money-based if units not provided
    const snap = enrollment.pricingSnapshot || {};
    let sessionsAdded = 0;
    if (typeof units === 'number' && units > 0) {
      if (unitType === 'session') {
        sessionsAdded = units;
      } else if (unitType === 'cycle') {
        if (typeof snap.cycleSize === 'number' && snap.cycleSize > 0) {
          sessionsAdded = units * snap.cycleSize;
        }
      }
    }
    // Fallback: infer sessions from amount actually paid
    if (sessionsAdded === 0) {
      if (snap.paymentModel === 'per_session') {
        if (typeof snap.sessionPrice === 'number' && snap.sessionPrice > 0) {
          sessionsAdded = (Number.isFinite(paid) ? paid : parsedAmount) / snap.sessionPrice;
        }
      } else if (snap.paymentModel === 'per_cycle') {
        if (typeof snap.cyclePrice === 'number' && snap.cyclePrice > 0 && typeof snap.cycleSize === 'number' && snap.cycleSize > 0) {
          sessionsAdded = ((Number.isFinite(paid) ? paid : parsedAmount) / snap.cyclePrice) * snap.cycleSize;
        }
      }
    }

    // Allow fractional sessions to represent partial payments; store as Number
    if (Number.isFinite(sessionsAdded) && sessionsAdded !== 0) {
      await Enrollment.updateOne(
        { _id: enrollmentId },
        { $inc: { balance: sessionsAdded } }
      );
    }

    // Update per-student aggregate (always update, even if debtDelta is 0)
    if (typeof payment.debtDelta === 'number') {
      await StudentFinancial.updateOne(
        { schoolId, studentId: enrollment.studentId },
        { $inc: { debt: payment.debtDelta } },
        { upsert: true }
      );
    }

    // Log the payment activity
    await LoggingService.logManagerActivity(req, 'manager_payment_record', 
      `Recorded payment of ${parsedAmount} DZD for student ${enrollment.studentId}`, 
      { paymentId: payment._id, amount: parsedAmount, kind, enrollmentId },
      { entityType: 'payment', entityId: payment._id }
    );

    res.status(201).json({ payment, balanceDelta: sessionsAdded });
  } catch (error) {
    console.error('createPayment error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single payment by ID
// @route   GET /api/payments/:id
// @access  Private (Manager, Staff, Student)
const getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID.' });
    }

    const payment = await Payment.findById(paymentId)
      .populate('studentId', 'firstName lastName studentCode')
      .populate('classId', 'name')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Authorization check (optional, depending on requirements)
    // const schoolIdRaw = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    // if (payment.schoolId.toString() !== schoolIdRaw?.toString()) {
    //   return res.status(403).json({ message: 'Not authorized to view this payment.' });
    // }

    res.status(200).json(payment);
  } catch (error) {
    console.error('getPaymentById error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get payments filtered by enrollmentId or studentId (tenant-scoped)
// @route   GET /api/payments
// @access  Private (Manager, Staff)
const getPayments = async (req, res) => {
  try {
    // Normalize school id; fail fast if missing to avoid CastError on empty string
    const schoolIdRaw = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!schoolIdRaw) {
      return res.status(400).json({ message: 'User is not assigned to a school.' });
    }
    if (!mongoose.isValidObjectId(schoolIdRaw)) {
      return res.status(400).json({ message: 'Invalid school assignment.' });
    }
    const { enrollmentId, studentId, limit = 50, skip = 0 } = req.query;
    // Legacy alias support: ?student= -> studentId, ?class= -> classId
    const legacyStudent = req.query.student;
    const legacyClass = req.query.class;
    // Validate optional ids to avoid CastErrors
    if (enrollmentId && !mongoose.isValidObjectId(enrollmentId)) {
      return res.status(400).json({ message: 'Invalid enrollmentId.' });
    }
    const effectiveStudent = studentId || legacyStudent;
    if (effectiveStudent && !mongoose.isValidObjectId(effectiveStudent)) {
      return res.status(400).json({ message: 'Invalid studentId.' });
    }
    if (legacyClass && !mongoose.isValidObjectId(legacyClass)) {
      return res.status(400).json({ message: 'Invalid classId.' });
    }
    const query = { schoolId: new mongoose.Types.ObjectId(schoolIdRaw) };
    if (enrollmentId) query.enrollmentId = new mongoose.Types.ObjectId(enrollmentId);
    if (effectiveStudent) query.studentId = new mongoose.Types.ObjectId(effectiveStudent);
    if (legacyClass) query.classId = new mongoose.Types.ObjectId(legacyClass);

    // Normalize pagination safely
    const limNum = Number.parseInt(limit, 10);
    const skNum = Number.parseInt(skip, 10);
    const safeLimit = Number.isFinite(limNum) ? Math.min(Math.max(limNum, 1), 200) : 50;
    const safeSkip = Number.isFinite(skNum) ? Math.max(skNum, 0) : 0;

    const items = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate('studentId', 'firstName lastName studentCode')
      .populate('classId', 'name')
      .limit(safeLimit)
      .skip(safeSkip)
      .lean();
    res.status(200).json({ items, pageInfo: { limit: safeLimit, skip: safeSkip } });
  } catch (error) {
    console.error('getPayments error:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      user: { id: req.user?._id, school: req.user?.school?._id || req.user?.school },
    });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a payment record (mark as paid, overdue, etc.)
// @route   PUT /api/payments/:id
// @access  Private (Manager, Staff)
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const updates = req.body;
    const payment = await Payment.findByIdAndUpdate(paymentId, updates, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a payment record
// @route   DELETE /api/payments/:id
// @access  Private (Manager, Staff)
const deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const deleted = await Payment.findByIdAndDelete(paymentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    res.status(200).json({ message: 'Payment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Manually adjust student debt
// @route   POST /api/payments/adjust-debt
// @access  Private (Manager)
const adjustStudentDebt = asyncHandler(async (req, res) => {
  const { studentId, debtAdjustment, reason, note } = req.body;
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to adjust student debt');
  }

  if (!studentId || typeof debtAdjustment !== 'number') {
    res.status(400);
    throw new Error('Please provide studentId and debtAdjustment');
  }

  try {
    // Update student debt
    const result = await StudentFinancial.updateOne(
      { schoolId, studentId },
      { $inc: { debt: debtAdjustment } },
      { upsert: true }
    );

    // Note: Debt adjustments are not manual transactions
    // They only affect the StudentFinancial record and don't impact income/expenses

    res.status(200).json({
      success: true,
      message: `Student debt adjusted by ${debtAdjustment}`,
      data: {
        studentId,
        debtAdjustment,
        reason,
        note
      }
    });

  } catch (error) {
    console.error('Error adjusting student debt:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get student debt information
// @route   GET /api/payments/student-debt/:studentId
// @access  Private (Manager)
const getStudentDebt = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to view student debt');
  }

  try {
    const studentDebt = await StudentFinancial.findOne({
      schoolId,
      studentId
    });

    res.status(200).json({
      success: true,
      data: {
        studentId,
        debt: studentDebt?.debt || 0,
        lastUpdated: studentDebt?.updatedAt || null
      }
    });

  } catch (error) {
    console.error('Error getting student debt:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Pay student debt
// @route   POST /api/payments/pay-debt
// @access  Private (Manager)
const payStudentDebt = asyncHandler(async (req, res) => {
  const { studentId, amount, note } = req.body;
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to pay student debt');
  }

  if (!studentId || !amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide studentId and valid amount');
  }

  try {
    // Get current debt
    const studentDebt = await StudentFinancial.findOne({
      schoolId,
      studentId
    });

    const currentDebt = studentDebt?.debt || 0;
    
    if (currentDebt <= 0) {
      res.status(400);
      throw new Error('Student has no outstanding debt');
    }

    // Calculate payment amount (cannot exceed debt)
    const paymentAmount = Math.min(amount, currentDebt);
    const debtReduction = -paymentAmount; // Negative to reduce debt

    // Update student debt
    await StudentFinancial.updateOne(
      { schoolId, studentId },
      { $inc: { debt: debtReduction } },
      { upsert: true }
    );

    // Create a payment record for debt payment
    const payment = await Payment.create({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      classId: null, // Debt payments are not tied to specific classes
      studentId: new mongoose.Types.ObjectId(studentId),
      enrollmentId: null, // Debt payments are not tied to specific enrollments
      amount: paymentAmount,
      kind: 'debt_payment',
      method: 'cash',
      note: note || `Debt payment - ${paymentAmount} DZD`,
      unitType: undefined,
      units: undefined,
      expectedPrice: paymentAmount,
      taken: paymentAmount,
      debtDelta: debtReduction,
      idempotencyKey: `DEBT-PAY-${studentId}-${Date.now()}`
    });

    // Note: Debt payments are not manual transactions
    // They only affect the StudentFinancial record and create Payment records for audit

    res.status(200).json({
      success: true,
      message: `Debt payment of ${paymentAmount} DZD processed successfully`,
      data: {
        studentId,
        paymentAmount,
        previousDebt: currentDebt,
        remainingDebt: currentDebt - paymentAmount,
        payment
      }
    });

  } catch (error) {
    console.error('Error paying student debt:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Clean up debt-related manual transactions
// @route   DELETE /api/payments/cleanup-debt-transactions
// @access  Private (Manager)
const cleanupDebtTransactions = asyncHandler(async (req, res) => {
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to cleanup debt transactions');
  }

  try {
    const ManualTransaction = require('../models/ManualTransaction');
    
    // Remove all manual transactions related to debt adjustments
    const result = await ManualTransaction.deleteMany({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      $or: [
        { category: 'Debt Adjustment' },
        { category: 'Debt Payment' }
      ]
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} debt-related manual transactions`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Error cleaning up debt transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  adjustStudentDebt,
  getStudentDebt,
  payStudentDebt,
  cleanupDebtTransactions,
};

// @desc    Get payments for teacher-owned classes (read-only)
// @route   GET /api/payments/teacher?classId=&studentId=&limit=&skip=
// @access  Private (Teacher; also allows manager/staff as pass-through)
module.exports.getPaymentsForTeacher = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!['teacher', 'manager', 'staff'].includes(role)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const schoolIdRaw = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!schoolIdRaw || !mongoose.isValidObjectId(schoolIdRaw)) {
      return res.status(400).json({ message: 'Invalid or missing school assignment.' });
    }
    const schoolId = new mongoose.Types.ObjectId(schoolIdRaw);

    const { classId, studentId, limit = 50, skip = 0 } = req.query || {};
    if (classId && !mongoose.isValidObjectId(classId)) return res.status(400).json({ message: 'Invalid classId.' });
    if (studentId && !mongoose.isValidObjectId(studentId)) return res.status(400).json({ message: 'Invalid studentId.' });

    const limNum = Number.parseInt(limit, 10);
    const skNum = Number.parseInt(skip, 10);
    const safeLimit = Number.isFinite(limNum) ? Math.min(Math.max(limNum, 1), 200) : 50;
    const safeSkip = Number.isFinite(skNum) ? Math.max(skNum, 0) : 0;

    // Build base visibility for teacher: payments in teacher-owned classes
    let visibility = { schoolId };
    if (role === 'teacher') {
      const Class = require('../models/Class');
      const owned = await Class.find({ schoolId, teacherId: req.user._id }).select('_id');
      const ownedIds = owned.map(c => c._id);
      if (ownedIds.length === 0) return res.json({ items: [], pageInfo: { limit: safeLimit, skip: safeSkip } });
      visibility.classId = { $in: ownedIds };
    }

    // Apply optional filters (within visibility)
    if (classId) visibility.classId = classId;
    if (studentId) visibility.studentId = studentId;

    const items = await Payment.find(visibility)
      .sort({ createdAt: -1 })
      .populate('studentId', 'firstName lastName name studentCode')
      .populate('classId', 'name')
      .limit(safeLimit)
      .skip(safeSkip)
      .lean();

    res.json({ items, pageInfo: { limit: safeLimit, skip: safeSkip } });
  } catch (error) {
    console.error('getPaymentsForTeacher error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
