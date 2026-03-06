// server/controllers/landingPageAnalyticsController.js

const ContactInquiry = require('../models/ContactInquiry');
const LandingPageAnalytics = require('../models/LandingPageAnalytics');
const School = require('../models/School');

/**
 * @desc    Get all inquiries for manager's school
 * @route   GET /api/schools/my-school/inquiries
 * @access  Private (Manager, Admin)
 */
const getInquiries = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) {
      return res.status(403).json({ message: 'User is not assigned to a school' });
    }

    const { status, limit = 50, page = 1 } = req.query;

    const query = { school: userSchoolId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const inquiries = await ContactInquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('respondedBy', 'firstName lastName email');

    const total = await ContactInquiry.countDocuments(query);

    res.json({
      success: true,
      inquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getInquiries error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Update inquiry status
 * @route   PATCH /api/schools/my-school/inquiries/:id
 * @access  Private (Manager, Admin)
 */
const updateInquiryStatus = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) {
      return res.status(403).json({ message: 'User is not assigned to a school' });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const inquiry = await ContactInquiry.findOne({
      _id: id,
      school: userSchoolId
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    if (status) inquiry.status = status;
    if (notes !== undefined) inquiry.notes = notes;

    // Track response
    if (status === 'contacted' && !inquiry.respondedAt) {
      inquiry.respondedAt = new Date();
      inquiry.respondedBy = req.user._id;
    }

    await inquiry.save();

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    console.error('updateInquiryStatus error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get inquiry statistics
 * @route   GET /api/schools/my-school/inquiries/stats
 * @access  Private (Manager, Admin)
 */
const getInquiryStats = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) {
      return res.status(403).json({ message: 'User is not assigned to a school' });
    }

    const { startDate, endDate } = req.query;

    const stats = await ContactInquiry.getStats(userSchoolId, {
      start: startDate,
      end: endDate
    });

    // Get recent inquiries
    const recentInquiries = await ContactInquiry.find({
      school: userSchoolId
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email message status createdAt');

    res.json({
      success: true,
      stats,
      recentInquiries
    });
  } catch (error) {
    console.error('getInquiryStats error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get landing page analytics
 * @route   GET /api/schools/my-school/landing-page/analytics
 * @access  Private (Manager, Admin)
 */
const getLandingPageAnalytics = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) {
      return res.status(403).json({ message: 'User is not assigned to a school' });
    }

    const { startDate, endDate, period = '30' } = req.query;

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate)
      : new Date(end.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get analytics data
    const { records, totals } = await LandingPageAnalytics.getAnalytics(
      userSchoolId,
      start,
      end
    );

    // Get today's data for real-time metrics
    const today = await LandingPageAnalytics.getTodayRecord(userSchoolId);

    res.json({
      success: true,
      dateRange: {
        start,
        end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      totals,
      today: {
        pageViews: today.pageViews,
        uniqueVisitors: today.uniqueVisitors,
        contactFormSubmissions: today.contactFormSubmissions,
        ctaClicks: today.ctaClicks.total,
        conversionRate: today.conversionRate
      },
      records: records.map(r => ({
        date: r.date,
        pageViews: r.pageViews,
        uniqueVisitors: r.uniqueVisitors,
        contactFormSubmissions: r.contactFormSubmissions,
        ctaClicks: r.ctaClicks.total,
        avgTimeOnPage: r.avgTimeOnPage,
        bounceRate: r.bounceRate,
        conversionRate: r.conversionRate
      }))
    });
  } catch (error) {
    console.error('getLandingPageAnalytics error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get detailed analytics with section breakdown
 * @route   GET /api/schools/my-school/landing-page/analytics/detailed
 * @access  Private (Manager, Admin)
 */
const getDetailedAnalytics = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) {
      return res.status(403).json({ message: 'User is not assigned to a school' });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const record = await LandingPageAnalytics.findOne({
      school: userSchoolId,
      date: targetDate
    });

    if (!record) {
      return res.json({
        success: true,
        message: 'No data available for this date',
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        date: record.date,
        pageViews: record.pageViews,
        uniqueVisitors: record.uniqueVisitors,
        avgTimeOnPage: record.avgTimeOnPage,
        bounceRate: record.bounceRate,
        conversionRate: record.conversionRate,
        contactFormSubmissions: record.contactFormSubmissions,
        contactFormViews: record.contactFormViews,
        ctaClicks: {
          total: record.ctaClicks.total,
          bySection: Object.fromEntries(record.ctaClicks.bySection || new Map())
        },
        sectionViews: Object.fromEntries(record.sectionViews || new Map()),
        devices: record.devices,
        sources: record.sources,
        topReferrers: record.topReferrers
      }
    });
  } catch (error) {
    console.error('getDetailedAnalytics error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Export analytics data as CSV
 * @route   GET /api/schools/my-school/landing-page/analytics/export
 * @access  Private (Manager, Admin)
 */
const exportAnalytics = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) {
      return res.status(403).json({ message: 'User is not assigned to a school' });
    }

    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { records } = await LandingPageAnalytics.getAnalytics(
      userSchoolId,
      start,
      end
    );

    // Generate CSV
    const csvHeader = 'Date,Page Views,Unique Visitors,CTA Clicks,Contact Submissions,Avg Time (sec),Bounce Rate (%),Conversion Rate (%)\n';
    const csvRows = records.map(r => {
      return `${r.date.toISOString().split('T')[0]},${r.pageViews},${r.uniqueVisitors},${r.ctaClicks.total},${r.contactFormSubmissions},${r.avgTimeOnPage},${r.bounceRate},${r.conversionRate}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=landing-page-analytics-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('exportAnalytics error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getInquiries,
  updateInquiryStatus,
  getInquiryStats,
  getLandingPageAnalytics,
  getDetailedAnalytics,
  exportAnalytics
};
