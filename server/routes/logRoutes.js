const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getActivityStats,
  getRecentActivities,
  getActivityLogsByUser,
  getActivityLogsByCategory,
  exportActivityLogs,
  clearOldLogs
} = require('../controllers/logController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkLogsAccess } = require('../middleware/permissionMiddleware');

// All routes require authentication
router.use(protect);

// Get activity logs with filters
router.get('/:schoolId', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, getActivityLogs);

// Get activity statistics
router.get('/:schoolId/stats', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, getActivityStats);

// Get recent activities
router.get('/:schoolId/recent', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, getRecentActivities);

// Get activity logs by user
router.get('/:schoolId/user/:userId', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, getActivityLogsByUser);

// Get activity logs by category
router.get('/:schoolId/category/:category', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, getActivityLogsByCategory);

// Export activity logs
router.get('/:schoolId/export', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, exportActivityLogs);

// Clear old activity logs (admin only)
router.delete('/:schoolId/clear', authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkLogsAccess, clearOldLogs);

module.exports = router;
