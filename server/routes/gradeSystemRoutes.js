const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createGradeSystem,
  getSchoolGradeSystems,
  updateGradeSystem,
} = require('../controllers/gradeSystemController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/staffMiddleware');

router.route('/')
  .post(protect, checkPermission('manageGradeSystems'), createGradeSystem)
  .get(protect, checkPermission('viewGradeSystems'), getSchoolGradeSystems);

router.route('/:systemId')
  .put(protect, checkPermission('manageGradeSystems'), updateGradeSystem);

module.exports = router;

