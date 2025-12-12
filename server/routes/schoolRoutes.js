
const express = require('express');
const router = express.Router();

// Import controller functions
const { createSchool, getSchools, updateSchool, deleteSchool, createManagerForSchool, updateManagerForSchool, deleteManagerForSchool } = require('../controllers/schoolController');
// Import middleware for protection
const { protect, admin, manager } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const { 
  updateMySchoolLandingPage, 
  uploadMySchoolLandingImage,
  getLandingPageConfig,
  updateLandingPageConfig,
  publishLandingPage,
  getLandingPageRevisions,
  revertLandingPageRevision,
  initializeLandingPage
} = require('../controllers/schoolController');

const {
  getInquiries,
  updateInquiryStatus,
  getInquiryStats,
  getLandingPageAnalytics,
  getDetailedAnalytics,
  exportAnalytics
} = require('../controllers/landingPageAnalyticsController');

// POST create manager for a school
router.route('/:id/managers').post(protect, admin, createManagerForSchool);

// PUT update manager, DELETE remove manager
router.route('/:schoolId/managers/:managerId')
  .put(protect, admin, updateManagerForSchool)
  .delete(protect, admin, deleteManagerForSchool);

// GET all schools, POST create school
router.route('/').get(protect, admin, getSchools).post(protect, admin, createSchool);

// GET schools count
router.get('/count', protect, admin, async (req, res) => {
  try {
    const School = require('../models/School');
    const count = await School.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// GET school by id, PUT update school, DELETE remove school
router.route('/:id')
  .get(protect, adminOrManager, require('../controllers/schoolController').getSchoolById)
  .put(protect, admin, updateSchool)
  .delete(protect, admin, deleteSchool);

// Landing page for a manager's school (legacy routes - kept for backward compatibility)
router.put('/my-school/landing-page', protect, authorize('manager', 'admin'), updateMySchoolLandingPage);
router.post('/my-school/landing-page/upload', protect, authorize('manager', 'admin'), (req, res, next) => { req.uploadTarget = 'ads'; next(); }, upload.single('image'), handleMulterError, uploadMySchoolLandingImage);

// NEW Landing Page Builder Routes
router.get('/my-school/landing-page/config', protect, authorize('manager', 'admin'), getLandingPageConfig);
router.put('/my-school/landing-page/config', protect, authorize('manager', 'admin'), updateLandingPageConfig);
router.post('/my-school/landing-page/publish', protect, authorize('manager', 'admin'), publishLandingPage);
router.get('/my-school/landing-page/revisions', protect, authorize('manager', 'admin'), getLandingPageRevisions);
router.post('/my-school/landing-page/revert/:revisionIndex', protect, authorize('manager', 'admin'), revertLandingPageRevision);
router.post('/my-school/landing-page/initialize', protect, authorize('manager', 'admin'), initializeLandingPage);

// Landing Page Analytics Routes
router.get('/my-school/landing-page/analytics', protect, authorize('manager', 'admin'), getLandingPageAnalytics);
router.get('/my-school/landing-page/analytics/detailed', protect, authorize('manager', 'admin'), getDetailedAnalytics);
router.get('/my-school/landing-page/analytics/export', protect, authorize('manager', 'admin'), exportAnalytics);

// Contact Inquiries Routes
router.get('/my-school/inquiries', protect, authorize('manager', 'admin'), getInquiries);
router.get('/my-school/inquiries/stats', protect, authorize('manager', 'admin'), getInquiryStats);
router.patch('/my-school/inquiries/:id', protect, authorize('manager', 'admin'), updateInquiryStatus);




// Custom middleware to allow admin or manager to access GET /api/schools/:id
function adminOrManager(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized.' });
  }
}

module.exports = router;
