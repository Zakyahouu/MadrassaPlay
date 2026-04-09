const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { assignmentSummary, classPerformance, assignmentStudents, classStudentHistory, assignmentStudentAttempts, weeklyActiveUsers, sessionsByTemplate } = require('../controllers/reportingController');

router.get('/assignments/:assignmentId/summary', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), assignmentSummary);
router.get('/assignments/:assignmentId/students', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), assignmentStudents);
router.get('/assignments/:assignmentId/students/:studentId/attempts', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), assignmentStudentAttempts);
router.get('/classes/:classId/performance', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), classPerformance);
router.get('/classes/:classId/students/:studentId/history', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), classStudentHistory);

// Analytics
router.get('/analytics/weekly-active-users', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), weeklyActiveUsers);
router.get('/analytics/sessions-by-template', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('reports'), sessionsByTemplate);

module.exports = router;
