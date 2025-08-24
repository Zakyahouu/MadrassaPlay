const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { topStudentsBySchool, topStudentsByClass, myRankInSchool, myRankInClass } = require('../controllers/leaderboardController');

// Allow admin, manager, staff, and teachers to read leaderboards
router.get('/school', protect, topStudentsBySchool);
router.get('/class/:classId', protect, topStudentsByClass);
router.get('/school/rank', protect, myRankInSchool);
router.get('/class/:classId/rank', protect, myRankInClass);

module.exports = router;
