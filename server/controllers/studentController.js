
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');

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
  
  const students = await Student.find({ schoolId }).select('-password');
  
  res.json(students);
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Manager)
const getStudent = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  const student = await Student.findOne({ _id: id, schoolId }).select('-password');
  
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  res.json(student);
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
    phone,
    address,
    educationLevel,
    username,
    password,
    studentCode
  } = req.body;

  // Generate student code if not provided
  const finalStudentCode = studentCode || Student.generateStudentCode();

  // Check if email already exists
  const emailExists = await Student.findOne({ email });
  if (emailExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  // Check if username already exists
  const usernameExists = await Student.findOne({ username });
  if (usernameExists) {
    res.status(400);
    throw new Error('Username already taken');
  }

  // Check if student code already exists
  const codeExists = await Student.findOne({ studentCode: finalStudentCode });
  if (codeExists) {
    res.status(400);
    throw new Error('Student code already exists');
  }

  const student = await Student.create({
    firstName,
    lastName,
    email,
    phone,
    address,
    educationLevel,
    username,
    password,
    studentCode: finalStudentCode,
    schoolId
  });

  const studentResponse = student.toObject();
  delete studentResponse.password;

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
  
  const student = await Student.findOne({ _id: id, schoolId });
  
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    educationLevel,
    username,
    status
  } = req.body;

  // Check if email already exists (if being updated)
  if (email && email !== student.email) {
    const emailExists = await Student.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already registered');
    }
  }

  // Check if username already exists (if being updated)
  if (username && username !== student.username) {
    const usernameExists = await Student.findOne({ username, _id: { $ne: id } });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username already taken');
    }
  }

  // Update fields
  if (firstName !== undefined) student.firstName = firstName;
  if (lastName !== undefined) student.lastName = lastName;
  if (email !== undefined) student.email = email;
  if (phone !== undefined) student.phone = phone;
  if (address !== undefined) student.address = address;
  if (educationLevel !== undefined) student.educationLevel = educationLevel;
  if (username !== undefined) student.username = username;
  if (status !== undefined) student.status = status;

  const updatedStudent = await student.save();
  
  const studentResponse = updatedStudent.toObject();
  delete studentResponse.password;

  res.json({
    success: true,
    student: studentResponse,
    message: 'Student updated successfully'
  });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Manager)
const deleteStudent = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  const student = await Student.findOne({ _id: id, schoolId });
  
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  await student.deleteOne();
  
  res.json({
    success: true,
    message: 'Student deleted successfully'
  });
});

// @desc    Get student enrollments
// @route   GET /api/students/:id/enrollments
// @access  Private (Manager)
const getStudentEnrollments = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  // Verify student exists and belongs to school
  const student = await Student.findOne({ _id: id, schoolId });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // For now, return mock data. In a real implementation, you would:
  // 1. Have an Enrollment model
  // 2. Query enrollments where studentId matches
  // 3. Populate class and teacher information
  
  const mockEnrollments = [
    {
      _id: '1',
      className: 'Math Support - Grade 5',
      teacher: 'Ahmed Benali',
      startDate: '2024-01-15',
      sessionsCount: 10,
      sessionsCompleted: 7,
      totalAmount: 2000,
      amountPaid: 2000,
      status: 'active',
      schedule: 'Monday, Wednesday 2:00 PM'
    }
  ];

  res.json(mockEnrollments);
});

// @desc    Get student payments
// @route   GET /api/students/:id/payments
// @access  Private (Manager)
const getStudentPayments = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  // Verify student exists and belongs to school
  const student = await Student.findOne({ _id: id, schoolId });
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
  
  const student = await Student.findOne({ _id: id, schoolId });
  
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
  
  const student = await Student.findOne({ _id: id, schoolId });
  
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
  
  const students = await Student.find({
    schoolId,
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { studentCode: searchRegex }
    ]
  }).select('-password');

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
  searchStudents
};
