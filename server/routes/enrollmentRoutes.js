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
  getAvailableClasses
} = require('../controllers/enrollmentController');
const { protect, manager } = require('../middleware/authMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(manager);

// Routes
router.route('/')
  .get(getEnrollments)
  .post(createEnrollment);

router.route('/available-classes')
  .get(getAvailableClasses);

router.route('/student/:studentId')
  .get(getStudentEnrollments);

router.route('/class/:classId')
  .get(getClassEnrollments);

router.route('/:id')
  .put(updateEnrollment)
  .delete(deleteEnrollment);

router.route('/:id/attendance')
  .post(recordAttendance);

module.exports = router;
