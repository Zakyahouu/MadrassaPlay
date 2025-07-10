// server/routes/assignmentRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const { 
  createAssignment, 
  getMyAssignments 
} = require('../controllers/assignmentController');

// Import middleware for protection
const { protect } = require('../middleware/authMiddleware');

// Define the routes
// A POST request to /api/assignments will create a new assignment.
router.post('/', protect, createAssignment);

// A GET request to /api/assignments/my-assignments will get all assignments for the logged-in student.
router.get('/my-assignments', protect, getMyAssignments);

module.exports = router;
