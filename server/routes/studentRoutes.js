
const express = require('express');
const router = express.Router();
const {
  getStudentsForSchool,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect, manager } = require('../middleware/authMiddleware');

// Apply security middleware to all student routes
router.use(protect, manager);

// Routes for getting all students and creating a new one
router.route('/')
  .get(getStudentsForSchool)
  .post(createStudent);

// Routes for getting, updating, and deleting a specific student
router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
