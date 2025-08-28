const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');

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

// @desc    Get enrollments for a specific student
// @route   GET /api/enrollments/student/:studentId
// @access  Private (Manager)
const getStudentEnrollments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { school: schoolId } = req.user;
  
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
  const { school: schoolId } = req.user;
  
  const enrollment = await Enrollment.findOne({ _id: id, schoolId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  
  // Remove student from class enrolledStudents array
  await Class.findByIdAndUpdate(enrollment.classId, {
    $pull: { enrolledStudents: { studentId: enrollment.studentId } }
  });
  
  // Update student enrollment count
  await User.findByIdAndUpdate(enrollment.studentId, {
    $inc: { enrollmentCount: -1 }
  });
  
  await enrollment.remove();
  
  res.json({ message: 'Enrollment deleted successfully' });
});

// @desc    Record attendance for a session
// @route   POST /api/enrollments/:id/attendance
// @access  Private (Manager)
const recordAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sessionDate, status, notes } = req.body;
  
  const { school: schoolId } = req.user;
  
  if (!sessionDate || !status) {
    res.status(400);
    throw new Error('Session date and status are required');
  }
  
  if (!['present', 'absent', 'late'].includes(status)) {
    res.status(400);
    throw new Error('Invalid attendance status');
  }
  
  const enrollment = await Enrollment.findOne({ _id: id, schoolId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  
  // Add attendance record
  enrollment.attendanceHistory.push({
    sessionDate: new Date(sessionDate),
    status,
    notes: notes?.trim()
  });
  
  // Update session counts
  enrollment.sessionsCompleted += 1;
  if (status === 'present') {
    enrollment.sessionsAttended += 1;
  }
  
  await enrollment.save();
  
  res.json({
    message: 'Attendance recorded successfully',
    enrollment
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
    const currentEnrollments = classItem.enrolledStudents.filter(e => e.status === 'active').length;
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

module.exports = {
  getEnrollments,
  getStudentEnrollments,
  getClassEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  recordAttendance,
  getAvailableClasses
};
