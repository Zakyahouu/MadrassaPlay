const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createSchoolUser,
  getSchoolUsers,
  deleteSchoolUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/staffMiddleware');

router.route('/')
  .post(protect, checkPermission('manageStudents'), createSchoolUser)
  .get(protect, checkPermission('viewStudents'), getSchoolUsers);

router.route('/:userId')
  .delete(protect, checkPermission('deleteStudents'), deleteSchoolUser);

module.exports = router;
