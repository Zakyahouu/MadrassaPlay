const express = require('express');
const router = express.Router();
const { protect, manager, admin } = require('../middleware/authMiddleware');
const { listUsersForManager, resetUserPassword } = require('../controllers/managerController');

// List users (manager scoped to school, admin global)
router.get('/users', protect, (req, res, next) => {
  // allow manager or admin
  if (req.user.role === 'manager' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Not authorized' });
}, listUsersForManager);

// Reset password for a user (no current password required)
router.post('/reset-password', protect, (req, res, next) => {
  if (req.user.role === 'manager' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Not authorized' });
}, resetUserPassword);

module.exports = router;
