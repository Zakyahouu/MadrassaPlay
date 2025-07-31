const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

const recordAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body;
  const { classId } = req.params;

  const existingAttendance = await Attendance.findOne({
    class: classId,
    date: new Date(date)
  });

  if (existingAttendance) {
    existingAttendance.records = records;
    await existingAttendance.save();
    res.json(existingAttendance);
  } else {
    const attendance = await Attendance.create({
      class: classId,
      date,
      records,
      recordedBy: req.user._id
    });
    res.status(201).json(attendance);
  }
});

const getClassAttendance = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { class: classId };
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const attendance = await Attendance.find(query)
    .populate('records.student', 'name')
    .sort('-date');

  res.json(attendance);
});

module.exports = {
  recordAttendance,
  getClassAttendance
};
