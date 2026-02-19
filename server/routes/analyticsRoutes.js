const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { getAssignmentAnalytics } = require('../controllers/analyticsController');

// All routes are protected
router.use(protect);

// Get detailed analytics for a specific assignment
// Managers need 'reports' or 'classes' permission ideally, but we'll enforce basic role checks in controller
// or use checkPermission('reports') if we want strict enforcement. 
// For now, let's allow teachers (own) and managers (all).
router.get('/assignment/:assignmentId', getAssignmentAnalytics);

module.exports = router;
