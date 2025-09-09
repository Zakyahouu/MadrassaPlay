// server/controllers/paymentController.js

const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const StudentFinancial = require('../models/StudentFinancial');

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

    // Update per-student aggregate
    if (typeof payment.debtDelta === 'number' && payment.debtDelta !== 0) {
      await StudentFinancial.updateOne(
        { schoolId, studentId: enrollment.studentId },
        { $inc: { debt: payment.debtDelta } },
        { upsert: true }
      );
    }

    res.status(201).json({ payment, balanceDelta: sessionsAdded });
  } catch (error) {
    console.error('createPayment error:', {
      message: error.message,
      stack: error.stack,
    });
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

module.exports = {
  createPayment,
  getPayments,
  updatePayment,
  deletePayment,
};
