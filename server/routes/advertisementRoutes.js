const express = require('express');
const router = express.Router();
const { protect, manager } = require('../middleware/authMiddleware');
const {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementsForUser
} = require('../controllers/advertisementController');

// Manager routes (require manager role)
router.post('/', protect, manager, createAdvertisement);
router.get('/', protect, manager, getAdvertisements);
router.put('/:id', protect, manager, updateAdvertisement);
router.delete('/:id', protect, manager, deleteAdvertisement);

// User routes (for displaying ads)
router.get('/user/:role', protect, getAdvertisementsForUser);

module.exports = router;
