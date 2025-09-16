// server/routes/userRoutes.js

// 1. IMPORT PACKAGES
// ==============================================================================
const express = require('express');

// 2. CREATE THE ROUTER
// ==============================================================================
// An Express Router is like a mini-app that can have its own routes.
// It helps us keep our routes organized in separate files.
const router = express.Router();

// 3. IMPORT CONTROLLER FUNCTIONS
// ==============================================================================
// We are now importing the functions from the controller file we created.
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/userController');

// 3.1. IMPORT MIDDLEWARE
// ==============================================================================


// 4. DEFINE THE ROUTES
// ==============================================================================
// When a POST request is made to the root of this router ('/'), we call the registerUser function.
// We changed '/register' to just '/' because we will mount this whole file at '/api/users/register' later.
router.post('/register', registerUser);

// When a POST request is made to '/login', we will call the loginUser function.
router.post('/login', loginUser);


// Authenticated: get my gamification snapshot
router.get('/me/gamification', protect, async (req, res) => {
	try {
		const self = await User.findById(req.user._id).select('xp level totalPoints');
		res.json(self || { xp: 0, level: 1, totalPoints: 0 });
	} catch (err) {
		res.status(500).json({ message: 'Server Error', error: err.message });
	}
});

// Counts endpoint
// Admin: global; Manager: scoped to their school; role filter optional (?role=student|teacher|manager|admin)
router.get('/count', protect, async (req, res) => {
	try {
		const { role } = req.query;
		const filter = {};
		if (role) filter.role = role;

		if (req.user.role === 'admin') {
			// no extra scoping
		} else if (req.user.role === 'manager' && req.user.school) {
			filter.school = req.user.school;
		} else {
			return res.status(403).json({ message: 'Not authorized.' });
		}

		const count = await User.countDocuments(filter);
		res.json({ count });
	} catch (err) {
		res.status(500).json({ message: 'Server Error', error: err.message });
	}
});

// Admin analytics: user breakdown by school and type
// GET /api/users/analytics/user-breakdown
// Returns: [{ school: { _id, name }, breakdown: { student: N, teacher: N, manager: N, ... } }]
const { getUserBreakdownAnalytics } = require('../controllers/userController');
router.get('/analytics/user-breakdown', protect, admin, getUserBreakdownAnalytics);
// Profile routes (protected)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);


// 5. EXPORT THE ROUTER
// ==============================================================================
// We export the router so we can use it in our main server.js file.
module.exports = router;
