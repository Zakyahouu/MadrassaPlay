// server/routes/gameTemplateRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Import controller functions
const {
  uploadGameTemplate,
  getGameTemplates,
  getGameTemplateById,
  updateTemplateStatus,
  deleteTemplate,
} = require('../controllers/gameTemplateController');

// Import middleware for protection
const { protect, admin } = require('../middleware/authMiddleware');

// Define the routes
router.route('/')
  .get(protect, getGameTemplates)
  .post(protect, admin, upload.single('templateBundle'), uploadGameTemplate); // Combined upload and get routes

router.route('/:id')
  .get(protect, getGameTemplateById)
  .put(protect, admin, updateTemplateStatus)
  .delete(protect, admin, deleteTemplate); // Combined all methods for a single template

module.exports = router;
