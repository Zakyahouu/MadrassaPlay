const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { checkStaffPermission } = require('../middleware/staffMiddleware');
const {
  setGradeSubjects,
  getGradeSubjects
} = require('../controllers/gradeSubjectController');

router.route('/')
  .post(protect, checkStaffPermission('manage_grades'), setGradeSubjects)
  .get(protect, getGradeSubjects);

module.exports = router;
