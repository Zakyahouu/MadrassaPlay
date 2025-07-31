// server/routes/schoolRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const { 
    createSchool, 
    getSchools, 
    assignPrincipal, 
    getSchoolDetails,
    updateSchoolDetails,
    resetManagerPassword
} = require('../controllers/schoolController');

// Import middleware for protection
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for creating and getting all schools (Admin only)
router.route('/')
  .post(protect, admin, createSchool)
  .get(protect, admin, getSchools);

// Routes for a specific school's details (Admin only)
router.route('/:schoolId')
  .get(protect, admin, getSchoolDetails)
  .put(protect, admin, updateSchoolDetails);

// Route for assigning a principal (Admin only)
router.route('/:schoolId/principal')
  .post(protect, admin, assignPrincipal);

// Route for resetting a manager's password (Admin only)
router.route('/manager/:managerId/reset-password')
  .post(protect, admin, resetManagerPassword);

module.exports = router;
