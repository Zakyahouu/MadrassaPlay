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
  deleteTemplate, // 1. Import the new function
} = require('../controllers/gameTemplateController');

// Import middleware for protection
const { protect, admin } = require('../middleware/authMiddleware');

// Define the routes
router.route('/')
  .get(protect, getGameTemplates);

router.route('/upload')
  .post(protect, admin, upload.single('templateBundle'), uploadGameTemplate);

// Define routes for a single template by its ID
router.route('/:id')
  .get(protect, getGameTemplateById)
  .delete(protect, admin, deleteTemplate); // 2. Add the DELETE method

// Define the route for updating a template's status
router.route('/:id/status')
    .put(protect, admin, updateTemplateStatus);


module.exports = router;
