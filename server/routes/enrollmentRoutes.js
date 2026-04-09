const express = require('express');
const router = express.Router();
const {
  getEnrollments,
  getStudentEnrollments,
  getClassEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  recordAttendance,
  getAvailableClasses,
  getEnrollmentSummary,
  getClassEnrollmentSummaries,
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkAnyPermission } = require('../middleware/permissionMiddleware');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const asyncHandler = require('express-async-handler');

// Apply auth to all routes
router.use(protect);
router.use(checkAnyPermission(['students', 'classes']));

// Routes
router.route('/')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique'), getEnrollments)
  .post(authorize('manager'), createEnrollment);

router.route('/available-classes')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique'), getAvailableClasses);

router.route('/student/:studentId')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique', 'student'), getStudentEnrollments);

router.route('/class/:classId')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique'), getClassEnrollments);

router.route('/:id/summary')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique', 'student'), getEnrollmentSummary);

router.route('/class/:classId/summaries')
  .get(authorize('manager', 'staff', 'employee', 'staff pedagogique'), getClassEnrollmentSummaries);

router.route('/:id')
  .put(authorize('manager'), updateEnrollment)
  .delete(authorize('manager'), deleteEnrollment);

router.route('/:id/attendance')
  .post(authorize('manager', 'staff', 'employee', 'staff pedagogique'), recordAttendance);

// (history moved to /api/attendance/history)

module.exports = router;
