const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  recordAttendance,
  getClassAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/staffMiddleware');

router.route('/')
  .post(protect, checkPermission('manageClasses'), recordAttendance)
  .get(protect, checkPermission('viewClasses'), getClassAttendance);

module.exports = router;
