// server/routes/classRoutes.js

const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getAvailableTeachers,
  getAvailableRooms,
  getCatalogItems,
  getClassesByTeacher,
  checkConflicts,
  getClassStudents,
  getClassesForStudent,
  getTeacherUniqueStudentCount
} = require('../controllers/classController');
const { protect, manager, teacher, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

// Protect all routes
router.use(protect);

// Teacher-specific route (requires teacher role) - must be defined before manager-only guard
router.get('/teacher', teacher, getClassesByTeacher);
router.get('/teacher/students/count', teacher, getTeacherUniqueStudentCount);
// Student-specific classes route
router.get('/my', getClassesForStudent);

// Students of class (teacher) - place BEFORE manager-only guard so teachers can access
router.get('/:id/students', teacher, getClassStudents);

// All other routes require manager or staff role
// All other routes require manager or staff role
router.use(authorize('manager', 'staff', 'employee', 'staff pedagogique'));
router.use(checkPermission('classes'));

// Helper routes for class creation - MUST come before /:id route
router.get('/available-teachers', getAvailableTeachers);
router.get('/available-rooms', getAvailableRooms);
router.get('/catalog-items', getCatalogItems);

// Conflict checking route
router.post('/check-conflicts', checkConflicts);

// Main class routes
router.route('/')
  .get(getClasses)
  .post(createClass);

// Individual class routes - MUST come after helper routes
router.route('/:id')
  .get(getClass)
  .put(updateClass)
  .delete(deleteClass);

module.exports = router;
