// server/controllers/classController.js

const Class = require('../models/Class');
const User = require('../models/User');
const School = require('../models/School');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Manager or Pedagogy Staff
const createClass = async (req, res) => {
  try {
    const { name, school, teacher, schedule, subject, level, paymentRule, students } = req.body;
    if (!name || !school || !teacher || !schedule || !subject || !level || !paymentRule) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const newClass = await Class.create({
      name,
      school,
      teacher,
      schedule,
      subject,
      level,
      paymentRule,
      students: students || []
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all classes for a school
// @route   GET /api/classes?school=schoolId
// @access  Private/Manager or Staff
const getClasses = async (req, res) => {
  try {
    const { school } = req.query;
    const query = school ? { school } : {};
    const classes = await Class.find(query).populate('teacher students');
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Manager or Pedagogy Staff
const updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const updates = req.body;
    const updatedClass = await Class.findByIdAndUpdate(classId, updates, { new: true });
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found.' });
    }
    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Manager or Pedagogy Staff
const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const deleted = await Class.findByIdAndDelete(classId);
    if (!deleted) {
      return res.status(404).json({ message: 'Class not found.' });
    }
    res.status(200).json({ message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
};

// @desc    Get classes for the logged-in student
// @route   GET /api/classes/my
// @access  Private
const getMyClasses = async (req, res) => {
  try {
    const classes = await Class.find({ students: req.user._id }).select('name subject level teacher students');
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports.getMyClasses = getMyClasses;

// @desc    Get classes taught by the logged-in teacher
// @route   GET /api/classes/teaching
// @access  Private/Teacher
const getMyTeachingClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user._id }).select('name subject level students');
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports.getMyTeachingClasses = getMyTeachingClasses;
