
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
  scanByCode
} = require('../controllers/studentController');
const { protect, manager } = require('../middleware/authMiddleware');

// All routes are protected and require manager role
router.use(protect, manager);

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

// Student-specific data routes
router.route('/:id/enrollments')
  .get(getStudentEnrollments);

router.route('/:id/payments')
  .get(getStudentPayments);

// Enroll a student into a class
router.route('/:id/enroll')
  .post(enrollStudent);

router.route('/:id/enrollment-count')
  .patch(updateEnrollmentCount);

router.route('/:id/balance')
  .patch(updateBalance);

module.exports = router;
