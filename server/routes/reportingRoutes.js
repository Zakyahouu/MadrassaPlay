const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { assignmentSummary, classPerformance, assignmentStudents, classStudentHistory, assignmentStudentAttempts, weeklyActiveUsers, sessionsByTemplate } = require('../controllers/reportingController');

router.get('/assignments/:assignmentId/summary', protect, assignmentSummary);
router.get('/assignments/:assignmentId/students', protect, assignmentStudents);
router.get('/assignments/:assignmentId/students/:studentId/attempts', protect, assignmentStudentAttempts);
router.get('/classes/:classId/performance', protect, classPerformance);
router.get('/classes/:classId/students/:studentId/history', protect, classStudentHistory);

// Analytics
router.get('/analytics/weekly-active-users', protect, weeklyActiveUsers);
router.get('/analytics/sessions-by-template', protect, sessionsByTemplate);

module.exports = router;
