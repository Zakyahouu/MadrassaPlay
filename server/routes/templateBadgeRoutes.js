const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const allowedMimes = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 2 }, // 2 MB limit
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});
const {
  createTemplateBadge,
  getTemplateBadges,
  getTemplateBadge,
  updateTemplateBadge,
  deleteTemplateBadge,
  getMyTemplateBadges,
  recalculateTemplateBadge,
  uploadBadgeIcon,
} = require('../controllers/templateBadgeController');

// Student earned list (place before param id to avoid conflict)
router.get('/me/list', protect, getMyTemplateBadges);

// List & detail
router.get('/', protect, getTemplateBadges);
router.get('/:id', protect, getTemplateBadge);

// Admin CRUD
router.post('/', protect, admin, createTemplateBadge);
router.put('/:id', protect, admin, updateTemplateBadge);
router.delete('/:id', protect, admin, deleteTemplateBadge);

// Admin maintenance actions
router.post('/:id/recalculate', protect, admin, recalculateTemplateBadge);
router.post('/icon/upload', protect, admin, upload.single('icon'), uploadBadgeIcon);

// Admin: hard delete badge system for a template (by template id) including earned records
router.delete('/template/:templateId', protect, admin, async (req, res) => {
  try {
    const TemplateBadge = require('../models/TemplateBadge');
    const EarnedTemplateBadge = require('../models/EarnedTemplateBadge');
    const badge = await TemplateBadge.findOne({ template: req.params.templateId }).select('_id');
    if (!badge) return res.status(404).json({ message: 'No badge found for template' });
    await EarnedTemplateBadge.deleteMany({ templateBadge: badge._id });
    await TemplateBadge.deleteOne({ _id: badge._id });
    res.json({ message: 'Template badge system deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
