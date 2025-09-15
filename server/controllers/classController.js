// server/controllers/classController.js

const Class = require('../models/Class');
const Room = require('../models/Room');
const User = require('../models/User');
const SchoolCatalog = require('../models/SchoolCatalog');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs-extra');
const ClassResource = require('../models/ClassResource');

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
    schedules,
    capacity,
    enrollmentPeriod,
  paymentCycle,
  price,
  paymentModel: bodyPaymentModel,
  sessionPrice: bodySessionPrice,
  cycleSize: bodyCycleSize,
  cyclePrice: bodyCyclePrice,
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
  
  // Validate schedules
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    res.status(400);
    throw new Error('At least one schedule is required');
  }

  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  
  for (const schedule of schedules) {
    if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
      res.status(400);
      throw new Error('Invalid time format. Use HH:MM format');
    }
    
    // Validate start time is before end time
    if (schedule.startTime >= schedule.endTime) {
      res.status(400);
      throw new Error('Start time must be before end time');
    }
  }
  
  // Validate capacity doesn't exceed room capacity (unless confirmed)
  if (capacity > room.capacity) {
    res.status(400);
    throw new Error(`Capacity (${capacity}) exceeds room capacity (${room.capacity})`);
  }
  
  // Derive pricing fields (support new model and legacy alias)
  let paymentModel = bodyPaymentModel;
  let sessionPrice = bodySessionPrice;
  let cycleSize = bodyCycleSize;
  let cyclePrice = bodyCyclePrice;

  if (!paymentModel) {
    // Map legacy fields to per_cycle by default
    if (typeof price === 'number' && typeof paymentCycle === 'number') {
      paymentModel = 'per_cycle';
      cyclePrice = price;
      cycleSize = paymentCycle;
    }
  }

  // Basic validation for pricing
  if (!paymentModel) {
    res.status(400);
    throw new Error('paymentModel is required (use per_cycle with price and paymentCycle or provide new pricing fields)');
  }
  if (paymentModel === 'per_cycle') {
    if (typeof cyclePrice !== 'number' || typeof cycleSize !== 'number') {
      res.status(400);
      throw new Error('For per_cycle paymentModel, cyclePrice and cycleSize are required');
    }
  }
  if (paymentModel === 'per_session') {
    if (typeof sessionPrice !== 'number') {
      res.status(400);
      throw new Error('For per_session paymentModel, sessionPrice is required');
    }
  }

  // Create class instance to check conflicts
  const newClass = new Class({
      name,
    schoolId,
    catalogItem,
    teacherId,
    roomId,
    schedules,
    capacity,
    enrollmentPeriod: {
      startDate: new Date(enrollmentPeriod.startDate),
      endDate: new Date(enrollmentPeriod.endDate)
    },
    // New pricing model fields
    paymentModel,
    sessionPrice,
    cycleSize,
    cyclePrice,
    // keep legacy fields for backward compatibility/snapshots
    paymentCycle,
    price,
    teacherCut,
    absenceRule,
    description
  });
  
  // Check for scheduling conflicts
  const conflict = await newClass.hasConflict();
  if (conflict) {
    const scheduleInfo = `${conflict.schedule.dayOfWeek} ${conflict.schedule.startTime}-${conflict.schedule.endTime}`;
    if (conflict.type === 'room') {
      res.status(409);
      throw new Error(`Room is already booked during ${scheduleInfo} by class: ${conflict.conflict.name}`);
    } else if (conflict.type === 'teacher') {
      res.status(409);
      throw new Error(`Teacher is already booked during ${scheduleInfo} by class: ${conflict.conflict.name}`);
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
    schedules,
    capacity,
    enrollmentPeriod,
  paymentCycle,
  price,
  paymentModel: bodyPaymentModel,
  sessionPrice: bodySessionPrice,
  cycleSize: bodyCycleSize,
  cyclePrice: bodyCyclePrice,
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
  
  // Validate schedules if being updated
  if (schedules) {
    if (!Array.isArray(schedules) || schedules.length === 0) {
      res.status(400);
      throw new Error('At least one schedule is required');
    }

    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    
    for (const schedule of schedules) {
      if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
        res.status(400);
        throw new Error('Invalid time format. Use HH:MM format');
      }
      
      if (schedule.startTime >= schedule.endTime) {
        res.status(400);
        throw new Error('Start time must be before end time');
      }
    }
    
    classItem.schedules = schedules;
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
    // Pricing updates: prefer new model, map legacy when provided
    if (bodyPaymentModel) {
      classItem.paymentModel = bodyPaymentModel;
      if (bodyPaymentModel === 'per_session') {
        if (typeof bodySessionPrice === 'number') classItem.sessionPrice = bodySessionPrice;
        // clear cycle fields optionally
        if (classItem.cyclePrice !== undefined) classItem.cyclePrice = classItem.cyclePrice; // no-op to preserve existing if any
      } else if (bodyPaymentModel === 'per_cycle') {
        if (typeof bodyCyclePrice === 'number') classItem.cyclePrice = bodyCyclePrice;
        if (typeof bodyCycleSize === 'number') classItem.cycleSize = bodyCycleSize;
        // clear session price optionally
        if (classItem.sessionPrice !== undefined) classItem.sessionPrice = classItem.sessionPrice; // no-op
      }
    } else {
      // Map legacy partial updates when present
      if (typeof price === 'number') {
        classItem.cyclePrice = price;
        if (!classItem.paymentModel) classItem.paymentModel = 'per_cycle';
      }
      if (typeof paymentCycle === 'number') {
        classItem.cycleSize = paymentCycle;
        if (!classItem.paymentModel) classItem.paymentModel = 'per_cycle';
      }
      // Ensure existing docs missing new fields get populated from legacy
      if (!classItem.paymentModel) {
        if (typeof classItem.price === 'number' && typeof classItem.paymentCycle === 'number') {
          classItem.paymentModel = 'per_cycle';
          classItem.cyclePrice = classItem.price;
          classItem.cycleSize = classItem.paymentCycle;
        }
      }
    }

  if (paymentCycle !== undefined) classItem.paymentCycle = paymentCycle;
  if (price !== undefined) classItem.price = price;
  if (teacherCut !== undefined) classItem.teacherCut = teacherCut;
  if (absenceRule !== undefined) classItem.absenceRule = absenceRule;
  if (description !== undefined) classItem.description = description;
  if (status !== undefined) classItem.status = status;
  
  // Check for conflicts if schedules, teacher, or room changed
  if (schedules || teacherId || roomId) {
    const conflict = await classItem.hasConflict();
    if (conflict) {
      const scheduleInfo = `${conflict.schedule.dayOfWeek} ${conflict.schedule.startTime}-${conflict.schedule.endTime}`;
      if (conflict.type === 'room') {
        res.status(409);
        throw new Error(`Room is already booked during ${scheduleInfo} by class: ${conflict.conflict.name}`);
      } else if (conflict.type === 'teacher') {
        res.status(409);
        throw new Error(`Teacher is already booked during ${scheduleInfo} by class: ${conflict.conflict.name}`);
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
  // Cleanup class associations in resources (teacher-scoped storage). If a resource ends up with no allowed classes, delete file and record.
  try {
    const resources = await ClassResource.find({ allowedClasses: id });
    for (const r of resources) {
      r.allowedClasses = (r.allowedClasses || []).filter(cid => String(cid) !== String(id));
      if (r.allowedClasses.length === 0) {
        // delete file and record
        const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'teacher-resources', String(r.teacherId));
        const filePath = path.join(uploadsRoot, r.fileName);
        await fs.unlink(filePath).catch(() => {});
        await r.deleteOne();
      } else {
        await r.save();
      }
    }
  } catch (_) { /* ignore */ }

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

// @desc    Get classes for a specific teacher
// @route   GET /api/classes/teacher
// @access  Private (Teacher)
const getClassesByTeacher = asyncHandler(async (req, res) => {
  const { _id: teacherId, school: schoolId } = req.user;
  
  if (!schoolId) {
    res.status(400);
    throw new Error('Teacher must be assigned to a school to access classes');
  }
  
  if (req.user.role !== 'teacher') {
    res.status(403);
    throw new Error('Only teachers can access this endpoint');
  }
  
  const classes = await Class.find({ 
    teacherId, 
    schoolId,
    status: { $in: ['active', 'enrolling'] }
  })
    .populate('roomId', 'name capacity')
  .populate('catalogItem.itemId')
    .sort({ 'schedules.dayOfWeek': 1, 'schedules.startTime': 1 });
  
  res.json(classes);
});

// @desc    Check scheduling conflicts
// @route   POST /api/classes/check-conflicts
// @access  Private (Manager)
const checkConflicts = asyncHandler(async (req, res) => {
  const { schedules, teacherId, roomId, excludeClassId } = req.body;
  const { school: schoolId } = req.user;
  
  const Class = require('../models/Class');
  
  // Check each schedule for conflicts
  for (const schedule of schedules) {
    // Check room conflicts
    const roomConflict = await Class.findOne({
      _id: { $ne: excludeClassId },
      schoolId,
      roomId,
      status: { $in: ['active'] },
      $or: [
        {
          'schedules.dayOfWeek': schedule.dayOfWeek,
          'schedules.startTime': { $lte: schedule.startTime },
          'schedules.endTime': { $gt: schedule.startTime }
        },
        {
          'schedules.dayOfWeek': schedule.dayOfWeek,
          'schedules.startTime': { $lt: schedule.endTime },
          'schedules.endTime': { $gte: schedule.endTime }
        },
        {
          'schedules.dayOfWeek': schedule.dayOfWeek,
          'schedules.startTime': { $gte: schedule.startTime },
          'schedules.endTime': { $lte: schedule.endTime }
        }
      ]
    }).populate('teacherId', 'firstName lastName');
    
    if (roomConflict) {
      return res.json({
        hasConflict: true,
        type: 'room',
        message: `Room is already booked during ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime} by class: ${roomConflict.name} (Teacher: ${roomConflict.teacherId.firstName} ${roomConflict.teacherId.lastName})`,
        conflict: roomConflict,
        schedule
      });
    }
    
    // Check teacher conflicts
    const teacherConflict = await Class.findOne({
      _id: { $ne: excludeClassId },
      schoolId,
      teacherId,
      status: { $in: ['active'] },
      $or: [
        {
          'schedules.dayOfWeek': schedule.dayOfWeek,
          'schedules.startTime': { $lte: schedule.startTime },
          'schedules.endTime': { $gt: schedule.startTime }
        },
        {
          'schedules.dayOfWeek': schedule.dayOfWeek,
          'schedules.startTime': { $lt: schedule.endTime },
          'schedules.endTime': { $gte: schedule.endTime }
        },
        {
          'schedules.dayOfWeek': schedule.dayOfWeek,
          'schedules.startTime': { $gte: schedule.startTime },
          'schedules.endTime': { $lte: schedule.endTime }
        }
      ]
    }).populate('roomId', 'name');
    
    if (teacherConflict) {
      return res.json({
        hasConflict: true,
        type: 'teacher',
        message: `Teacher is already booked during ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime} by class: ${teacherConflict.name} (Room: ${teacherConflict.roomId.name})`,
        conflict: teacherConflict,
        schedule
      });
    }
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
  getClassesByTeacher,
  checkConflicts
};
// @desc    Get classes for the logged-in student
// @route   GET /api/classes/my
// @access  Private (Student)
module.exports.getClassesForStudent = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const classes = await Class.find({ 'enrolledStudents.studentId': userId })
    .select('_id name teacherId')
    .populate('teacherId', 'firstName lastName')
    .sort({ name: 1 });
  res.json(classes);
});
// @desc    Get students for a specific class (teacher-owned)
// @route   GET /api/classes/:id/students
// @access  Private (Teacher)
module.exports.getClassStudents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const me = req.user;
  if (me.role !== 'teacher') return res.status(403).json({ message: 'Not authorized' });
  const klass = await Class.findOne({ _id: id, teacherId: me._id })
    .populate('enrolledStudents.studentId', 'firstName lastName name email studentCode xp level');
  if (!klass) return res.status(404).json({ message: 'Class not found' });
  // Map active enrollments to include enrollmentId for attendance/payment history
  const Enrollment = require('../models/Enrollment');
  const studentIds = (klass.enrolledStudents || []).map(e => e && e.studentId?._id).filter(Boolean);
  const enrollments = await Enrollment.find({ classId: id, schoolId: me.school, studentId: { $in: studentIds } })
    .select('_id studentId createdAt status')
    .sort({ createdAt: -1 });
  const enrollByStudent = new Map();
  for (const en of enrollments) {
    const key = en.studentId.toString();
    if (!enrollByStudent.has(key)) enrollByStudent.set(key, en._id);
  }
  const items = (klass.enrolledStudents || [])
    .filter(e => e && e.studentId)
    .map(e => ({
      id: e.studentId._id,
      name: e.studentId.name || `${e.studentId.firstName} ${e.studentId.lastName}`.trim(),
      email: e.studentId.email || '',
      studentCode: e.studentId.studentCode || '',
      xp: typeof e.studentId.xp === 'number' ? e.studentId.xp : 0,
      level: typeof e.studentId.level === 'number' ? e.studentId.level : 1,
      status: e.status || 'active',
      enrolledAt: e.enrolledAt,
      enrollmentId: enrollByStudent.get(e.studentId._id.toString()) || null,
    }));
  res.json({ classId: klass._id, students: items });
});

// @desc    Get unique student count across all classes owned by the teacher
// @route   GET /api/classes/teacher/students/count
// @access  Private (Teacher)
module.exports.getTeacherUniqueStudentCount = asyncHandler(async (req, res) => {
  const me = req.user;
  if (me.role !== 'teacher') return res.status(403).json({ message: 'Not authorized' });
  const classes = await Class.find({ teacherId: me._id, schoolId: me.school, status: { $in: ['active','enrolling'] } })
    .select('enrolledStudents.studentId');
  const set = new Set();
  for (const c of classes) {
    (c.enrolledStudents || []).forEach(e => { if (e && e.studentId) set.add(String(e.studentId)); });
  }
  res.json({ uniqueStudents: set.size });
});