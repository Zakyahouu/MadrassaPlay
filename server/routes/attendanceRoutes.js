const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { mark, undo, roster, history } = require('../controllers/attendanceController');

// Only managers and staff can access attendance endpoints
router.post('/mark', protect, authorize('manager', 'staff'), mark);
router.post('/undo', protect, authorize('manager', 'staff'), undo);
router.get('/roster', protect, authorize('manager', 'staff'), roster);
router.get('/history', protect, authorize('manager', 'staff', 'student'), history);

module.exports = router;
