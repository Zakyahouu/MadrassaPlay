const User = require('../models/User');
const ClassModel = require('../models/Class');
const SchoolCatalog = require('../models/SchoolCatalog');
const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const LoggingService = require('../services/loggingService');

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
    phone, // legacy key, map to contact.phone1
    phone2, // new optional phone 2
    address, // legacy key, map to contact.address
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

  const student = await User.create({
    firstName,
    lastName,
    email,
    contact: { phone1: phone, phone2, address },
    educationLevel,
    username,
    password,
    studentCode: finalStudentCode,
    role: 'student',
    school: schoolId
  });

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
    phone,
    phone2,
    address,
    educationLevel,
    username,
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
  if (phone !== undefined) student.contact = { ...(student.contact?.toObject?.() || student.contact || {}), phone1: phone };
  if (phone2 !== undefined) student.contact = { ...(student.contact?.toObject?.() || student.contact || {}), phone2 };
  if (address !== undefined) student.contact = { ...(student.contact?.toObject?.() || student.contact || {}), address };
  if (educationLevel !== undefined) student.educationLevel = educationLevel;
  if (username !== undefined) student.username = username;
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

  // Create Enrollment document first, to avoid partial state on failures
  const Enrollment = require('../models/Enrollment');
  
  // Check if enrollment already exists (idempotent behavior)
  const existingEnrollment = await Enrollment.findOne({ 
    studentId: student._id,
    classId: klass._id
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

  // For now, return mock data. In a real implementation, you would:
  // 1. Have a Payment model
  // 2. Query payments where studentId matches
  // 3. Include enrollment details
  
  const mockPayments = [
    {
      _id: '1',
      amount: 2000,
      method: 'cash',
      date: '2024-01-15',
      description: 'Payment for Math Support - Grade 5',
      status: 'completed'
    }
  ];

  res.json(mockPayments);
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
      { name: searchRegex },
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
