// server/routes/catalogRoutes.js

const express = require('express');
const router = express.Router();
const { protect, manager, authorize } = require('../middleware/authMiddleware');
const {
  getSchoolCatalog,
  updateSchoolCatalog,
  addSupportLesson,
  updateSupportLesson,
  deleteSupportLesson,
  addReviewCourse,
  updateReviewCourse,
  deleteReviewCourse,
  addVocationalTraining,
  updateVocationalTraining,
  deleteVocationalTraining,
  addLanguage,
  updateLanguage,
  deleteLanguage,
  addOtherActivity,
  updateOtherActivity,
  deleteOtherActivity
} = require('../controllers/catalogController');

// All routes require authentication; write ops require manager
router.use(protect);

// Main catalog routes
router.route('/:schoolId')
  // Allow managers and teachers to read catalog; teachers cannot modify
  .get(authorize('manager', 'teacher'), getSchoolCatalog)
  .put(manager, updateSchoolCatalog);

// Support Lessons routes
router.route('/:schoolId/support-lessons')
  .post(manager, addSupportLesson);

router.route('/:schoolId/support-lessons/:lessonId')
  .put(manager, updateSupportLesson)
  .delete(manager, deleteSupportLesson);

// Review Courses routes
router.route('/:schoolId/review-courses')
  .post(manager, addReviewCourse);

router.route('/:schoolId/review-courses/:courseId')
  .put(manager, updateReviewCourse)
  .delete(manager, deleteReviewCourse);

// Vocational Trainings routes
router.route('/:schoolId/vocational-trainings')
  .post(manager, addVocationalTraining);

router.route('/:schoolId/vocational-trainings/:trainingId')
  .put(manager, updateVocationalTraining)
  .delete(manager, deleteVocationalTraining);

// Languages routes
router.route('/:schoolId/languages')
  .post(manager, addLanguage);

router.route('/:schoolId/languages/:languageId')
  .put(manager, updateLanguage)
  .delete(manager, deleteLanguage);

// Other Activities routes
router.route('/:schoolId/other-activities')
  .post(manager, addOtherActivity);

router.route('/:schoolId/other-activities/:activityId')
  .put(manager, updateOtherActivity)
  .delete(manager, deleteOtherActivity);

module.exports = router;
