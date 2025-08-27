// server/controllers/classController.js

const Class = require('../models/Class');
const Room = require('../models/Room');
const User = require('../models/User');
const SchoolCatalog = require('../models/SchoolCatalog');
const asyncHandler = require('express-async-handler');

// @desc    Get all classes for a school
// @route   GET /api/classes
// @access  Private (Manager)
const getClasses = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to access classes');
  }
  
  const classes = await Class.find({ schoolId })
    .populate('teacherId', 'firstName lastName')
    .populate('roomId', 'name capacity')
    .sort({ createdAt: -1 });
  
  res.json(classes);
});

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private (Manager)
const getClass = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  const classItem = await Class.findOne({ _id: id, schoolId })
    .populate('teacherId', 'firstName lastName email contact.phone1')
    .populate('roomId', 'name capacity activityTypes')
    .populate('enrolledStudents.studentId', 'firstName lastName email studentCode');
  
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }
  
  res.json(classItem);
});

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Manager)
const createClass = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to create classes');
  }
  
  const {
    name,
    catalogItem,
    teacherId,
    roomId,
    schedule,
    capacity,
    enrollmentPeriod,
    paymentCycle,
    price,
    teacherCut,
    absenceRule,
    description
  } = req.body;
  
  // Validate catalog item exists
  const schoolCatalog = await SchoolCatalog.findOne({ schoolId });
  if (!schoolCatalog) {
    res.status(404);
    throw new Error('School catalog not found');
  }
  
  // Validate teacher exists and is assigned to school
  const teacher = await User.findOne({ _id: teacherId, role: 'teacher', school: schoolId });
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  
  // Validate room exists and belongs to school
  const room = await Room.findOne({ _id: roomId, schoolId });
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }
  
  // Validate time format
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
    res.status(400);
    throw new Error('Invalid time format. Use HH:MM format');
  }
  
  // Validate start time is before end time
  if (schedule.startTime >= schedule.endTime) {
    res.status(400);
    throw new Error('Start time must be before end time');
  }
  
  // Validate capacity doesn't exceed room capacity (unless confirmed)
  if (capacity > room.capacity) {
    res.status(400);
    throw new Error(`Capacity (${capacity}) exceeds room capacity (${room.capacity})`);
  }
  
  // Create class instance to check conflicts
  const newClass = new Class({
    name,
    schoolId,
    catalogItem,
    teacherId,
    roomId,
    schedule,
    capacity,
    enrollmentPeriod: {
      startDate: new Date(enrollmentPeriod.startDate),
      endDate: new Date(enrollmentPeriod.endDate)
    },
    paymentCycle,
    price,
    teacherCut,
    absenceRule,
    description
  });
  
  // Check for scheduling conflicts
  const conflict = await newClass.hasConflict();
  if (conflict) {
    if (conflict.type === 'room') {
      res.status(409);
      throw new Error(`Room is already booked during this time by class: ${conflict.conflict.name}`);
    } else if (conflict.type === 'teacher') {
      res.status(409);
      throw new Error(`Teacher is already booked during this time by class: ${conflict.conflict.name}`);
    }
  }
  
  // Save the class
  const savedClass = await newClass.save();
  
  // Populate references for response
  const populatedClass = await Class.findById(savedClass._id)
    .populate('teacherId', 'firstName lastName')
    .populate('roomId', 'name capacity');
  
  res.status(201).json({
    success: true,
    class: populatedClass,
    message: 'Class created successfully'
  });
});

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Manager)
const updateClass = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  const classItem = await Class.findOne({ _id: id, schoolId });
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }
  
  const {
    name,
    teacherId,
    roomId,
    schedule,
    capacity,
    enrollmentPeriod,
    paymentCycle,
    price,
    teacherCut,
    absenceRule,
    description,
    status
  } = req.body;
  
  // Validate teacher if being updated
  if (teacherId && teacherId !== classItem.teacherId.toString()) {
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', school: schoolId });
    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found');
    }
    classItem.teacherId = teacherId;
  }
  
  // Validate room if being updated
  if (roomId && roomId !== classItem.roomId.toString()) {
    const room = await Room.findOne({ _id: roomId, schoolId });
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }
    classItem.roomId = roomId;
  }
  
  // Validate schedule if being updated
  if (schedule) {
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
      res.status(400);
      throw new Error('Invalid time format. Use HH:MM format');
    }
    
    if (schedule.startTime >= schedule.endTime) {
      res.status(400);
      throw new Error('Start time must be before end time');
    }
    
    classItem.schedule = schedule;
  }
  
  // Update other fields
  if (name !== undefined) classItem.name = name;
  if (capacity !== undefined) classItem.capacity = capacity;
  if (enrollmentPeriod !== undefined) {
    classItem.enrollmentPeriod = {
      startDate: new Date(enrollmentPeriod.startDate),
      endDate: new Date(enrollmentPeriod.endDate)
    };
  }
  if (paymentCycle !== undefined) classItem.paymentCycle = paymentCycle;
  if (price !== undefined) classItem.price = price;
  if (teacherCut !== undefined) classItem.teacherCut = teacherCut;
  if (absenceRule !== undefined) classItem.absenceRule = absenceRule;
  if (description !== undefined) classItem.description = description;
  if (status !== undefined) classItem.status = status;
  
  // Check for conflicts if schedule, teacher, or room changed
  if (schedule || teacherId || roomId) {
    const conflict = await classItem.hasConflict();
    if (conflict) {
      if (conflict.type === 'room') {
        res.status(409);
        throw new Error(`Room is already booked during this time by class: ${conflict.conflict.name}`);
      } else if (conflict.type === 'teacher') {
        res.status(409);
        throw new Error(`Teacher is already booked during this time by class: ${conflict.conflict.name}`);
      }
    }
  }
  
  const updatedClass = await classItem.save();
  
  const populatedClass = await Class.findById(updatedClass._id)
    .populate('teacherId', 'firstName lastName')
    .populate('roomId', 'name capacity');
  
  res.json({
    success: true,
    class: populatedClass,
    message: 'Class updated successfully'
  });
});

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Manager)
const deleteClass = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  const { id } = req.params;
  
  const classItem = await Class.findOne({ _id: id, schoolId });
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }
  
  // Check if class has enrolled students
  if (classItem.enrolledStudents.length > 0) {
    res.status(400);
    throw new Error('Cannot delete class with enrolled students. Please deactivate instead.');
  }
  
  await classItem.deleteOne();
  
  res.json({
    success: true,
    message: 'Class deleted successfully'
  });
});

// @desc    Get available teachers
// @route   GET /api/classes/available-teachers
// @access  Private (Manager)
const getAvailableTeachers = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school');
  }
  
  const teachers = await User.find({ role: 'teacher', school: schoolId })
    .select('firstName lastName email contact.phone1 experience activities')
    .sort({ firstName: 1, lastName: 1 });
  
  res.json(teachers);
});

// @desc    Get available rooms
// @route   GET /api/classes/available-rooms
// @access  Private (Manager)
const getAvailableRooms = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school');
  }
  
  const rooms = await Room.find({ schoolId })
    .select('name capacity activityTypes')
    .sort({ name: 1 });
  
  res.json(rooms);
});

// @desc    Get catalog items for class creation
// @route   GET /api/classes/catalog-items
// @access  Private (Manager)
const getCatalogItems = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;
  
  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school');
  }
  
  const catalog = await SchoolCatalog.findOne({ schoolId });
  if (!catalog) {
    res.status(404);
    throw new Error('School catalog not found');
  }
  
  // Flatten catalog items with type information
  const catalogItems = [];
  
  // Support Lessons
  catalog.supportLessons.forEach(item => {
    const fullName = `${item.level} - ${item.grade} - ${item.subject}`;
    catalogItems.push({
      _id: item._id,
      type: 'supportLessons',
      name: fullName.length > 100 ? fullName.substring(0, 97) + '...' : fullName,
      level: item.level,
      grade: item.grade,
      subject: item.subject,
      stream: item.stream
    });
  });
  
  // Review Courses
  catalog.reviewCourses.forEach(item => {
    const fullName = `${item.level} - ${item.grade} - ${item.subject}`;
    catalogItems.push({
      _id: item._id,
      type: 'reviewCourses',
      name: fullName.length > 100 ? fullName.substring(0, 97) + '...' : fullName,
      level: item.level,
      grade: item.grade,
      subject: item.subject,
      stream: item.stream
    });
  });
  
  // Vocational Trainings
  catalog.vocationalTrainings.forEach(item => {
    const fullName = `${item.field} - ${item.specialty}`;
    catalogItems.push({
      _id: item._id,
      type: 'vocationalTrainings',
      name: fullName.length > 100 ? fullName.substring(0, 97) + '...' : fullName,
      field: item.field,
      specialty: item.specialty,
      certificateType: item.certificateType
    });
  });
  
  // Languages
  catalog.languages.forEach(item => {
    const levelsText = item.levels.join(', ');
    const fullName = `${item.language} - ${levelsText}`;
    catalogItems.push({
      _id: item._id,
      type: 'languages',
      name: fullName.length > 100 ? fullName.substring(0, 97) + '...' : fullName,
      language: item.language,
      levels: item.levels
    });
  });
  
  // Other Activities
  catalog.otherActivities.forEach(item => {
    const fullName = `${item.activityType} - ${item.activityName}`;
    catalogItems.push({
      _id: item._id,
      type: 'otherActivities',
      name: fullName.length > 100 ? fullName.substring(0, 97) + '...' : fullName,
      activityType: item.activityType,
      activityName: item.activityName
    });
  });
  
  res.json(catalogItems);
});

// @desc    Check scheduling conflicts
// @route   POST /api/classes/check-conflicts
// @access  Private (Manager)
const checkConflicts = asyncHandler(async (req, res) => {
  const { schedule, teacherId, roomId, excludeClassId } = req.body;
  const { school: schoolId } = req.user;
  
  const Class = require('../models/Class');
  
  // Check room conflicts
  const roomConflict = await Class.findOne({
    _id: { $ne: excludeClassId },
    schoolId,
    roomId,
    status: { $in: ['active'] },
    'schedule.dayOfWeek': schedule.dayOfWeek,
    $or: [
      {
        'schedule.startTime': { $lte: schedule.startTime },
        'schedule.endTime': { $gt: schedule.startTime }
      },
      {
        'schedule.startTime': { $lt: schedule.endTime },
        'schedule.endTime': { $gte: schedule.endTime }
      },
      {
        'schedule.startTime': { $gte: schedule.startTime },
        'schedule.endTime': { $lte: schedule.endTime }
      }
    ]
  }).populate('teacherId', 'firstName lastName');
  
  if (roomConflict) {
    return res.json({
      hasConflict: true,
      type: 'room',
      message: `Room is already booked during this time by class: ${roomConflict.name} (Teacher: ${roomConflict.teacherId.firstName} ${roomConflict.teacherId.lastName})`,
      conflict: roomConflict
    });
  }
  
  // Check teacher conflicts
  const teacherConflict = await Class.findOne({
    _id: { $ne: excludeClassId },
    schoolId,
    teacherId,
    status: { $in: ['active'] },
    'schedule.dayOfWeek': schedule.dayOfWeek,
    $or: [
      {
        'schedule.startTime': { $lte: schedule.startTime },
        'schedule.endTime': { $gt: schedule.startTime }
      },
      {
        'schedule.startTime': { $lt: schedule.endTime },
        'schedule.endTime': { $gte: schedule.endTime }
      },
      {
        'schedule.startTime': { $gte: schedule.startTime },
        'schedule.endTime': { $lte: schedule.endTime }
      }
    ]
  }).populate('roomId', 'name');
  
  if (teacherConflict) {
    return res.json({
      hasConflict: true,
      type: 'teacher',
      message: `Teacher is already booked during this time by class: ${teacherConflict.name} (Room: ${teacherConflict.roomId.name})`,
      conflict: teacherConflict
    });
  }
  
  res.json({
    hasConflict: false,
    message: 'No scheduling conflicts found'
  });
});

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getAvailableTeachers,
  getAvailableRooms,
  getCatalogItems,
  checkConflicts
};
