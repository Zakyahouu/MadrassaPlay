// server/routes/gameResultRoutes.js

const express = require('express');
const router = express.Router();

// Import controller function
const { 
  submitGameResult,
  getResultsForGame, // existing
  getAttemptHistory // newly wired attempt history endpoint
} = require('../controllers/gameResultController');

// Import middleware for protection
const { protect } = require('../middleware/authMiddleware');

// Define the route for submitting a result
router.post('/', protect, submitGameResult);

// Attempt history for a specific assignment/game pair for the logged-in student
router.get('/history/:assignmentId/:gameCreationId', protect, getAttemptHistory);

// Route for getting results for a specific game creation
router.get('/:gameCreationId', protect, getResultsForGame);

module.exports = router;
