const User = require('../models/User');

// @desc    Get all students for the manager's school
// @route   GET /api/students
// @access  Private/Manager
const getStudentsForSchool = async (req, res) => {
  try {
    // Only allow managers to see students in their own school
    let schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'Manager is not linked to any school.' });
    }
    const students = await User.find({ role: 'student', school: schoolId }).select('name email _id');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { getStudentsForSchool };
