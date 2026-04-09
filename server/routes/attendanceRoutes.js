const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { mark, undo, roster, history } = require('../controllers/attendanceController');

// Only managers and staff can access attendance endpoints
router.post('/mark', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('attendance'), mark);
router.post('/undo', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('attendance'), undo);
router.get('/roster', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique'), checkPermission('attendance'), roster);
// Allow teachers to read history (scoped in controller to own classes)
router.get('/history', protect, authorize('manager', 'staff', 'employee', 'staff pedagogique', 'student', 'teacher'), checkPermission('attendance'), history);

module.exports = router;
