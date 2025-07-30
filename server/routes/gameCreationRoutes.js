// server/routes/gameCreationRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const { 
  createGameCreation, 
  getMyGameCreations,
  getGameCreationById, // 1. Import the new function
  deleteGameCreation
} = require('../controllers/gameCreationController');

// Import middleware for protection
const { protect } = require('../middleware/authMiddleware');

// Define the routes for the collection
router.route('/')
  .post(protect, createGameCreation)
  .get(protect, getMyGameCreations);

// 2. NEW ROUTE: Define the route for a single game creation by its ID
// A GET request to /api/creations/:id will get a specific game creation.
router.route('/:id')
  .get(protect, getGameCreationById)
  .delete(protect, deleteGameCreation);

module.exports = router;
