// server/controllers/landingPagePublicController.js

const ContactInquiry = require('../models/ContactInquiry');
const LandingPageAnalytics = require('../models/LandingPageAnalytics');
const School = require('../models/School');

/**
 * @desc    Submit contact form from landing page
 * @route   POST /api/public/landing-page/:schoolId/contact
 * @access  Public
 */
const submitContactForm = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Name, email, and message are required' 
      });
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Extract metadata
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer') || req.get('referrer');

    // Create inquiry
    const inquiry = await ContactInquiry.create({
      school: schoolId,
      name,
      email,
      phone,
      message,
      source: 'landing_page',
      ipAddress,
      userAgent,
      referrer
    });

    // Track conversion in analytics
    await LandingPageAnalytics.trackContactSubmission(schoolId);

    // TODO: Send email notification to school managers
    // This can be implemented later with a notification service

    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you soon.',
      inquiryId: inquiry._id
    });
  } catch (error) {
    console.error('submitContactForm error:', error.message);
    res.status(500).json({ 
      message: 'Failed to submit inquiry. Please try again later.',
      error: error.message 
    });
  }
};

/**
 * @desc    Track analytics event
 * @route   POST /api/public/landing-page/:schoolId/track
 * @access  Public
 */
const trackAnalyticsEvent = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { eventType, data } = req.body;

    if (!eventType) {
      return res.status(400).json({ message: 'Event type is required' });
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Generate or get visitor ID from client
    const visitorId = data?.visitorId || req.ip;

    // Detect device type
    const userAgent = req.get('user-agent') || '';
    let device = 'desktop';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';

    // Handle different event types
    switch (eventType) {
      case 'page_view':
        await LandingPageAnalytics.trackPageView(schoolId, visitorId, device);
        break;

      case 'cta_click':
        const sectionType = data?.section || 'unknown';
        await LandingPageAnalytics.trackCTAClick(schoolId, sectionType);
        break;

      case 'section_view':
        const section = data?.section;
        if (section) {
          await LandingPageAnalytics.trackSectionView(schoolId, section);
        }
        break;

      case 'time_on_page':
        const timeSpent = data?.timeSpent;
        if (timeSpent && typeof timeSpent === 'number') {
          await LandingPageAnalytics.trackTimeOnPage(schoolId, timeSpent);
        }
        break;

      case 'bounce':
        await LandingPageAnalytics.trackBounce(schoolId);
        break;

      case 'contact_form_view':
        const record = await LandingPageAnalytics.getTodayRecord(schoolId);
        record.contactFormViews += 1;
        await record.save();
        break;

      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }

    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('trackAnalyticsEvent error:', error.message);
    // Don't expose error details for analytics - just return success
    // This prevents analytics errors from breaking the user experience
    res.json({ success: true });
  }
};

/**
 * @desc    Get public landing page data with analytics tracking
 * @route   GET /api/public/landing-page/:schoolId
 * @access  Public
 */
const getPublicLandingPageWithTracking = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId is required' });
    }

    const school = await School.findById(schoolId).select('name logo landingPage');
    
    if (!school) {
      return res.status(404).json({ message: 'Landing page not found' });
    }

    const landingPage = school.landingPage || {};

    // Check if landing page is enabled and published
    if (!landingPage.isEnabled || landingPage.isDraft) {
      return res.status(404).json({ message: 'Landing page not available' });
    }

    // Return config-based landing page if it exists
    if (landingPage.config) {
      return res.json({
        name: school.name,
        logo: school.logo,
        config: landingPage.config,
        publishedAt: landingPage.publishedAt
      });
    }

    // Fallback to legacy format for backward compatibility
    res.json({
      name: school.name,
      logo: school.logo,
      pageContent: landingPage
    });
  } catch (error) {
    console.error('getPublicLandingPageWithTracking error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  submitContactForm,
  trackAnalyticsEvent,
  getPublicLandingPageWithTracking
};
