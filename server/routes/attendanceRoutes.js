const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { mark, undo, roster, history } = require('../controllers/attendanceController');

// Only managers and staff can access attendance endpoints
router.post('/mark', protect, authorize('manager', 'staff'), mark);
router.post('/undo', protect, authorize('manager', 'staff'), undo);
router.get('/roster', protect, authorize('manager', 'staff'), roster);
// Allow teachers to read history (scoped in controller to own classes)
router.get('/history', protect, authorize('manager', 'staff', 'student', 'teacher'), history);

module.exports = router;
