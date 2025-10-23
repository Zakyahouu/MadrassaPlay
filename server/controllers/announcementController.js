const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const LoggingService = require('../services/loggingService');

// @desc    Create an announcement (teacher only)
// @route   POST /api/announcements
// @access  Private (Teacher)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { classId, message, attachments } = req.body;
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('User must be assigned to a school');
  }

  // Only teachers (or managers/admin) can post announcements in this simplified model
  const role = req.user?.role || '';
  if (!['teacher','manager','admin'].includes(role)) {
    res.status(403);
    throw new Error('Not authorized to post announcements');
  }

  if (!classId || !message) {
    res.status(400);
    throw new Error('classId and message are required');
  }

  const announcement = await Announcement.create({
    schoolId,
    classId,
    authorId: req.user._id,
    authorName: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
    authorRole: role,
    message,
    attachments: Array.isArray(attachments) ? attachments : []
  });

  // Log activity
  try { await LoggingService.logActivity(req, 'announcement_create', `Created announcement for class ${classId}`, { announcementId: announcement._id, classId }); } catch (e) { /* ignore logging errors */ }

  res.status(201).json(announcement);
});

// @desc    Get announcements for a class
// @route   GET /api/announcements/class/:classId
// @access  Private
const getAnnouncementsForClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('User must be assigned to a school');
  }

  if (!classId) {
    res.status(400);
    throw new Error('classId is required');
  }

  const announcements = await Announcement.find({ schoolId, classId }).sort({ createdAt: -1 }).limit(100);
  res.json(announcements);
});

module.exports = { createAnnouncement, getAnnouncementsForClass };
