// server/routes/gameResultRoutes.js

const express = require('express');
const router = express.Router();

// Import controller function
const { 
  submitGameResult,
  getResultsForGame // 1. Import the new function
} = require('../controllers/gameResultController');

// Import middleware for protection
const { protect } = require('../middleware/authMiddleware');

// Define the route for submitting a result
router.post('/', protect, submitGameResult);

// 2. NEW ROUTE: Define the route for getting results for a specific game
// A GET request to /api/results/:gameCreationId will get all results for that game.
router.get('/:gameCreationId', protect, getResultsForGame);

module.exports = router;
