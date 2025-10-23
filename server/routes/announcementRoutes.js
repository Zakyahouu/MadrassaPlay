const express = require('express');
const router = express.Router();
const { protect, teacher } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncementsForClass } = require('../controllers/announcementController');

// Teachers (and managers/admin) can post announcements
router.post('/', protect, teacher, createAnnouncement);

// Fetch announcements for a class (students/teachers)
router.get('/class/:classId', protect, getAnnouncementsForClass);

module.exports = router;
