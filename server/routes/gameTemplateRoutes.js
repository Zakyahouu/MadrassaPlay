// server/routes/gameTemplateRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import controller functions
const { 
  createGameTemplate, 
  getGameTemplates,
  getGameTemplateById,
  uploadGameTemplate // Import the upload function
} = require('../controllers/gameTemplateController');

// Import middleware for protection
const { protect, admin } = require('../middleware/authMiddleware');

// --- Multer Configuration ---
// We configure multer to store the uploaded file in memory as a buffer,
// instead of saving it to the disk on the server. This is efficient for
// processing zip files directly.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Define the Routes ---

// Route for uploading a new template bundle
// - It's protected by 'protect' and 'admin' middleware.
// - 'upload.single('templateFile')' is the multer middleware. It looks for a file
//   in the form data with the field name 'templateFile'.
router.post('/upload', protect, admin, upload.single('templateFile'), uploadGameTemplate);

// Existing routes for getting and creating templates manually
router.route('/')
  .post(protect, admin, createGameTemplate)
  .get(protect, getGameTemplates);

router.route('/:id')
  .get(protect, getGameTemplateById);

module.exports = router;
