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
  checkConflicts
} = require('../controllers/classController');
const { protect, manager } = require('../middleware/authMiddleware');

// All routes are protected and require manager role
router.use(protect, manager);

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
