
const User = require('../models/User'); // Using the User model instead of a separate Teacher model
const bcrypt = require('bcryptjs');

// @desc    Get all teachers for the manager's school
// @route   GET /api/teachers
const getTeachersForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ message: "User is not associated with a school." });
    }
    // Find users with the role 'teacher' belonging to the manager's school
    const teachers = await User.find({ role: 'teacher', school: schoolId }).select('-password');
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
};

// @desc    Create a new teacher for the manager's school
// @route   POST /api/teachers
const createTeacher = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password (since no pre-save hook currently)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Provide defaults for required teacher fields if not supplied
    const teacherData = {
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      school: schoolId,
      subject: req.body.subject || 'General',
      department: req.body.department || 'General',
      experience: typeof req.body.experience === 'number' ? req.body.experience : 0,
      status: req.body.status || 'active',
      phone: req.body.phone || ''
    };

    const newTeacher = new User(teacherData);
    const savedTeacher = await newTeacher.save();
    const teacherResponse = savedTeacher.toObject();
    delete teacherResponse.password;
    res.status(201).json({ message: 'Teacher created successfully', teacher: teacherResponse });
  } catch (error) {
    res.status(400).json({ message: 'Error creating teacher', error: error.message });
  }
};

// @desc    Get a single teacher by their ID (ensuring they are in the manager's school)
// @route   GET /api/teachers/:id
const getTeacherById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    // Security check: ensure the user exists, is a teacher, and belongs to the manager's school
    if (!user || user.role !== 'teacher' || user.school.toString() !== req.user.school.toString()) {
      return res.status(404).json({ message: "Teacher not found in your school" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher", error: error.message });
  }
};

// @desc    Update a teacher's information (ensuring they are in the manager's school)
// @route   PUT /api/teachers/:id
const updateTeacher = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        // Security check: ensure user is a teacher in the manager's school
        if (!user || user.role !== 'teacher' || user.school.toString() !== req.user.school.toString()) {
            return res.status(404).json({ message: "Teacher not found in your school" });
        }
        
        // Prevent changing role or password via this endpoint
        const updateData = { ...req.body };
        delete updateData.role; 
        delete updateData.password;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ message: "Teacher updated successfully", teacher: updatedUser });
    } catch (error) {
        res.status(400).json({ message: "Error updating teacher", error: error.message });
    }
};

// @desc    Delete a teacher (ensuring they are in the manager's school)
// @route   DELETE /api/teachers/:id
const deleteTeacher = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        // Security check: ensure user is a teacher in the manager's school
        if (!user || user.role !== 'teacher' || user.school.toString() !== req.user.school.toString()) {
            return res.status(404).json({ message: "Teacher not found in your school" });
        }
        
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Teacher deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting teacher", error: error.message });
    }
};

module.exports = {
  getTeachersForSchool,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
