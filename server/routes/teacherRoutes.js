
const express = require('express');
const router = express.Router();
const {
  getTeachersForSchool,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');

// Import the security middleware
const { protect, manager } = require('../middleware/authMiddleware');

// Apply middleware to all routes in this file.
// 1. 'protect' runs first to ensure the user is logged in.
// 2. 'manager' runs second to ensure the logged-in user has the correct role.
router.use(protect);
router.use(manager);

// --- All routes below are now protected ---

// Route for getting all teachers and creating a new teacher
router.route('/')
  .get(getTeachersForSchool)
  .post(createTeacher);

// Route for getting, updating, and deleting a specific teacher by their ID
router.route('/:id')
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

module.exports = router;