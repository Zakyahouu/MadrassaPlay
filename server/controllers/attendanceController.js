const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const { buildClassEnrollmentSummaries } = require('./enrollmentController');
const LoggingService = require('../services/loggingService');
const { Types } = mongoose;

// GET /api/attendance/history?enrollmentId=...&status=present|absent
const history = asyncHandler(async (req, res) => {
  const { enrollmentId, status } = req.query || {};
  if (!enrollmentId) {
    res.status(400);
    throw new Error('enrollmentId is required');
  }
  if (!mongoose.isValidObjectId(enrollmentId)) {
    res.status(400);
    throw new Error('Invalid enrollmentId');
  }
  const enrollment = await Enrollment.findById(enrollmentId).select('schoolId studentId classId');
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  const role = req.user.role;
  const schoolId = (req.user.school?._id || req.user.school || '').toString();
  // Authorization: managers/staff same school, student owner, or teacher who owns the class
  if (role === 'manager' || role === 'staff') {
    if (enrollment.schoolId.toString() !== schoolId) {
      res.status(403);
      throw new Error('Access denied');
    }
  } else if (role === 'student') {
    if (enrollment.studentId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied');
    }
  } else if (role === 'teacher') {
    // Teacher can only read history if the enrollment belongs to a class they own
    const klass = await Class.findById(enrollment.classId).select('teacherId');
    if (!klass || klass.teacherId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied');
    }
  } else {
    res.status(403);
    throw new Error('Access denied');
  }

  const q = { enrollmentId: new Types.ObjectId(enrollmentId) };
  if (status && ['present','absent'].includes(status)) q.status = status;
  const items = await Attendance.find(q).sort({ date: -1 });
  res.json({ items });
});

// Normalize YYYY-MM-DD to UTC date-only
function toUtcDateOnly(dateStr) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// POST /api/attendance/mark
const mark = asyncHandler(async (req, res) => {
  const { enrollmentId, date, status } = req.body || {};
  if (!enrollmentId || !date || !['present', 'absent'].includes(status)) {
    res.status(400);
    throw new Error('enrollmentId, date (YYYY-MM-DD) and valid status are required');
  }
  if (!mongoose.isValidObjectId(enrollmentId)) {
    res.status(400);
    throw new Error('Invalid enrollmentId');
  }

  const schoolIdRaw = (req.user.school?._id || req.user.school || '').toString();
  if (!mongoose.isValidObjectId(schoolIdRaw)) {
    res.status(400);
    throw new Error('User is not assigned to a valid school');
  }
  const schoolId = schoolIdRaw;
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment || enrollment.schoolId.toString() !== schoolId) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  if (enrollment.status !== 'active') {
    res.status(400);
    throw new Error('Enrollment is not active');
  }

  const klass = await Class.findById(enrollment.classId).select('schoolId absenceRule');
  if (!klass || klass.schoolId.toString() !== schoolId) {
    res.status(403);
    throw new Error('Class access denied');
  }

  const dateOnly = toUtcDateOnly(date);
  if (isNaN(dateOnly.getTime())) {
    res.status(400);
    throw new Error('Invalid date. Use YYYY-MM-DD');
  }

  // Upsert one record per (enrollmentId, date) using a single atomic operation
  const prev = await Attendance.findOne({ enrollmentId, date: dateOnly });
  const updateDoc = {
    $set: {
      schoolId,
      classId: enrollment.classId,
      studentId: enrollment.studentId,
      status,
    },
    $setOnInsert: {
      enrollmentId: new Types.ObjectId(enrollmentId),
      date: dateOnly,
      createdBy: req.user._id,
      createdAt: new Date(),
    },
  };
  const attendanceUpserted = await Attendance.findOneAndUpdate(
    { enrollmentId, date: dateOnly },
    updateDoc,
    { upsert: true, new: true, runValidators: true }
  );

  // Compute counter deltas
  let countersDelta = { attended: 0, absent: 0 };
  if (!prev) {
    countersDelta[status === 'present' ? 'attended' : 'absent'] += 1;
  } else if (prev.status !== status) {
    countersDelta[prev.status === 'present' ? 'attended' : 'absent'] -= 1;
    countersDelta[status === 'present' ? 'attended' : 'absent'] += 1;
  }

  // Update enrollment counters atomically
  const inc = {};
  if (countersDelta.attended) inc['sessionCounters.attended'] = countersDelta.attended;
  if (countersDelta.absent) inc['sessionCounters.absent'] = countersDelta.absent;

  const update = Object.keys(inc).length
    ? { $inc: inc, $max: { 'sessionCounters.lastAttendanceDate': dateOnly } }
    : { $max: { 'sessionCounters.lastAttendanceDate': dateOnly } };

  if (Object.keys(update).length) {
    await Enrollment.updateOne({ _id: enrollmentId }, update);
  }

  // Consume balance on 'present' and refund on change/undo logic here
  // Compute balance delta: present => -1 session, absent => 0
  let balanceDelta = 0;
  if (!prev) {
    if (status === 'present') balanceDelta = -1;
  } else if (prev.status !== status) {
    if (prev.status === 'present' && status === 'absent') balanceDelta = +1; // refund
    if (prev.status === 'absent' && status === 'present') balanceDelta = -1; // consume
  }
  if (balanceDelta !== 0) {
    await Enrollment.updateOne({ _id: enrollmentId }, { $inc: { balance: balanceDelta } });
  }

  const attendance = attendanceUpserted;
  // Return fresh roster for this class and date so client doesn't need a separate GET
  let items = [];
  try {
    const built = await buildClassEnrollmentSummaries(schoolId, enrollment.classId.toString(), dateOnly);
    items = Array.isArray(built) ? built : [];
  } catch (e) {
    // Keep a consistent shape even if roster build fails for any reason
    items = [];
  }
  // Log the attendance marking activity
  await LoggingService.logManagerActivity(req, 'manager_attendance_override', 
    `Marked student attendance as ${status} for ${dateOnly.toISOString().split('T')[0]}`, 
    { enrollmentId, studentId: enrollment.studentId, classId: enrollment.classId, status, date: dateOnly },
    { entityType: 'enrollment', entityId: enrollmentId }
  );

  res.status(prev ? 200 : 201).json({ success: true, classId: enrollment.classId, date: dateOnly, items, attendance, countersDelta, balanceDelta });
});

// POST /api/attendance/undo
const undo = asyncHandler(async (req, res) => {
  const { enrollmentId, date } = req.body || {};
  if (!enrollmentId || !date) {
    res.status(400);
    throw new Error('enrollmentId and date are required');
  }
  if (!mongoose.isValidObjectId(enrollmentId)) {
    res.status(400);
    throw new Error('Invalid enrollmentId');
  }
  const schoolId = (req.user.school?._id || req.user.school || '').toString();
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment || enrollment.schoolId.toString() !== schoolId) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  const dateOnly = toUtcDateOnly(date);
  if (isNaN(dateOnly.getTime())) {
    res.status(400);
    throw new Error('Invalid date. Use YYYY-MM-DD');
  }
  const existing = await Attendance.findOne({ enrollmentId, date: dateOnly });
  if (!existing) return res.status(204).send();

  await Attendance.deleteOne({ _id: existing._id });
  const inc = {};
  inc[existing.status === 'present' ? 'sessionCounters.attended' : 'sessionCounters.absent'] = -1;
  // Also refund balance if present was undone
  if (existing.status === 'present') {
    inc['balance'] = (inc['balance'] || 0) + 1;
  }
  await Enrollment.updateOne({ _id: enrollmentId }, { $inc: inc });
  // Return fresh roster for this class and date
  let items = [];
  try {
    const built = await buildClassEnrollmentSummaries(enrollment.schoolId.toString(), enrollment.classId.toString(), dateOnly);
    items = Array.isArray(built) ? built : [];
  } catch (e) {
    items = [];
  }
  // Log the attendance undo activity
  await LoggingService.logManagerActivity(req, 'manager_attendance_override', 
    `Undid student attendance for ${dateOnly.toISOString().split('T')[0]}`, 
    { enrollmentId, studentId: enrollment.studentId, classId: enrollment.classId, date: dateOnly },
    { entityType: 'enrollment', entityId: enrollmentId }
  );

  res.json({ success: true, classId: enrollment.classId, date: dateOnly, items, deleted: true });
});

// GET /api/attendance/roster?classId&date=YYYY-MM-DD
const roster = asyncHandler(async (req, res) => {
  const { classId, date } = req.query || {};
  if (!classId || !date) {
    res.status(400);
    throw new Error('classId and date are required');
  }
  const schoolId = (req.user.school?._id || req.user.school || '').toString();
  const klass = await Class.findOne({ _id: classId, schoolId });
  if (!klass) {
    res.status(404);
    throw new Error('Class not found');
  }
  const dateOnly = toUtcDateOnly(date);
  if (isNaN(dateOnly.getTime())) {
    res.status(400);
    throw new Error('Invalid date. Use YYYY-MM-DD');
  }
  const enrollments = await Enrollment.find({ classId, schoolId, status: 'active' })
    .populate('studentId', 'firstName lastName studentCode');
  const enrollmentIds = enrollments.map(e => e._id);
  const todays = await Attendance.find({ enrollmentId: { $in: enrollmentIds }, date: dateOnly });
  const byEnrollment = new Map(todays.map(a => [a.enrollmentId.toString(), a]));
  const items = enrollments.map(e => ({
    enrollmentId: e._id,
    student: e.studentId,
  todayStatus: byEnrollment.get(e._id.toString())?.status || null,
  }));
  res.json({ classId, date: dateOnly, items });
});

module.exports = { mark, undo, roster, history };
