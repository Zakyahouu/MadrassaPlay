const mongoose = require('mongoose');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const LoggingService = require('../services/loggingService');
const Payment = require('../models/Payment');
const { applyDebtAdjustment } = require('../services/enrollmentFinanceService');
const StudentLogService = require('../services/studentLogService');

function sessionsToMonetaryValue(balance, snapshot = {}) {
  const sessions = Number(balance) || 0;
  if (sessions === 0) return 0;
  const { paymentModel, sessionPrice, cycleSize, cyclePrice } = snapshot || {};
  if (paymentModel === 'per_session' && typeof sessionPrice === 'number' && sessionPrice > 0) {
    return sessions * sessionPrice;
  }
  if (paymentModel === 'per_cycle' && typeof cycleSize === 'number' && cycleSize > 0 && typeof cyclePrice === 'number' && cyclePrice > 0) {
    return (sessions / cycleSize) * cyclePrice;
  }
  return sessions;
}

function monetaryValueToSessions(value, snapshot = {}) {
  const amount = Number(value) || 0;
  if (amount === 0) return 0;
  const { paymentModel, sessionPrice, cycleSize, cyclePrice } = snapshot || {};
  if (paymentModel === 'per_session' && typeof sessionPrice === 'number' && sessionPrice > 0) {
    return amount / sessionPrice;
  }
  if (paymentModel === 'per_cycle' && typeof cycleSize === 'number' && cycleSize > 0 && typeof cyclePrice === 'number' && cyclePrice > 0) {
    return (amount / cyclePrice) * cycleSize;
  }
  return amount;
}

function buildPricingSnapshotForClass(klass) {
  if (!klass) throw new Error('Class not found');
  let { paymentModel, sessionPrice, cyclePrice, cycleSize } = klass;
  if (!paymentModel) {
    if (typeof klass.price === 'number' && typeof klass.paymentCycle === 'number') {
      paymentModel = 'per_cycle';
      cyclePrice = klass.price;
      cycleSize = klass.paymentCycle;
    } else {
      throw new Error('Class pricing not configured. Please update class pricing.');
    }
  }

  if (paymentModel === 'per_session') {
    if (typeof sessionPrice !== 'number') {
      throw new Error('Class per-session price missing. Please update class pricing.');
    }
    return {
      paymentModel,
      sessionPrice,
      cycleSize: undefined,
      cyclePrice: undefined,
    };
  }

  // per_cycle
  if (typeof cyclePrice !== 'number') {
    cyclePrice = typeof klass.price === 'number' ? klass.price : undefined;
  }
  if (typeof cycleSize !== 'number') {
    cycleSize = typeof klass.paymentCycle === 'number' ? klass.paymentCycle : undefined;
  }
  if (typeof cyclePrice !== 'number' || typeof cycleSize !== 'number') {
    throw new Error('Class cycle price/size missing. Please update class pricing.');
  }
  return {
    paymentModel,
    sessionPrice: undefined,
    cycleSize,
    cyclePrice,
  };
}

// @desc    Get all students for a school (manager only)
// @route   GET /api/students
// @access  Private (Manager)
const getStudents = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;

  // Check if manager has a school assigned
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to access students');
  }

  const students = await User.find({ school: schoolId, role: 'student' }).select('-password');

  // Derive accurate active enrollment counts from Enrollment collection
  const mongoose = require('mongoose');
  const Enrollment = require('../models/Enrollment');
  const studentIds = students.map((s) => s._id);
  const counts = await Enrollment.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), studentId: { $in: studentIds }, status: 'active' } },
    { $group: { _id: '$studentId', c: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((x) => [x._id.toString(), x.c]));
  const result = students.map((s) => {
    const obj = s.toObject();
    const c = countMap.get(s._id.toString()) || 0;
    obj.enrollmentCount = c;
    obj.enrollmentStatus = c > 0 ? 'enrolled' : 'not_enrolled';
    return obj;
  });

  res.json(result);
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Manager)
const getStudent = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;

  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' }).select('-password');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Attach accurate active enrollment count
  try {
    const mongoose = require('mongoose');
    const Enrollment = require('../models/Enrollment');
    const counts = await Enrollment.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), studentId: new mongoose.Types.ObjectId(id), status: 'active' } },
      { $group: { _id: '$studentId', c: { $sum: 1 } } },
    ]);
    const c = counts?.[0]?.c || 0;
    const obj = student.toObject();
    obj.enrollmentCount = c;
    obj.enrollmentStatus = c > 0 ? 'enrolled' : 'not_enrolled';
    return res.json(obj);
  } catch (_) {
    // Fallback to original doc if aggregation fails
    return res.json(student);
  }
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Manager)
const createStudent = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;

  // Check if manager has a school assigned
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to create students');
  }

  const {
    firstName,
    lastName,
    email,
    contact,
    educationLevel,
    username,
    password,
    studentCode
  } = req.body;

  // Generate student code if not provided
  const finalStudentCode = studentCode || User.generateStudentCode();

  // Check if email already exists (only if provided)
  if (email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already registered');
    }
  }

  // Check if username already exists
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    res.status(400);
    throw new Error('Username already taken');
  }

  // Check if student code already exists
  const codeExists = await User.findOne({ studentCode: finalStudentCode });
  if (codeExists) {
    res.status(400);
    throw new Error('Student code already exists');
  }

  const studentData = {
    firstName,
    lastName,
    email,
    educationLevel,
    username,
    password,
    studentCode: finalStudentCode,
    role: 'student',
    school: schoolId
  };

  if (contact && typeof contact === 'object') {
    const payload = {};
    if (contact.phone1 !== undefined) payload.phone1 = contact.phone1;
    if (contact.phone2 !== undefined) payload.phone2 = contact.phone2;
    if (contact.address !== undefined) payload.address = contact.address;
    if (Object.keys(payload).length > 0) {
      studentData.contact = payload;
    }
  }

  const student = await User.create(studentData);

  const studentResponse = student.toObject();
  delete studentResponse.password;

  // Log the activity
  await LoggingService.logManagerActivity(req, 'manager_student_create',
    `Created new student: ${student.firstName} ${student.lastName} (${student.studentCode})`,
    { studentId: student._id, studentCode: student.studentCode },
    { entityType: 'student', entityId: student._id }
  );

  res.status(201).json({
    success: true,
    student: studentResponse,
    message: 'Student created successfully'
  });
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Manager)
const updateStudent = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;

  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const {
    firstName,
    lastName,
    email,
    contact,
    educationLevel,
    username,
    password,
    status
  } = req.body;

  // Check if email already exists (if being updated)
  if (email && email !== student.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already registered');
    }
  }

  // Check if username already exists (if being updated)
  if (username && username !== student.username) {
    const usernameExists = await User.findOne({ username, _id: { $ne: id } });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username already taken');
    }
  }

  // Update fields
  if (firstName !== undefined) student.firstName = firstName;
  if (lastName !== undefined) student.lastName = lastName;
  if (email !== undefined) student.email = email;
  if (contact && typeof contact === 'object') {
    const current = student.contact?.toObject?.() || student.contact || {};
    student.contact = {
      ...current,
      ...(contact.phone1 !== undefined ? { phone1: contact.phone1 } : {}),
      ...(contact.phone2 !== undefined ? { phone2: contact.phone2 } : {}),
      ...(contact.address !== undefined ? { address: contact.address } : {}),
    };
  }
  if (educationLevel !== undefined) student.educationLevel = educationLevel;
  if (username !== undefined) student.username = username;
  if (password !== undefined && password.trim() !== '') student.password = password;
  if (status !== undefined) student.studentStatus = status;

  const updatedStudent = await student.save();

  const studentResponse = updatedStudent.toObject();
  delete studentResponse.password;

  // Log the activity
  await LoggingService.logManagerActivity(req, 'manager_student_update',
    `Updated student: ${updatedStudent.firstName} ${updatedStudent.lastName} (${updatedStudent.studentCode})`,
    { studentId: updatedStudent._id, studentCode: updatedStudent.studentCode, changes: req.body },
    { entityType: 'student', entityId: updatedStudent._id }
  );

  res.json({
    success: true,
    student: studentResponse,
    message: 'Student updated successfully'
  });
});

// @desc    Enroll a student to a class (validates school, capacity, and level)
//          Also creates an Enrollment document with a pricing snapshot for payments/attendance flows
// @route   POST /api/students/:id/enroll
// @access  Private (Manager)
const enrollStudent = asyncHandler(async (req, res) => {
  // Normalize school id in case req.user.school is populated
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
  const schoolIdStr = schoolId?.toString?.();
  const { id: studentId } = req.params;
  const { classId } = req.body;

  if (!classId) {
    res.status(400);
    throw new Error('classId is required');
  }


  const student = await User.findOne({ _id: studentId, school: schoolIdStr, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const klass = await ClassModel.findById(classId);
  if (!klass) {
    res.status(404);
    throw new Error('Class not found');
  }
  if (klass.schoolId.toString() !== schoolIdStr) {
    res.status(403);
    throw new Error('Class does not belong to your school');
  }
  // Capacity check
  const activeCount = (klass.enrolledStudents || []).filter(e => e.status === 'active').length;

  if (activeCount >= klass.capacity) {
    res.status(409);
    throw new Error('Class is full');
  }

  // Level matching intentionally not enforced: students can enroll in any class by design

  // Prevent duplicate enrollment - more thorough check
  // First check class roster (quick check)
  const alreadyEnrolledInRoster = (klass.enrolledStudents || []).some(e =>
    e.studentId?.toString() === student._id.toString() && e.status === 'active'
  );

  if (alreadyEnrolledInRoster) {

    // Do not block here; rely on Enrollment collection for idempotency
  }

  // Build pricing snapshot robustly (support legacy fields)
  let paymentModel = klass.paymentModel;
  let sessionPrice = klass.sessionPrice;
  let cyclePrice = klass.cyclePrice;
  let cycleSize = klass.cycleSize;

  if (!paymentModel) {
    if (typeof klass.price === 'number' && typeof klass.paymentCycle === 'number') {
      paymentModel = 'per_cycle';
      cyclePrice = klass.price;
      cycleSize = klass.paymentCycle;
    } else {
      res.status(400);
      throw new Error('Class pricing not configured. Please update class pricing.');
    }
  }
  if (paymentModel === 'per_session') {
    if (typeof sessionPrice !== 'number') {
      res.status(400);
      throw new Error('Class per-session price missing. Please update class pricing.');
    }
  } else if (paymentModel === 'per_cycle') {
    // allow fallback from legacy if missing
    if (typeof cyclePrice !== 'number') cyclePrice = typeof klass.price === 'number' ? klass.price : undefined;
    if (typeof cycleSize !== 'number') cycleSize = typeof klass.paymentCycle === 'number' ? klass.paymentCycle : undefined;
    if (typeof cyclePrice !== 'number' || typeof cycleSize !== 'number') {
      res.status(400);
      throw new Error('Class cycle price/size missing. Please update class pricing.');
    }
  }

  const pricingSnapshot = {
    paymentModel,
    sessionPrice: paymentModel === 'per_session' ? sessionPrice : undefined,
    cycleSize: paymentModel === 'per_cycle' ? cycleSize : undefined,
    cyclePrice: paymentModel === 'per_cycle' ? cyclePrice : undefined,
  };
  let legacyTotals = {};
  if (paymentModel === 'per_cycle') {
    legacyTotals = { totalSessions: cycleSize, totalAmount: cyclePrice, sessionsCompleted: 0, amountPaid: 0 };
  } else if (paymentModel === 'per_session') {
    legacyTotals = { totalSessions: 0, totalAmount: 0, sessionsCompleted: 0, amountPaid: 0 };
  }

  // Create Enrollment document first, to avoid partial state on failures
  const Enrollment = require('../models/Enrollment');

  // Check if enrollment already exists (idempotent behavior)
  const existingEnrollment = await Enrollment.findOne({
    studentId: student._id,
    classId: klass._id,
    status: { $in: ['active', 'paused', 'suspended'] }
  });
  if (existingEnrollment) {
    return res.status(200).json({
      success: true,
      message: 'Student already enrolled (idempotent)',
      class: klass,
      enrollmentId: existingEnrollment._id,
      pricingSnapshot: existingEnrollment.pricingSnapshot || pricingSnapshot,
      className: klass.name,
    });
  }

  let enrollmentDoc;
  try {
    enrollmentDoc = await Enrollment.create({
      schoolId: klass.schoolId,
      studentId: student._id,
      classId: klass._id,
      status: 'active',
      pricingSnapshot,
      ...legacyTotals,
    });

  } catch (err) {
    // Handle common validation/duplicate errors gracefully
    if (err?.code === 11000) {

      const dup = await Enrollment.findOne({ studentId: student._id, classId: klass._id });
      if (dup) {
        return res.status(200).json({
          success: true,
          message: 'Student already enrolled (idempotent)',
          class: klass,
          enrollmentId: dup._id,
          pricingSnapshot: dup.pricingSnapshot || pricingSnapshot,
          className: klass.name,
        });
      }
      res.status(409);
      throw new Error('Student already enrolled in this class');
    }

    res.status(400);
    throw new Error(err?.message || 'Failed to create enrollment');
  }

  // Now update class roster and student counters
  if (!alreadyEnrolledInRoster) {
    klass.enrolledStudents.push({ studentId: student._id, status: 'active' });
    await klass.save();
  }
  // Increment counters only on first-time enrollment
  student.enrollmentCount = (student.enrollmentCount || 0) + 1;
  student.enrollmentStatus = 'enrolled';
  await student.save();

  // Log the activity
  await LoggingService.logManagerActivity(req, 'student_enroll',
    `Enrolled student ${student.firstName} ${student.lastName} in class ${klass.name}`,
    { studentId: student._id, classId: klass._id, enrollmentId: enrollmentDoc._id },
    { entityType: 'enrollment', entityId: enrollmentDoc._id }
  );

  await StudentLogService.record({
    schoolId: klass.schoolId,
    studentId: student._id,
    action: 'enroll',
    summary: `Enrolled in ${klass.name}`,
    details: {
      enrollmentId: enrollmentDoc._id,
      classId: klass._id,
      pricingSnapshot,
    },
    enrollmentId: enrollmentDoc._id,
    classId: klass._id,
    actor: req.user,
    tags: ['enroll'],
  });

  res.status(201).json({
    success: true,
    message: 'Student enrolled',
    class: klass,
    enrollmentId: enrollmentDoc._id,
    // Return pricing snapshot and class name to enable immediate checkout on the client
    pricingSnapshot,
    className: klass.name
  });
});

// @desc    Delete student (guard: cannot delete while enrolled)
// @route   DELETE /api/students/:id
// @access  Private (Manager)
const deleteStudent = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid student id');
  }

  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Guard: prevent deletion if the student has enrollments in this school
  const Enrollment = require('../models/Enrollment');
  const Class = require('../models/Class');
  const enrollments = await Enrollment.find({ studentId: student._id, schoolId }).select('_id classId').lean();
  if (Array.isArray(enrollments) && enrollments.length > 0) {
    // Populate class names to help the UI
    const classIds = enrollments.map(e => e.classId);
    const classes = await Class.find({ _id: { $in: classIds } }).select('_id name').lean();
    return res.status(409).json({
      message: 'Cannot delete student while enrolled in classes. Please unenroll the student first.',
      blockingEnrollments: enrollments,
      blockingClasses: classes,
      count: enrollments.length,
    });
  }

  // No enrollments: cleanup any residual attendance/payments for this student, then delete student
  const Attendance = require('../models/Attendance');
  const Payment = require('../models/Payment');
  await Attendance.deleteMany({ schoolId, studentId: student._id });
  await Payment.deleteMany({ schoolId, studentId: student._id });

  // Log the activity before deletion
  await LoggingService.logManagerActivity(req, 'manager_student_delete',
    `Deleted student: ${student.firstName} ${student.lastName} (${student.studentCode})`,
    { studentId: student._id, studentCode: student.studentCode },
    { entityType: 'student', entityId: student._id }
  );

  // Finally delete the student record
  await student.deleteOne();
  res.json({ success: true, message: 'Student deleted successfully' });
});

// @desc    Get student enrollments
// @route   GET /api/students/:id/enrollments
// @access  Private (Manager)
const getStudentEnrollments = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;

  // Verify student exists and belongs to school
  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Get enrollments from the enrollment collection
  const Enrollment = require('../models/Enrollment');
  const enrollments = await Enrollment.find({ studentId: id, schoolId })
    .populate('classId', 'name teacherId roomId schedules price')
    .populate('classId.teacherId', 'firstName lastName')
    .populate('classId.roomId', 'name')
    .sort({ createdAt: -1 });

  // Format enrollments for frontend
  const formattedEnrollments = enrollments.map(enrollment => ({
    _id: enrollment._id,
    classId: enrollment.classId?._id || enrollment.classId,
    className: enrollment.classId.name,
    teacher: `${enrollment.classId.teacherId.firstName} ${enrollment.classId.teacherId.lastName}`,
    startDate: enrollment.startDate,
    sessionsCount: enrollment.totalSessions,
    sessionsCompleted: enrollment.sessionsCompleted,
    totalAmount: enrollment.totalAmount,
    amountPaid: enrollment.amountPaid,
    status: enrollment.status,
    schedule: enrollment.classId.schedules.map(s =>
      `${s.dayOfWeek.charAt(0).toUpperCase() + s.dayOfWeek.slice(1)} ${s.startTime}-${s.endTime}`
    ).join(', '),
    remainingSessions: enrollment.remainingSessions,
    attendancePercentage: enrollment.attendancePercentage,
    balance: enrollment.balance
  }));

  res.json(formattedEnrollments);
});

// @desc    Get student payments
// @route   GET /api/students/:id/payments
// @access  Private (Manager)
const getStudentPayments = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;

  // Verify student exists and belongs to school
  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const payments = await Payment.find({ schoolId, studentId: id })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('classId', 'name')
    .lean();

  res.json(payments);
});

// @desc    Unenroll student from a class and convert remaining balance into debt (school owes student)
// @route   POST /api/students/:id/unenroll
// @access  Private (Manager)
const unenrollStudent = asyncHandler(async (req, res) => {
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school))?.toString?.();
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to unenroll students');
  }

  const { id: studentId } = req.params;
  const { enrollmentId, reason } = req.body || {};
  if (!enrollmentId || !mongoose.isValidObjectId(enrollmentId)) {
    res.status(400);
    throw new Error('Valid enrollmentId is required');
  }

  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const enrollment = await Enrollment.findOne({ _id: enrollmentId, schoolId, studentId }).populate('classId', 'name');
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  if (!['active', 'paused', 'suspended'].includes(enrollment.status)) {
    res.status(409);
    throw new Error('Only active enrollments can be unenrolled');
  }

  const classId = enrollment.classId?._id || enrollment.classId;
  const className = enrollment.classId?.name || 'class';
  const remainingSessions = Number(enrollment.balance) || 0;
  const refundableSessions = remainingSessions > 0 ? remainingSessions : 0;
  const refundValue = refundableSessions > 0
    ? sessionsToMonetaryValue(refundableSessions, enrollment.pricingSnapshot)
    : 0;

  enrollment.status = 'withdrawn';
  enrollment.balance = 0;
  enrollment.endedAt = new Date();
  if (reason) {
    const prefix = enrollment.notes ? `${enrollment.notes}\n` : '';
    enrollment.notes = `${prefix}Unenrolled: ${reason}`;
  }
  await enrollment.save();

  // Update class roster if entry exists
  await ClassModel.updateOne(
    { _id: classId, 'enrolledStudents.studentId': student._id },
    {
      $set: {
        'enrolledStudents.$.status': 'withdrawn',
        'enrolledStudents.$.endedAt': enrollment.endedAt,
        'enrolledStudents.$.notes': reason || 'Unenrolled',
      }
    }
  ).catch(() => null);

  if (refundValue > 0) {
    await applyDebtAdjustment({
      schoolId,
      studentId: student._id,
      enrollmentId,
      amount: refundValue,
      kind: 'unenroll_refund',
      note: reason,
      by: req.user?._id,
    });
  }

  await StudentLogService.record({
    schoolId,
    studentId: student._id,
    action: 'unenroll',
    summary: `Unenrolled from ${className}`,
    details: {
      enrollmentId,
      classId,
      balanceBefore: remainingSessions,
      refundedSessions: refundableSessions,
      refundValue,
      finance: {
        refundableSessions,
        refundValue,
        debtImpact: refundValue > 0 ? refundValue : 0,
      },
      reason,
    },
    enrollmentId,
    classId,
    actor: req.user,
    tags: ['unenroll'],
  });

  await LoggingService.logManagerActivity(
    req,
    'student_unenroll',
    `Unenrolled ${student.firstName} ${student.lastName} from ${className}`,
    { studentId: student._id, enrollmentId, refundValue, refundedSessions: refundableSessions },
    { entityType: 'enrollment', entityId: enrollmentId }
  );

  res.json({
    success: true,
    message: 'Student unenrolled successfully',
    refundValue,
    refundedSessions: refundableSessions,
    enrollmentId,
  });
});

// @desc    Transfer student between classes with balance recalculation
// @route   POST /api/students/:id/transfer
// @access  Private (Manager)
const transferStudent = asyncHandler(async (req, res) => {
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school))?.toString?.();
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to transfer students');
  }

  const { id: studentId } = req.params;
  const { fromEnrollmentId, toClassId, reason } = req.body || {};
  if (!fromEnrollmentId || !mongoose.isValidObjectId(fromEnrollmentId)) {
    res.status(400);
    throw new Error('fromEnrollmentId is required');
  }
  if (!toClassId || !mongoose.isValidObjectId(toClassId)) {
    res.status(400);
    throw new Error('toClassId is required');
  }

  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const [sourceEnrollment, targetClass] = await Promise.all([
    Enrollment.findOne({ _id: fromEnrollmentId, schoolId, studentId }).populate('classId', 'name'),
    ClassModel.findOne({ _id: toClassId, schoolId }),
  ]);

  if (!sourceEnrollment) {
    res.status(404);
    throw new Error('Source enrollment not found');
  }
  if (!targetClass) {
    res.status(404);
    throw new Error('Target class not found');
  }
  if (sourceEnrollment.classId?._id?.toString() === toClassId) {
    res.status(400);
    throw new Error('Student is already enrolled in this class');
  }
  if (!['active', 'paused', 'suspended'].includes(sourceEnrollment.status)) {
    res.status(409);
    throw new Error('Only active enrollments can be transferred');
  }

  const existingActive = await Enrollment.findOne({ schoolId, studentId, classId: toClassId, status: 'active' });
  if (existingActive) {
    res.status(409);
    throw new Error('Student already has an active enrollment in the target class');
  }

  let targetSnapshot;
  try {
    targetSnapshot = buildPricingSnapshotForClass(targetClass);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  const activeCount = await Enrollment.countDocuments({ schoolId, classId: toClassId, status: 'active' });
  if (typeof targetClass.capacity === 'number' && activeCount >= targetClass.capacity) {
    res.status(409);
    throw new Error('Target class is at capacity');
  }

  const sourceClassName = sourceEnrollment.classId?.name || 'original class';
  const remainingSessions = Number(sourceEnrollment.balance) || 0;
  const transferValue = sessionsToMonetaryValue(remainingSessions, sourceEnrollment.pricingSnapshot);
  const rawConvertedSessions = monetaryValueToSessions(transferValue, targetSnapshot);
  const convertedSessions = Math.max(0, Number.isFinite(rawConvertedSessions)
    ? Number(rawConvertedSessions.toFixed(4))
    : 0);
  const appliedValue = sessionsToMonetaryValue(convertedSessions, targetSnapshot);
  const remainderValue = Number(((transferValue || 0) - (appliedValue || 0)).toFixed(2));
  const debtDelta = Math.abs(remainderValue) >= 0.01 ? remainderValue : 0;
  const sessionDelta = Number((remainingSessions - convertedSessions).toFixed(4));

  const newEnrollment = await Enrollment.create({
    schoolId,
    studentId: student._id,
    classId: toClassId,
    status: 'active',
    pricingSnapshot: targetSnapshot,
    balance: convertedSessions,
  });

  // Update target class roster
  const rosterUpdate = await ClassModel.updateOne(
    { _id: toClassId, 'enrolledStudents.studentId': student._id },
    {
      $set: {
        'enrolledStudents.$.status': 'active',
        'enrolledStudents.$.enrolledAt': new Date(),
        'enrolledStudents.$.endedAt': null,
      }
    }
  );
  const matched = rosterUpdate?.matchedCount ?? rosterUpdate?.n ?? 0;
  if (!matched) {
    await ClassModel.updateOne(
      { _id: toClassId },
      {
        $push: {
          enrolledStudents: {
            studentId: student._id,
            enrolledAt: new Date(),
            status: 'active',
          }
        }
      }
    );
  }

  // Close out original enrollment
  sourceEnrollment.status = 'transferred';
  sourceEnrollment.balance = 0;
  sourceEnrollment.endedAt = new Date();
  if (reason) {
    const prefix = sourceEnrollment.notes ? `${sourceEnrollment.notes}\n` : '';
    sourceEnrollment.notes = `${prefix}Transferred: ${reason}`;
  }
  await sourceEnrollment.save();

  const sourceClassId = sourceEnrollment.classId?._id || sourceEnrollment.classId;
  await ClassModel.updateOne(
    { _id: sourceClassId, 'enrolledStudents.studentId': student._id },
    {
      $set: {
        'enrolledStudents.$.status': 'transferred',
        'enrolledStudents.$.endedAt': sourceEnrollment.endedAt,
        'enrolledStudents.$.notes': reason || 'Transferred',
      }
    }
  ).catch(() => null);

  if (Math.abs(debtDelta) >= 0.01) {
    await applyDebtAdjustment({
      schoolId,
      studentId: student._id,
      enrollmentId: newEnrollment._id,
      amount: debtDelta,
      kind: 'transfer_balance_adjustment',
      note: `Transfer from ${sourceClassName} to ${targetClass.name}`,
      by: req.user?._id,
    });
  }

  await StudentLogService.record({
    schoolId,
    studentId: student._id,
    action: 'transfer',
    summary: `Transferred from ${sourceClassName} to ${targetClass.name}`,
    details: {
      fromEnrollmentId,
      toEnrollmentId: newEnrollment._id,
      fromClassId: sourceClassId,
      toClassId,
      transferredSessions: remainingSessions,
      transferValue,
      convertedSessions,
      appliedValue,
      remainderValue: debtDelta,
      sessionDelta,
      debtDelta,
      finance: {
        previousSessions: remainingSessions,
        previousValue: transferValue,
        newSessionsCredited: convertedSessions,
        appliedValue,
        remainderValue: debtDelta,
        debtImpact: debtDelta,
      },
      reason,
    },
    enrollmentId: newEnrollment._id,
    classId: toClassId,
    actor: req.user,
    tags: ['transfer'],
  });

  await LoggingService.logManagerActivity(
    req,
    'student_transfer',
    `Transferred ${student.firstName} ${student.lastName} from ${sourceClassName} to ${targetClass.name}`,
    {
      studentId: student._id,
      fromEnrollmentId,
      toEnrollmentId: newEnrollment._id,
      transferValue,
      convertedSessions,
      appliedValue,
      remainderValue: debtDelta,
      sessionDelta,
      debtDelta,
    },
    { entityType: 'enrollment', entityId: newEnrollment._id }
  );

  res.json({
    success: true,
    message: 'Student transferred successfully',
    newEnrollmentId: newEnrollment._id,
    transferredSessions: remainingSessions,
    transferValue,
    convertedSessions,
    debtDelta,
    appliedValue,
  });
});

// @desc    Suspend student enrollment
// @route   POST /api/students/:id/suspend
// @access  Private (Manager)
const suspendStudent = asyncHandler(async (req, res) => {
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school))?.toString?.();
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to suspend students');
  }

  const { id: studentId } = req.params;
  const { enrollmentId, reason } = req.body || {};
  if (!enrollmentId || !mongoose.isValidObjectId(enrollmentId)) {
    res.status(400);
    throw new Error('Valid enrollmentId is required');
  }

  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const enrollment = await Enrollment.findOne({ _id: enrollmentId, schoolId, studentId }).populate('classId', 'name');
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  if (enrollment.status === 'suspended') {
    return res.json({
      success: true,
      message: 'Enrollment already suspended',
      suspension: enrollment.suspension,
    });
  }

  if (!['active', 'paused'].includes(enrollment.status)) {
    res.status(409);
    throw new Error('Only active enrollments can be suspended');
  }

  if (!reason || !reason.trim()) {
    res.status(400);
    throw new Error('Suspension reason is required');
  }

  const heldSessions = Number(enrollment.balance) || 0;
  const holdValue = Math.abs(heldSessions) >= 0.001
    ? sessionsToMonetaryValue(heldSessions, enrollment.pricingSnapshot)
    : 0;

  if (Math.abs(heldSessions) >= 0.001) {
    enrollment.balance = 0;
  }

  enrollment.status = 'suspended';
  enrollment.suspension = {
    reason: reason || 'Suspended',
    issuedAt: new Date(),
    issuedBy: req.user?._id,
    financialHold: Math.abs(heldSessions) >= 0.001
      ? {
        sessions: heldSessions,
        value: holdValue,
        note: reason,
      }
      : undefined,
  };
  await enrollment.save();

  const classId = enrollment.classId?._id || enrollment.classId;
  await ClassModel.updateOne(
    { _id: classId, 'enrolledStudents.studentId': student._id },
    {
      $set: {
        'enrolledStudents.$.status': 'suspended',
        'enrolledStudents.$.notes': enrollment.suspension.reason,
        'enrolledStudents.$.updatedAt': new Date(),
      }
    }
  ).catch(() => null);

  await StudentLogService.record({
    schoolId,
    studentId: student._id,
    action: 'suspend',
    summary: `Suspended from ${enrollment.classId?.name || 'class'}`,
    details: {
      enrollmentId,
      classId,
      heldSessions,
      holdValue,
      finance: Math.abs(heldSessions) >= 0.001 ? {
        holdSessions: heldSessions,
        holdValue,
        debtImpact: 0,
      } : undefined,
      financeHold: Math.abs(heldSessions) >= 0.001 ? { sessions: heldSessions, value: holdValue } : undefined,
      reason,
    },
    enrollmentId,
    classId,
    actor: req.user,
    tags: ['suspend'],
  });

  await LoggingService.logManagerActivity(
    req,
    'student_suspend',
    `Suspended ${student.firstName} ${student.lastName} from ${enrollment.classId?.name || 'class'}`,
    { enrollmentId, reason },
    { entityType: 'enrollment', entityId: enrollmentId }
  );

  res.json({
    success: true,
    message: 'Enrollment suspended',
    suspension: enrollment.suspension,
  });
});

// @desc    Unsuspend student enrollment
// @route   POST /api/students/:id/unsuspend
// @access  Private (Manager)
const unsuspendStudent = asyncHandler(async (req, res) => {
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school))?.toString?.();
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to unsuspend students');
  }

  const { id: studentId } = req.params;
  const { enrollmentId } = req.body || {};
  if (!enrollmentId || !mongoose.isValidObjectId(enrollmentId)) {
    res.status(400);
    throw new Error('Valid enrollmentId is required');
  }

  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const enrollment = await Enrollment.findOne({ _id: enrollmentId, schoolId, studentId }).populate('classId', 'name');
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  if (enrollment.status !== 'suspended') {
    res.status(409);
    throw new Error('Enrollment is not suspended');
  }

  const heldSessions = Number(enrollment.suspension?.financialHold?.sessions) || 0;
  const holdValue = Number(enrollment.suspension?.financialHold?.value) || 0;

  if (Math.abs(heldSessions) >= 0.001) {
    enrollment.balance = Number(enrollment.balance || 0) + heldSessions;
  }

  enrollment.status = 'active';
  enrollment.suspension = undefined;
  await enrollment.save();

  const classId = enrollment.classId?._id || enrollment.classId;
  await ClassModel.updateOne(
    { _id: classId, 'enrolledStudents.studentId': student._id },
    {
      $set: {
        'enrolledStudents.$.status': 'active',
        'enrolledStudents.$.updatedAt': new Date(),
      },
      $unset: {
        'enrolledStudents.$.notes': '',
      }
    }
  ).catch(() => null);

  await StudentLogService.record({
    schoolId,
    studentId: student._id,
    action: 'unsuspend',
    summary: `Reactivated enrollment for ${enrollment.classId?.name || 'class'}`,
    details: {
      enrollmentId,
      classId,
      restoredSessions: heldSessions,
      restoredValue: holdValue,
      finance: Math.abs(heldSessions) >= 0.001 ? {
        restoredSessions: heldSessions,
        restoredValue: holdValue,
        debtImpact: 0,
      } : undefined,
      financeHold: Math.abs(heldSessions) >= 0.001 ? { sessions: heldSessions, value: holdValue } : undefined,
    },
    enrollmentId,
    classId,
    actor: req.user,
    tags: ['unsuspend'],
  });

  await LoggingService.logManagerActivity(
    req,
    'student_unsuspend',
    `Unsuspended ${student.firstName} ${student.lastName} for ${enrollment.classId?.name || 'class'}`,
    { enrollmentId },
    { entityType: 'enrollment', entityId: enrollmentId }
  );

  res.json({
    success: true,
    message: 'Enrollment reactivated',
    status: enrollment.status,
  });
});

// @desc    Fetch student activity history (logs timeline)
// @route   GET /api/students/:id/history
// @access  Private (Manager)
const getStudentHistory = asyncHandler(async (req, res) => {
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school))?.toString?.();
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to view student history');
  }

  const { id: studentId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' })
    .select('firstName lastName studentCode');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const logs = await StudentLogService.list({ schoolId, studentId, limit, skip, excludeActions: ['payment'] });

  const classIdSet = new Set();
  const enrollmentIdSet = new Set();
  const ensureId = (value) => {
    if (!value) return null;
    try {
      return value.toString();
    } catch (_) {
      return null;
    }
  };

  logs.items.forEach((log) => {
    const { classId, enrollmentId, details = {} } = log;
    const classCandidates = [classId, details.classId, details.fromClassId, details.toClassId];
    classCandidates.forEach((candidate) => {
      const id = ensureId(candidate);
      if (id) classIdSet.add(id);
    });

    const enrollmentCandidates = [enrollmentId, details.enrollmentId, details.fromEnrollmentId, details.toEnrollmentId];
    enrollmentCandidates.forEach((candidate) => {
      const id = ensureId(candidate);
      if (id) enrollmentIdSet.add(id);
    });
  });

  const [classes, enrollments] = await Promise.all([
    classIdSet.size
      ? ClassModel.find({ _id: { $in: Array.from(classIdSet) } })
        .select('name teacherId roomId catalogs')
        .populate('teacherId', 'firstName lastName')
        .populate('roomId', 'name')
        .lean()
      : [],
    enrollmentIdSet.size
      ? Enrollment.find({ _id: { $in: Array.from(enrollmentIdSet) } })
        .select('classId status balance pricingSnapshot totalSessions sessionsCompleted')
        .populate('classId', 'name teacherId')
        .populate('classId.teacherId', 'firstName lastName')
        .lean()
      : [],
  ]);

  const classMap = new Map(
    classes.map((clazz) => {
      const teacher = clazz.teacherId;
      const teacherName = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : null;
      return [clazz._id.toString(), {
        id: clazz._id,
        name: clazz.name,
        teacherName: teacherName || null,
        roomName: clazz.roomId?.name || null,
      }];
    })
  );

  const enrollmentMap = new Map(
    enrollments.map((enrollment) => {
      const classInfo = enrollment.classId && typeof enrollment.classId === 'object'
        ? {
          id: enrollment.classId._id,
          name: enrollment.classId.name,
          teacherName: enrollment.classId.teacherId
            ? `${enrollment.classId.teacherId.firstName || ''} ${enrollment.classId.teacherId.lastName || ''}`.trim()
            : null,
        }
        : null;
      return [enrollment._id.toString(), {
        id: enrollment._id,
        status: enrollment.status,
        balance: enrollment.balance,
        class: classInfo,
      }];
    })
  );

  const findClassContext = (log) => {
    const detail = log.details || {};
    const candidates = [log.classId, detail.classId, detail.fromClassId, detail.toClassId];
    for (const candidate of candidates) {
      const ref = ensureId(candidate);
      if (!ref) continue;
      const info = classMap.get(ref);
      if (info) return info;
    }
    const enrollmentRef = ensureId(log.enrollmentId || detail.enrollmentId);
    if (enrollmentRef && enrollmentMap.has(enrollmentRef)) {
      return enrollmentMap.get(enrollmentRef).class || null;
    }
    return null;
  };

  const extractReason = (log) => {
    const detail = log.details || {};
    return detail.reason || detail.notes || detail.note || null;
  };

  const timeline = logs.items.map((log) => {
    const classContext = findClassContext(log);
    return {
      id: log._id,
      action: log.action,
      summary: log.summary,
      class: classContext
        ? {
          id: classContext.id,
          name: classContext.name,
        }
        : null,
      actorName: log.actorName,
      actorRole: log.actorRole,
      createdAt: log.createdAt,
      reason: extractReason(log),
      tags: Array.isArray(log.tags) ? log.tags.filter(Boolean) : [],
    };
  });

  res.json({
    student: {
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentCode: student.studentCode,
    },
    timeline,
    total: logs.total,
    pageInfo: logs.pageInfo,
  });
});

// @desc    Update student enrollment count
// @route   PATCH /api/students/:id/enrollment-count
// @access  Private (Manager)
const updateEnrollmentCount = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  const { count, increment = true } = req.body;

  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (increment) {
    student.enrollmentCount += (count || 1);
  } else {
    student.enrollmentCount = Math.max(0, student.enrollmentCount - (count || 1));
  }

  await student.save();

  res.json({
    success: true,
    enrollmentCount: student.enrollmentCount,
    message: 'Enrollment count updated successfully'
  });
});

// @desc    Update student balance (sessions)
// @route   PATCH /api/students/:id/balance
// @access  Private (Manager)
const updateBalance = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  const { balance, increment = true } = req.body;

  const student = await User.findOne({ _id: id, school: schoolId, role: 'student' });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (increment) {
    student.balance += (balance || 1);
  } else {
    student.balance = Math.max(0, student.balance - (balance || 1));
  }

  await student.save();

  res.json({
    success: true,
    balance: student.balance,
    message: 'Balance updated successfully'
  });
});

// @desc    Search students
// @route   GET /api/students/search
// @access  Private (Manager)
const searchStudents = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const searchRegex = new RegExp(q, 'i');

  // Check if the query looks like a MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(q.trim());

  let searchQuery = {
    school: schoolId,
    role: 'student',
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { 'contact.phone1': searchRegex },
      { studentCode: searchRegex }
    ]
  };

  // If it looks like an ObjectId, also search by exact _id match
  if (isObjectId) {
    searchQuery.$or.push({ _id: q.trim() });
  }

  console.log('Search query:', { q, isObjectId, searchQuery });

  const students = await User.find(searchQuery).select('-password');

  console.log('Search results count:', students.length);

  res.json(students);
});

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentEnrollments,
  getStudentPayments,
  unenrollStudent,
  transferStudent,
  suspendStudent,
  unsuspendStudent,
  getStudentHistory,
  updateEnrollmentCount,
  updateBalance,
  searchStudents,
  enrollStudent
};

// ========== Scan endpoint (exported below for router wiring) ==========
// @desc    Resolve student by studentCode and return active enrollments with balances
// @route   GET /api/students/scan/:studentCode
// @access  Private (Manager/Staff)
module.exports.scanByCode = asyncHandler(async (req, res) => {
  const schoolId = (req.user?.school && (req.user.school._id || req.user.school))?.toString?.();
  const { studentCode } = req.params || {};
  if (!schoolId) {
    res.status(400);
    throw new Error('User is not assigned to a school');
  }
  if (!studentCode) {
    res.status(400);
    throw new Error('studentCode is required');
  }

  const student = await User.findOne({ school: schoolId, role: 'student', studentCode: studentCode.toUpperCase() })
    .select('firstName lastName studentCode');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const enrollments = await Enrollment.find({ schoolId, studentId: student._id, status: 'active' })
    .populate('classId', 'name schedules')
    .lean();
  const items = enrollments.map(e => ({
    enrollmentId: e._id,
    class: e.classId,
    pricingSnapshot: e.pricingSnapshot,
    balance: e.balance,
    sessionCounters: e.sessionCounters,
  }));

  res.json({ student, enrollments: items });
});
