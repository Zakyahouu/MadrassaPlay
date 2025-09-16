// server/routes/gameResultRoutes.js

const express = require('express');
const router = express.Router();

// Import controller function
const { 
  submitGameResult,
  getResultsForGame, // existing
  getAttemptHistory, // newly wired attempt history endpoint
  getMyResultsSummary,
  getMyRecentResults,
  getMyRecentLiveResults,
  getResultDetail
} = require('../controllers/gameResultController');

// Import middleware for protection
const { protect } = require('../middleware/authMiddleware');

// Define the route for submitting a result
router.post('/', protect, submitGameResult);

// Attempt history for a specific assignment/game pair for the logged-in student
router.get('/history/:assignmentId/:gameCreationId', protect, getAttemptHistory);

// Student self metrics
router.get('/me/summary', protect, getMyResultsSummary);
router.get('/me/recent', protect, getMyRecentResults);
router.get('/me/live', protect, getMyRecentLiveResults);

// Route for getting results for a specific game creation
router.get('/:gameCreationId', protect, getResultsForGame);

// Detail view for a single result
router.get('/detail/:resultId', protect, getResultDetail);

module.exports = router;
