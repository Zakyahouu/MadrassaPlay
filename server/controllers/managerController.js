const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const LoggingService = require('../services/loggingService');

// @desc    List users scoped to manager's school (or global for admin)
// @route   GET /api/manager/users
// @access  Private (manager|admin)
const listUsersForManager = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};

  if (role) filter.role = role;

  if (req.user.role === 'manager') {
    if (!req.user.school) {
      return res.status(400).json({ message: 'Manager must be assigned to a school' });
    }
    filter.school = req.user.school;
  }

  if (q) {
    // basic search by name or email
    filter.$or = [
      { firstName: new RegExp(q, 'i') },
      { lastName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }

  const users = await User.find(filter).select('_id firstName lastName email role studentCode').limit(500).lean();
  res.json(users || []);
});


// @desc    Reset a user's password (manager/admin) - no current password required
// @route   POST /api/manager/reset-password
// @access  Private (manager|admin)
const resetUserPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword || String(newPassword).length < 6) {
    res.status(400);
    throw new Error('userId and newPassword (min 6 chars) are required');
  }

  const target = await User.findById(userId);
  if (!target) {
    res.status(404);
    throw new Error('Target user not found');
  }

  // If manager, ensure target is in same school
  if (req.user.role === 'manager') {
    if (!req.user.school || !target.school || String(req.user.school) !== String(target.school)) {
      res.status(403);
      throw new Error('Not authorized to reset password for this user');
    }
  }

  // Set new password directly - User pre-save hook will hash it
  target.password = newPassword;
  await target.save();

  // Log activity
  try {
    await LoggingService.logActivity(req, 'password_reset', `Reset password for user ${target._id}`, { targetUserId: target._id });
  } catch (e) { /* ignore logging errors */ }

  res.json({ message: 'Password reset successfully' });
});

module.exports = { listUsersForManager, resetUserPassword };
