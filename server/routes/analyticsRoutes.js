const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { getAssignmentAnalytics } = require('../controllers/analyticsController');

// All routes are protected
router.use(protect);

// Get detailed analytics for a specific assignment
// Managers need 'reports' or 'classes' permission ideally, but we'll enforce basic role checks in controller
// or use checkPermission('reports') if we want strict enforcement. 
// For now, let's allow teachers (own) and managers (all).
router.get('/assignment/:assignmentId', authorize('manager', 'staff', 'employee', 'staff pedagogique', 'teacher'), checkPermission('reports'), getAssignmentAnalytics);

module.exports = router;
