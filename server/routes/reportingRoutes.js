const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { assignmentSummary, classPerformance, assignmentStudents, classStudentHistory, assignmentStudentAttempts } = require('../controllers/reportingController');

router.get('/assignments/:assignmentId/summary', protect, assignmentSummary);
router.get('/assignments/:assignmentId/students', protect, assignmentStudents);
router.get('/assignments/:assignmentId/students/:studentId/attempts', protect, assignmentStudentAttempts);
router.get('/classes/:classId/performance', protect, classPerformance);
router.get('/classes/:classId/students/:studentId/history', protect, classStudentHistory);

module.exports = router;
