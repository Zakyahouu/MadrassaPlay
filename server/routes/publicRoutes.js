const express = require('express');
const router = express.Router();
const { getPublicLandingPage } = require('../controllers/schoolController');
const {
  submitContactForm,
  trackAnalyticsEvent,
  getPublicLandingPageWithTracking
} = require('../controllers/landingPagePublicController');

// Public landing page by school id (legacy - kept for backward compatibility)
router.get('/landing-page/:schoolId', getPublicLandingPage);

// NEW Public Landing Page Routes
// Get landing page with config
router.get('/landing-page/:schoolId/full', getPublicLandingPageWithTracking);

// Contact form submission
router.post('/landing-page/:schoolId/contact', submitContactForm);

// Analytics tracking
router.post('/landing-page/:schoolId/track', trackAnalyticsEvent);

module.exports = router;
