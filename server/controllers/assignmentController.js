// server/controllers/assignmentController.js

const Assignment = require('../models/Assignment');
const User = require('../models/User'); // We need the User model to find students

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private/Teacher
const createAssignment = async (req, res) => {
  try {
    const { title, gameCreations, startDate, endDate } = req.body;

    // For now, we will assign it to all students of the teacher.
    // Later, this will be replaced by a Class/Group ID.
    const students = await User.find({ role: 'student', school: req.user.school });
    const studentIds = students.map(student => student._id);

    // Basic validation
    if (!title || !gameCreations || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const assignment = await Assignment.create({
      title,
      gameCreations,
      startDate,
      endDate,
      students: studentIds,
      teacher: req.user._id,
    });

    if (assignment) {
      res.status(201).json(assignment);
    } else {
      res.status(400).json({ message: 'Invalid assignment data.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all assignments for the logged-in student
// @route   GET /api/assignments/my-assignments
// @access  Private/Student
const getMyAssignments = async (req, res) => {
  try {
    // Find all assignments where the 'students' array contains the logged-in user's ID
    const assignments = await Assignment.find({ students: req.user._id });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createAssignment,
  getMyAssignments,
};
