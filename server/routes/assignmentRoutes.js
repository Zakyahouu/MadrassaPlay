// server/routes/assignmentRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const { 
  createAssignment, 
  getMyAssignments,
  getAssignmentsForTeacher,
  getMyAssignmentsDetailed,
  getAssignmentBreakdown,
  updateAssignment,
  deleteAssignment,
  cancelAssignment,
  completeAssignment,
  
} = require('../controllers/assignmentController');

// Import middleware for protection
const { protect, authorize } = require('../middleware/authMiddleware');

// Define the routes
// A POST request to /api/assignments will create a new assignment.
router.post('/', protect, authorize('teacher'), createAssignment);

// A GET request to /api/assignments/my-assignments will get all assignments for the logged-in student.
router.get('/my-assignments', protect, getMyAssignments);
router.get('/my-assignments/detailed', protect, getMyAssignmentsDetailed);
router.get('/:id/breakdown', protect, getAssignmentBreakdown);

// Teacher: list own assignments
router.get('/teacher', protect, authorize('teacher'), getAssignmentsForTeacher);

// Teacher: update/delete an assignment
router.put('/:id', protect, authorize('teacher'), updateAssignment);
router.delete('/:id', protect, authorize('teacher'), deleteAssignment);

// Teacher: cancel / complete
router.post('/:id/cancel', protect, authorize('teacher'), cancelAssignment);
router.post('/:id/complete', protect, authorize('teacher'), completeAssignment);

// Student: attempt gating
router.get('/:id/can-attempt', protect, require('../controllers/assignmentController').getCanAttempt);

module.exports = router;
