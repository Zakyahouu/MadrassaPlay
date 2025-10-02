// server/routes/sharedModelRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateShareLink,
  disableShareLink,
  getShareStatus,
  viewSharedModel,
  getUserSharedModels
} = require('../controllers/sharedModelController');

// Public routes (no authentication required)
router.get('/view/:authKey', viewSharedModel);

// Protected routes (authentication required)
router.post('/generate/:modelId', protect, generateShareLink);
router.post('/disable/:modelId', protect, disableShareLink);
router.get('/status/:modelId', protect, getShareStatus);
router.get('/my-shares', protect, getUserSharedModels);

module.exports = router;
