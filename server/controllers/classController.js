const asyncHandler = require('express-async-handler');
const Class = require('../models/Class');
const User = require('../models/User');
const EnrollmentHistory = require('../models/EnrollmentHistory');
const mongoose = require('mongoose');

const createClass = asyncHandler(async (req, res) => {
  const { name, gradeLevel, subject, teacher, schedule } = req.body;
  const { schoolId } = req.params;

  const newClass = await Class.create({
    school: schoolId,
    name,
    gradeLevel,
    subject,
    teacher,
    schedule,
    createdBy: req.user._id
  });

  // Update teacher's classes
  await User.findByIdAndUpdate(teacher, {
    $push: { assignedClasses: newClass._id }
  });

  res.status(201).json(newClass);
});

const getSchoolClasses = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  
  const classes = await Class.find({ school: schoolId, isActive: true })
    .populate('teacher', 'name email')
    .populate('gradeLevel.system')
    .sort('gradeLevel.level');

  res.json(classes);
});

const updateClass = asyncHandler(async (req, res) => {
  const { name, schedule } = req.body;
  const { schoolId, classId } = req.params;

  const updatedClass = await Class.findOneAndUpdate(
    { _id: classId, school: schoolId },
    { name, schedule },
    { new: true }
  );

  if (!updatedClass) {
    res.status(404);
    throw new Error('Class not found');
  }

  res.json(updatedClass);
});

const enrollStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const { schoolId, classId } = req.params;

  const updatedClass = await Class.findOneAndUpdate(
    { _id: classId, school: schoolId },
    { $addToSet: { students: { $each: studentIds } } },
    { new: true }
  );

  // Update students' enrolled classes
  await User.updateMany(
    { _id: { $in: studentIds } },
    { $addToSet: { enrolledClasses: classId } }
  );

  res.json(updatedClass);
});

const transferStudent = asyncHandler(async (req, res) => {
  const { studentId, toClassId } = req.body;
  const { schoolId, classId: fromClassId } = req.params;

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove from current class
    await Class.findByIdAndUpdate(fromClassId, {
      $pull: { students: studentId }
    }, { session });

    // Add to new class
    await Class.findByIdAndUpdate(toClassId, {
      $addToSet: { students: studentId }
    }, { session });

    // Create transfer record
    await EnrollmentHistory.create([{
      student: studentId,
      class: fromClassId,
      action: 'transferred',
      fromClass: fromClassId,
      toClass: toClassId,
      performedBy: req.user._id
    }], { session });

    await session.commitTransaction();
    res.json({ message: 'Student transferred successfully' });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const getEnrollmentHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const history = await EnrollmentHistory.find({ student: studentId })
    .populate('class', 'name')
    .populate('fromClass', 'name')
    .populate('toClass', 'name')
    .populate('performedBy', 'name')
    .sort('-createdAt');

  res.json(history);
});

const assignTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.body;
  const { schoolId, classId } = req.params;

  const updatedClass = await Class.findOneAndUpdate(
    { _id: classId, school: schoolId },
    { teacher: teacherId },
    { new: true }
  ).populate('teacher', 'name email');

  if (!updatedClass) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Update teacher's assigned classes
  await User.findByIdAndUpdate(teacherId, {
    $addToSet: { assignedClasses: classId }
  });

  res.json(updatedClass);
});

const getTeacherSchedule = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  
  const teacherClasses = await Class.find({
    teacher: teacherId,
    isActive: true
  })
  .select('name subject schedule gradeLevel')
  .populate('gradeLevel.system', 'name');

  res.json(teacherClasses);
});

module.exports = {
  createClass,
  getSchoolClasses,
  updateClass,
  enrollStudents,
  transferStudent,
  getEnrollmentHistory,
  assignTeacher,
  getTeacherSchedule
};
