// server/routes/gameTemplateRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer (separate configs for bundle vs media)
const storage = multer.memoryStorage();
// Template bundle (zip) uploader – larger size, allow zip mimetypes
const bundleUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for bundle
});
// Media (images) uploader – strict mime filter
const mediaUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
  fileFilter: (req, file, cb) => {
    if (!/image\/(png|jpeg|jpg|webp)/.test(file.mimetype)) {
      return cb(new Error('Only image png/jpeg/webp allowed'));
    }
    cb(null, true);
  }
});

// Import controller functions
const {
  uploadGameTemplate,
  getGameTemplates,
  getGameTemplateById,
  updateTemplateStatus,
  deleteTemplate, // 1. Import the new function
  updateTemplateMeta,
} = require('../controllers/gameTemplateController');

// Import middleware for protection
const { protect, admin } = require('../middleware/authMiddleware');

// Define the routes
router.route('/')
  .get(protect, getGameTemplates);

router.route('/upload')
  .post(protect, admin, bundleUpload.single('templateBundle'), uploadGameTemplate);

// Count templates (admin)
router.get('/count', protect, admin, async (req, res) => {
  try {
    const GameTemplate = require('../models/GameTemplate');
    const count = await GameTemplate.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// Define routes for a single template by its ID
router.route('/:id')
  .get(protect, getGameTemplateById)
  .delete(protect, admin, deleteTemplate); // 2. Add the DELETE method

// Metadata patch
router.route('/:id/meta')
  .patch(protect, admin, updateTemplateMeta);

// Media upload (icon or content) - field name: file, body.usage=icon|content
router.post('/:id/media', protect, mediaUpload.single('file'), async (req, res) => {
  try {
    const GameTemplate = require('../models/GameTemplate');
    const pathLib = require('path');
    const fs = require('fs');
    const template = await GameTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const usage = req.body.usage === 'icon' ? 'icon' : 'content';
    // Only admins may upload template icons
    if (usage === 'icon' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can set template icon' });
    }
    // Optional creation scoping
    const creationId = req.body.creationId && String(req.body.creationId);
    const ext = req.file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : req.file.mimetype.split('/')[1];
    const baseDir = creationId
      ? pathLib.join(__dirname, '..', 'public', 'uploads', 'templates', template._id.toString(), 'creations', creationId)
      : pathLib.join(__dirname, '..', 'public', 'uploads', 'templates', template._id.toString());
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const fullPath = pathLib.join(baseDir, filename);
    fs.writeFileSync(fullPath, req.file.buffer);
    const publicUrl = creationId
      ? `/uploads/templates/${template._id}/creations/${creationId}/${filename}`
      : `/uploads/templates/${template._id}/${filename}`;
    if (usage === 'icon') {
      template.iconUrl = publicUrl;
      await template.save();
    }
    res.status(201).json({ url: publicUrl, usage });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Upload failed' });
  }
});

// Define the route for updating a template's status
router.route('/:id/status')
    .put(protect, admin, updateTemplateStatus);


module.exports = router;
