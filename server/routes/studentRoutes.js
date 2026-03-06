
const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentEnrollments,
  getStudentPayments,
  updateEnrollmentCount,
  updateBalance,
  searchStudents,
  enrollStudent,
  unenrollStudent,
  transferStudent,
  suspendStudent,
  unsuspendStudent,
  getStudentHistory,
  scanByCode
} = require('../controllers/studentController');
const { protect, manager, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require manager or staff role
router.use(protect, authorize('manager', 'staff'));

// Main student routes
router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/search')
  .get(searchStudents);

// Scan by student code for quick lookup
router.route('/scan/:studentCode')
  .get(scanByCode);

router.route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

router.route('/:id/history')
  .get(getStudentHistory);

// Student-specific data routes
router.route('/:id/enrollments')
  .get(getStudentEnrollments);

router.route('/:id/payments')
  .get(getStudentPayments);

// Enroll a student into a class
router.route('/:id/enroll')
  .post(enrollStudent);

router.route('/:id/unenroll')
  .post(unenrollStudent);

router.route('/:id/transfer')
  .post(transferStudent);

router.route('/:id/suspend')
  .post(suspendStudent);

router.route('/:id/unsuspend')
  .post(unsuspendStudent);

router.route('/:id/enrollment-count')
  .patch(updateEnrollmentCount);

router.route('/:id/balance')
  .patch(updateBalance);

module.exports = router;
