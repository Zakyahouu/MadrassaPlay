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

module.exports = router;
