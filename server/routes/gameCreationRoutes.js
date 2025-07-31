// server/routes/gameCreationRoutes.js

const express = require('express');
const router = express.Router();
const {
  createGameCreation,
  getMyGameCreations,
  getGameCreationById,
  deleteGameCreation,
} = require('../controllers/gameCreationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createGameCreation)
  .get(protect, getMyGameCreations);

router.route('/:id')
  .get(protect, getGameCreationById)
  .delete(protect, deleteGameCreation);

module.exports = router;
// 2. NEW ROUTE: Define the route for a single game creation by its ID
// A GET request to /api/creations/:id will get a specific game creation.
router.route('/:id')
  .get(protect, getGameCreationById)
  .delete(protect, deleteGameCreation);

module.exports = router;
