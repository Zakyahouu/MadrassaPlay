
const express = require('express');
const router = express.Router();

// Import controller functions
const { createSchool, getSchools, updateSchool, deleteSchool, createManagerForSchool, updateManagerForSchool, deleteManagerForSchool } = require('../controllers/schoolController');
// Import middleware for protection
const { protect, admin, manager } = require('../middleware/authMiddleware');

// POST create manager for a school
router.route('/:id/managers').post(protect, admin, createManagerForSchool);

// PUT update manager, DELETE remove manager
router.route('/:schoolId/managers/:managerId')
  .put(protect, admin, updateManagerForSchool)
  .delete(protect, admin, deleteManagerForSchool);

// GET all schools, POST create school
router.route('/').get(protect, admin, getSchools).post(protect, admin, createSchool);

// GET school by id, PUT update school, DELETE remove school
router.route('/:id')
  .get(protect, adminOrManager, require('../controllers/schoolController').getSchoolById)
  .put(protect, admin, updateSchool)
  .delete(protect, admin, deleteSchool);

// Custom middleware to allow admin or manager to access GET /api/schools/:id
function adminOrManager(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized.' });
  }
}

module.exports = router;
