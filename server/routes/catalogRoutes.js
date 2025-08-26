// server/routes/catalogRoutes.js

const express = require('express');
const router = express.Router();
const { protect, manager } = require('../middleware/authMiddleware');
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

// All routes are protected and require manager role
router.use(protect);
router.use(manager);

// Main catalog routes
router.route('/:schoolId')
  .get(getSchoolCatalog)
  .put(updateSchoolCatalog);

// Support Lessons routes
router.route('/:schoolId/support-lessons')
  .post(addSupportLesson);

router.route('/:schoolId/support-lessons/:lessonId')
  .put(updateSupportLesson)
  .delete(deleteSupportLesson);

// Review Courses routes
router.route('/:schoolId/review-courses')
  .post(addReviewCourse);

router.route('/:schoolId/review-courses/:courseId')
  .put(updateReviewCourse)
  .delete(deleteReviewCourse);

// Vocational Trainings routes
router.route('/:schoolId/vocational-trainings')
  .post(addVocationalTraining);

router.route('/:schoolId/vocational-trainings/:trainingId')
  .put(updateVocationalTraining)
  .delete(deleteVocationalTraining);

// Languages routes
router.route('/:schoolId/languages')
  .post(addLanguage);

router.route('/:schoolId/languages/:languageId')
  .put(updateLanguage)
  .delete(deleteLanguage);

// Other Activities routes
router.route('/:schoolId/other-activities')
  .post(addOtherActivity);

router.route('/:schoolId/other-activities/:activityId')
  .put(updateOtherActivity)
  .delete(deleteOtherActivity);

module.exports = router;
