// server/routes/schoolRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const { createSchool, getSchools } = require('../controllers/schoolController');

// Import middleware for protection
const { protect, admin } = require('../middleware/authMiddleware');

// Define the routes
// A GET request to /api/schools/ will get all schools.
// A POST request to /api/schools/ will create a new school.
// We chain .get() and .post() to the same route path.
// Both routes are protected by 'protect' (must be logged in) and 'admin' (must be an admin).
router.route('/').get(protect, admin, getSchools).post(protect, admin, createSchool);

module.exports = router;
