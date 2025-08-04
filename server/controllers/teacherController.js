// server/controllers/teacherController.js
const User = require('../models/User');

// @desc    Get all teachers for the manager's school
// @route   GET /api/teachers
// @access  Private/Manager
const getTeachersForSchool = async (req, res) => {
  try {
    // Manager only manages one school
    const schoolId = req.user.school;
    const teachers = await User.find({ role: 'teacher', school: schoolId }).select('name email');
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { getTeachersForSchool };
