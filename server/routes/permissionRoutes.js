const express = require('express');
const router = express.Router();
const {
  getPermissions,
  initializePermissions,
} = require('../controllers/permissionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPermissions);

router.route('/init')
  .post(protect, admin, initializePermissions);

module.exports = router;
