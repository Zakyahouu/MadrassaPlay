const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createClass,
  getSchoolClasses,
  updateClass,
  enrollStudents,
  transferStudent,
  getEnrollmentHistory,
  assignTeacher,
  getTeacherSchedule,
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/staffMiddleware');
const { validateClassCreation, validateTeacherSchedule } = require('../middleware/classMiddleware');

router.route('/')
  .post(protect, checkPermission('manageClasses'), validateClassCreation, createClass)
  .get(protect, checkPermission('viewClasses'), getSchoolClasses);

router.route('/:classId')
  .put(protect, checkPermission('manageClasses'), updateClass);

router.route('/:classId/enroll')
  .post(protect, checkPermission('manageEnrollments'), enrollStudents);

router.route('/:classId/transfer')
  .post(protect, checkPermission('manageEnrollments'), transferStudent);

router.route('/students/:studentId/history')
  .get(protect, checkPermission('viewStudents'), getEnrollmentHistory);

router.route('/:classId/assign-teacher')
  .put(protect, checkPermission('assignTeachers'), validateTeacherSchedule, assignTeacher);

router.route('/teacher/:teacherId/schedule')
  .get(protect, checkPermission('viewTeachers'), getTeacherSchedule);

module.exports = router;
