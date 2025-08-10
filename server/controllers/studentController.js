
const User = require('../models/User');

// @desc    Get all students for the manager's school
// @route   GET /api/students
// @access  Private/Manager
const getStudentsForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'Manager is not linked to any school.' });
    }
    const students = await User.find({ role: 'student', school: schoolId }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new student for the manager's school
// @route   POST /api/students
// @access  Private/Manager
const createStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    const schoolId = req.user.school;
    const studentData = { ...req.body, school: schoolId, role: 'student' };

    const userExists = await User.findOne({ email: studentData.email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Assumes a pre-save hook in your User model handles password hashing
    const newStudent = new User(studentData);
    const savedStudent = await newStudent.save();

    const studentResponse = savedStudent.toObject();
    delete studentResponse.password;

    res.status(201).json({ message: "Student created successfully", student: studentResponse });
  } catch (error) {
    res.status(400).json({ message: "Error creating student", error: error.message });
  }
};

// @desc    Get a single student by ID
// @route   GET /api/students/:id
// @access  Private/Manager
const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');

    // Security check: ensure student exists, has 'student' role, and is in the manager's school
    if (!student || student.role !== 'student' || student.school.toString() !== req.user.school.toString()) {
      return res.status(404).json({ message: "Student not found in your school." });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student", error: error.message });
  }
};

// @desc    Update a student's information
// @route   PUT /api/students/:id
// @access  Private/Manager
const updateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student' || student.school.toString() !== req.user.school.toString()) {
      return res.status(404).json({ message: "Student not found in your school." });
    }

    // Prevent changing role or password via this endpoint
    const updateData = { ...req.body };
    delete updateData.role;
    delete updateData.password;

    const updatedStudent = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    res.status(200).json({ message: "Student updated successfully", student: updatedStudent });
  } catch (error) {
    res.status(400).json({ message: "Error updating student", error: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private/Manager
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student' || student.school.toString() !== req.user.school.toString()) {
      return res.status(404).json({ message: "Student not found in your school." });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
};

module.exports = {
  getStudentsForSchool,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
};
