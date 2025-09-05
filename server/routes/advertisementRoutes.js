const express = require('express');
const router = express.Router();
const { protect, manager } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementsForUser,
  uploadAdvertisementBanner
} = require('../controllers/advertisementController');

// Manager routes (require manager role)
router.post('/', protect, manager, createAdvertisement);
router.get('/', protect, manager, getAdvertisements);
router.put('/:id', protect, manager, updateAdvertisement);
router.delete('/:id', protect, manager, deleteAdvertisement);

// Upload banner image (single file under field name 'banner')
router.post(
  '/:id/banner',
  protect,
  manager,
  (req, res, next) => { req.uploadTarget = 'ads'; next(); },
  upload.single('banner'),
  handleMulterError,
  uploadAdvertisementBanner
);

// User routes (for displaying ads)
router.get('/user/:role', protect, getAdvertisementsForUser);

module.exports = router;
