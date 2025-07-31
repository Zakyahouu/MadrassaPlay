const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows us to get schoolId from parent router
const {
  addStaffMember,
  getSchoolStaff,
  updateStaffPermissions,
  removeStaffMember,
} = require('../controllers/schoolStaffController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/staffMiddleware');

// Staff management routes
router.route('/')
  .post(protect, checkPermission('manageStaff'), addStaffMember)
  .get(protect, checkPermission('viewStaff'), getSchoolStaff);

router.route('/:staffId')
  .put(protect, checkPermission('managePermissions'), updateStaffPermissions)
  .delete(protect, checkPermission('deleteStaff'), removeStaffMember);

module.exports = router;
