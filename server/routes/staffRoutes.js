
const express = require('express');
const router = express.Router();
const { 
  getStaffForSchool,
  createStaff,
  updateStaff,
  deleteStaff,
  staffOverview
} = require('../controllers/staffController');
const { protect, manager } = require('../middleware/authMiddleware');

// Apply security middleware to all staff routes
router.use(protect, manager);

// Overview route
router.get('/overview', staffOverview);

// Routes for getting all staff and creating a new one
router.route('/')
  .get(getStaffForSchool)
  .post(createStaff);

// Routes for updating and deleting a specific staff member
router.route('/:id')
  .put(updateStaff)
  .delete(deleteStaff);

module.exports = router;
