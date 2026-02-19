const express = require('express');
const router = express.Router();
const { protect, manager, authorize } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const { checkAdsAccess } = require('../middleware/permissionMiddleware');
const {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementsForUser,
  uploadAdvertisementBanner
} = require('../controllers/advertisementController');

// Manager routes (require manager role or staff with ads permission)
router.use(protect);

// Apply specific permissions
router.post('/', authorize('manager', 'staff'), checkAdsAccess, createAdvertisement);
router.get('/', authorize('manager', 'staff'), checkAdsAccess, getAdvertisements);
router.put('/:id', authorize('manager', 'staff'), checkAdsAccess, updateAdvertisement);
router.delete('/:id', authorize('manager', 'staff'), checkAdsAccess, deleteAdvertisement);

// Upload banner image (single file under field name 'banner')
router.post(
  '/:id/banner',
  authorize('manager', 'staff'),
  checkAdsAccess,
  (req, res, next) => { req.uploadTarget = 'ads'; next(); },
  upload.single('banner'),
  handleMulterError,
  uploadAdvertisementBanner
);

// User routes (for displaying ads)
router.get('/user/:role', protect, getAdvertisementsForUser);

module.exports = router;
