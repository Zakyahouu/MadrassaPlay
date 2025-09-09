const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

// @desc    Get all enrollments for a school
// @route   GET /api/enrollments
// @access  Private (Manager)
const getEnrollments = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  const enrollments = await Enrollment.find({ schoolId })
    .populate('studentId', 'firstName lastName studentCode email phone')
    .populate('classId', 'name teacherId roomId schedules price')
    .populate('classId.teacherId', 'firstName lastName')
    .populate('classId.roomId', 'name')
    .sort({ createdAt: -1 });

  res.json(enrollments);
});

// @desc    Get enrollments for a specific student (manager/staff within school; student only self)
// @route   GET /api/enrollments/student/:studentId
// @access  Private (Manager, Staff, Student [self])
const getStudentEnrollments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { school: schoolId } = req.user;
  const role = req.user.role;
  if (role === 'student' && req.user._id.toString() !== studentId) {
    res.status(403);
    throw new Error('Not authorized to view other students');
  }
  
  // Verify student belongs to manager's school
  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  const enrollments = await Enrollment.find({ studentId, schoolId })
    .populate('classId', 'name teacherId roomId schedules price paymentCycle')
    .populate('classId.teacherId', 'firstName lastName')
    .populate('classId.roomId', 'name')
    .sort({ createdAt: -1 });

  res.json(enrollments);
});

// @desc    Get enrollments for a specific class
// @route   GET /api/enrollments/class/:classId
// @access  Private (Manager)
const getClassEnrollments = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { school: schoolId } = req.user;
  
  // Verify class belongs to manager's school
  const classItem = await Class.findOne({ _id: classId, schoolId });
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }
  
  const enrollments = await Enrollment.find({ classId, schoolId })
    .populate('studentId', 'firstName lastName studentCode email phone')
    .sort({ createdAt: -1 });

  res.json(enrollments);
});

// @desc    Create new enrollment
// @route   POST /api/enrollments
// @access  Private (Manager)
const createEnrollment = asyncHandler(async (req, res) => {
  const { 
    studentId, 
    classId, 
    startDate, 
    endDate, 
    totalSessions, 
    totalAmount, 
    notes 
  } = req.body;
  
  const { school: schoolId } = req.user;
  
  // Validation
  if (!studentId || !classId || !startDate || !endDate || !totalSessions || !totalAmount) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }
  
  // Verify student belongs to manager's school
  const student = await User.findOne({ _id: studentId, school: schoolId, role: 'student' });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  // Verify class belongs to manager's school
  const classItem = await Class.findOne({ _id: classId, schoolId });
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }
  
  // Check if student is already enrolled in this class
  const existingEnrollment = await Enrollment.findOne({ studentId, classId });
  if (existingEnrollment) {
    res.status(400);
    throw new Error('Student is already enrolled in this class');
  }
  
  // Check class capacity
  const currentEnrollments = await Enrollment.countDocuments({ classId, status: 'active' });
  if (currentEnrollments >= classItem.capacity) {
    res.status(400);
    throw new Error('Class is at full capacity');
  }
  
  // Create enrollment
  const enrollment = await Enrollment.create({
    studentId,
    classId,
    schoolId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalSessions: parseInt(totalSessions),
    totalAmount: parseFloat(totalAmount),
    notes: notes?.trim()
  });
  
  // Add student to class enrolledStudents array
  await Class.findByIdAndUpdate(classId, {
    $push: { 
      enrolledStudents: { 
        studentId, 
        enrolledAt: new Date(),
        status: 'active'
      } 
    }
  });
  
  // Update student enrollment count
  await User.findByIdAndUpdate(studentId, {
    $inc: { enrollmentCount: 1 }
  });
  
  const populatedEnrollment = await Enrollment.findById(enrollment._id)
    .populate('studentId', 'firstName lastName studentCode')
    .populate('classId', 'name teacherId')
    .populate('classId.teacherId', 'firstName lastName');
  
  res.status(201).json({
    message: 'Student enrolled successfully',
    enrollment: populatedEnrollment
  });
});

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private (Manager)
const updateEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    startDate, 
    endDate, 
    totalSessions, 
    totalAmount, 
    sessionsCompleted, 
    sessionsAttended, 
    amountPaid, 
    status, 
    notes 
  } = req.body;
  
  const { school: schoolId } = req.user;
  
  const enrollment = await Enrollment.findOne({ _id: id, schoolId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  
  // Update fields
  if (startDate) enrollment.startDate = new Date(startDate);
  if (endDate) enrollment.endDate = new Date(endDate);
  if (totalSessions !== undefined) enrollment.totalSessions = parseInt(totalSessions);
  if (totalAmount !== undefined) enrollment.totalAmount = parseFloat(totalAmount);
  if (sessionsCompleted !== undefined) enrollment.sessionsCompleted = parseInt(sessionsCompleted);
  if (sessionsAttended !== undefined) enrollment.sessionsAttended = parseInt(sessionsAttended);
  if (amountPaid !== undefined) enrollment.amountPaid = parseFloat(amountPaid);
  if (status) enrollment.status = status;
  if (notes !== undefined) enrollment.notes = notes?.trim();
  
  // Validation
  if (enrollment.sessionsCompleted > enrollment.totalSessions) {
    res.status(400);
    throw new Error('Sessions completed cannot exceed total sessions');
  }
  
  if (enrollment.sessionsAttended > enrollment.sessionsCompleted) {
    res.status(400);
    throw new Error('Sessions attended cannot exceed sessions completed');
  }
  
  if (enrollment.amountPaid > enrollment.totalAmount) {
    res.status(400);
    throw new Error('Amount paid cannot exceed total amount');
  }
  
  await enrollment.save();
  
  const updatedEnrollment = await Enrollment.findById(id)
    .populate('studentId', 'firstName lastName studentCode')
    .populate('classId', 'name teacherId')
    .populate('classId.teacherId', 'firstName lastName');
  
  res.json({
    message: 'Enrollment updated successfully',
    enrollment: updatedEnrollment
  });
});

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Manager)
const deleteEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Robustly normalize school id to a string ObjectId
  const schoolRaw = req.user?.school;
  const schoolId = (schoolRaw && schoolRaw._id) ? schoolRaw._id : schoolRaw;
  const schoolIdStr = typeof schoolId === 'string' ? schoolId : (schoolId && schoolId.toString ? schoolId.toString() : '');

  if (!schoolIdStr) {
    res.status(400);
    throw new Error('Missing school context');
  }

  try {
    const enrollment = await Enrollment.findOne({ _id: id, schoolId: schoolIdStr });
    if (!enrollment) {
      res.status(404);
      throw new Error('Enrollment not found');
    }

  // Delete attendance and payments tied to this enrollment to free space
  await Attendance.deleteMany({ schoolId: enrollment.schoolId, enrollmentId: enrollment._id });
  await Payment.deleteMany({ schoolId: enrollment.schoolId, enrollmentId: enrollment._id });

    // Remove student from class enrolledStudents array
    await Class.findByIdAndUpdate(enrollment.classId, {
      $pull: { enrolledStudents: { studentId: enrollment.studentId } }
    });

    // Update student enrollment count and status
    const student = await User.findByIdAndUpdate(enrollment.studentId, {
      $inc: { enrollmentCount: -1 }
    }, { new: true });
    if (student && (student.enrollmentCount || 0) <= 0) {
      student.enrollmentStatus = 'not_enrolled';
      await student.save();
    }

    await enrollment.deleteOne();
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (err) {
    // Map common errors to friendly responses
    const msg = typeof err?.message === 'string' ? err.message : 'Failed to delete enrollment';
    if (/Cast to ObjectId failed|CastError/i.test(msg)) {
      return res.status(400).json({ message: 'Invalid enrollment id' });
    }
    if (!res.headersSent) {
      return res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 500).json({ message: msg });
    }
  }
});

// DEPRECATED: Inline attendance endpoint, please use /api/attendance/mark
// Kept for backward compatibility, but now just responds with guidance
const recordAttendance = asyncHandler(async (req, res) => {
  res.status(410).json({
    message: 'This endpoint is deprecated. Please use POST /api/attendance/mark with { enrollmentId, date, status }.'
  });
});

// @desc    Get available classes for enrollment
// @route   GET /api/enrollments/available-classes
// @access  Private (Manager)
const getAvailableClasses = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  const classes = await Class.find({ 
    schoolId, 
    status: 'active' 
  })
  .populate('teacherId', 'firstName lastName')
  .populate('roomId', 'name')
  .populate('enrolledStudents', 'studentId');
  
  // Add enrollment count and availability info
  const classesWithAvailability = classes.map(classItem => {
    const list = Array.isArray(classItem.enrolledStudents) ? classItem.enrolledStudents : [];
    const currentEnrollments = list.filter(e => e && e.status === 'active').length;
    const isAvailable = currentEnrollments < classItem.capacity;
    
    return {
      ...classItem.toObject(),
      currentEnrollments,
      isAvailable,
      remainingSpots: classItem.capacity - currentEnrollments
    };
  });
  
  res.json(classesWithAvailability);
});

// Utils
function toUtcDateOnly(dateStr) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// @desc    Get a single enrollment summary (attendance + payments derived)
// @route   GET /api/enrollments/:id/summary
// @access  Private (Manager)
const getEnrollmentSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = (req.user.school?._id || req.user.school || '').toString();
  const enrollment = await Enrollment.findOne({ _id: id, schoolId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  const klass = await Class.findById(enrollment.classId).select('absenceRule');
  const counters = enrollment.sessionCounters || { attended: 0, absent: 0 };
  const charged = counters.attended + (klass?.absenceRule ? counters.absent : 0);

  // Payments aggregated
  const paymentsAgg = await Payment.aggregate([
    { $match: { schoolId: enrollment.schoolId, enrollmentId: enrollment._id } },
    {
      $group: {
        _id: '$enrollmentId',
        pay_sessions: { $sum: { $cond: [{ $eq: ['$kind', 'pay_sessions'] }, '$amount', 0] } },
        pay_cycles: { $sum: { $cond: [{ $eq: ['$kind', 'pay_cycles'] }, '$amount', 0] } },
        total: { $sum: '$amount' },
      },
    },
  ]);
  const p = paymentsAgg[0] || { pay_sessions: 0, pay_cycles: 0, total: 0 };
  const snap = enrollment.pricingSnapshot || {};

  // Derived coverage
  let sessionsCovered = 0;
  if (snap.paymentModel === 'per_session' && snap.sessionPrice > 0) {
    sessionsCovered = Math.floor(p.pay_sessions / snap.sessionPrice);
  } else if (snap.paymentModel === 'per_cycle' && snap.cyclePrice > 0 && snap.cycleSize > 0) {
    const cyclesPaid = Math.floor(p.pay_cycles / snap.cyclePrice);
    sessionsCovered = cyclesPaid * snap.cycleSize;
  }
  const owedSessions = Math.max(0, charged - sessionsCovered);
  const owedAmount = snap.paymentModel === 'per_session' && snap.sessionPrice
    ? owedSessions * snap.sessionPrice
    : 0; // For per_cycle, show sessions owed; amount may be partial and handled in UI

  res.json({
    enrollmentId: enrollment._id,
    pricingSnapshot: snap,
    sessionCounters: counters,
    attendanceTotalsDerived: { charged, present: counters.attended, absent: counters.absent },
  paymentsTotalsDerived: p,
    owedSummary: { owedSessions, owedAmount },
  });
});

// Reusable builder: compute roster items for a class on a specific UTC date-only
async function buildClassEnrollmentSummaries(schoolId, classId, dateOnly) {
  const klass = await Class.findOne({ _id: classId, schoolId }).select('absenceRule schoolId');
  if (!klass) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  const enrollments = await Enrollment.find({ classId, schoolId, status: 'active' })
    .populate('studentId', 'firstName lastName studentCode');
  const ids = enrollments.map(e => e._id);

  const todays = await Attendance.find({ enrollmentId: { $in: ids }, date: dateOnly });
  const attendanceMap = new Map(todays.map(a => [a.enrollmentId.toString(), a.status]));

  // Aggregate payments by enrollment
  const paymentsAgg = await Payment.aggregate([
    { $match: { schoolId: klass.schoolId || new mongoose.Types.ObjectId(schoolId), enrollmentId: { $in: ids } } },
    {
      $group: {
        _id: '$enrollmentId',
        pay_sessions: { $sum: { $cond: [{ $eq: ['$kind', 'pay_sessions'] }, '$amount', 0] } },
        pay_cycles: { $sum: { $cond: [{ $eq: ['$kind', 'pay_cycles'] }, '$amount', 0] } },
      },
    },
  ]);
  const payMap = new Map(paymentsAgg.map(x => [x._id.toString(), x]));

  const items = enrollments.map(e => {
    const counters = e.sessionCounters || { attended: 0, absent: 0 };
    const charged = counters.attended + (klass.absenceRule ? counters.absent : 0);
    const p = payMap.get(e._id.toString()) || { pay_sessions: 0, pay_cycles: 0 };
    const snap = e.pricingSnapshot || {};
    let sessionsCovered = 0;
    if (snap.paymentModel === 'per_session' && snap.sessionPrice > 0) {
      sessionsCovered = Math.floor(p.pay_sessions / snap.sessionPrice);
    } else if (snap.paymentModel === 'per_cycle' && snap.cyclePrice > 0 && snap.cycleSize > 0) {
      const cyclesPaid = Math.floor(p.pay_cycles / snap.cyclePrice);
      sessionsCovered = cyclesPaid * snap.cycleSize;
    }
    const owedSessions = Math.max(0, charged - sessionsCovered);
    return {
      enrollmentId: e._id,
      student: e.studentId,
      todayStatus: attendanceMap.get(e._id.toString()) || null,
      balance: e.balance,
      charged,
      sessionCounters: { attended: counters.attended || 0, absent: counters.absent || 0 },
      sessionsCovered,
      owedSessions,
      payments: p,
      pricingSnapshot: {
        paymentModel: snap.paymentModel,
        sessionPrice: snap.sessionPrice,
        cyclePrice: snap.cyclePrice,
        cycleSize: snap.cycleSize,
      },
    };
  });
  return items;
}

// @desc    Get roster summaries for a class on a date
// @route   GET /api/enrollments/class/:classId/summaries?date=YYYY-MM-DD
// @access  Private (Manager)
const getClassEnrollmentSummaries = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error('date is required');
  }
  const schoolId = (req.user.school?._id || req.user.school || '').toString();
  const dateOnly = toUtcDateOnly(date);
  const items = await buildClassEnrollmentSummaries(schoolId, classId, dateOnly);
  res.json({ classId, date: dateOnly, items });
});

module.exports = {
  getEnrollments,
  getStudentEnrollments,
  getClassEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  recordAttendance,
  getAvailableClasses,
  getEnrollmentSummary,
  getClassEnrollmentSummaries,
  buildClassEnrollmentSummaries,
};
