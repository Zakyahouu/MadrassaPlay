// server/models/LandingPageAnalytics.js

const mongoose = require('mongoose');

/**
 * LandingPageAnalytics Model
 * Stores daily aggregated analytics for school landing pages
 * Tracks views, engagement, conversions, and user behavior
 */
const landingPageAnalyticsSchema = new mongoose.Schema(
  {
    // Reference to school
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    
    // Date for this analytics record (aggregated by day)
    date: {
      type: Date,
      required: true,
      index: true
    },
    
    // Traffic Metrics
    pageViews: {
      type: Number,
      default: 0
    },
    
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    
    // Visitor tracking (for unique count)
    visitorIds: [{
      type: String
    }],
    
    // Engagement Metrics
    ctaClicks: {
      total: { type: Number, default: 0 },
      bySection: {
        type: Map,
        of: Number,
        default: {}
      }
    },
    
    // Conversion Metrics
    contactFormSubmissions: {
      type: Number,
      default: 0
    },
    
    contactFormViews: {
      type: Number,
      default: 0
    },
    
    // Conversion rate (calculated field)
    conversionRate: {
      type: Number,
      default: 0
    },
    
    // Time Metrics (in seconds)
    totalTimeOnPage: {
      type: Number,
      default: 0
    },
    
    avgTimeOnPage: {
      type: Number,
      default: 0
    },
    
    // Bounce tracking
    bounces: {
      type: Number,
      default: 0
    },
    
    bounceRate: {
      type: Number,
      default: 0
    },
    
    // Section Engagement
    sectionViews: {
      type: Map,
      of: Number,
      default: {}
    },
    
    sectionTimeSpent: {
      type: Map,
      of: Number,
      default: {}
    },
    
    // Traffic Sources
    sources: {
      direct: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      referral: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // Device breakdown
    devices: {
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 }
    },
    
    // Top referrers
    topReferrers: [{
      url: String,
      count: Number
    }]
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
landingPageAnalyticsSchema.index({ school: 1, date: -1 });
landingPageAnalyticsSchema.index({ date: -1 });

// Pre-save hook to calculate derived metrics
landingPageAnalyticsSchema.pre('save', function(next) {
  // Calculate unique visitors
  if (this.visitorIds && this.visitorIds.length > 0) {
    this.uniqueVisitors = [...new Set(this.visitorIds)].length;
  }
  
  // Calculate average time on page
  if (this.pageViews > 0) {
    this.avgTimeOnPage = Math.round(this.totalTimeOnPage / this.pageViews);
  }
  
  // Calculate bounce rate
  if (this.pageViews > 0) {
    this.bounceRate = Math.round((this.bounces / this.pageViews) * 100);
  }
  
  // Calculate conversion rate
  if (this.pageViews > 0) {
    this.conversionRate = Math.round((this.contactFormSubmissions / this.pageViews) * 100 * 100) / 100;
  }
  
  next();
});

// Static method to get or create today's analytics record
landingPageAnalyticsSchema.statics.getTodayRecord = async function(schoolId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let record = await this.findOne({
    school: schoolId,
    date: today
  });
  
  if (!record) {
    record = await this.create({
      school: schoolId,
      date: today
    });
  }
  
  return record;
};

// Method to track page view
landingPageAnalyticsSchema.statics.trackPageView = async function(schoolId, visitorId, device = 'desktop') {
  const record = await this.getTodayRecord(schoolId);
  
  record.pageViews += 1;
  
  // Track unique visitor
  if (visitorId && !record.visitorIds.includes(visitorId)) {
    record.visitorIds.push(visitorId);
  }
  
  // Track device
  if (record.devices[device] !== undefined) {
    record.devices[device] += 1;
  }
  
  await record.save();
  return record;
};

// Method to track CTA click
landingPageAnalyticsSchema.statics.trackCTAClick = async function(schoolId, sectionType) {
  const record = await this.getTodayRecord(schoolId);
  
  record.ctaClicks.total += 1;
  
  // Track by section
  const currentCount = record.ctaClicks.bySection.get(sectionType) || 0;
  record.ctaClicks.bySection.set(sectionType, currentCount + 1);
  
  await record.save();
  return record;
};

// Method to track contact form submission
landingPageAnalyticsSchema.statics.trackContactSubmission = async function(schoolId) {
  const record = await this.getTodayRecord(schoolId);
  
  record.contactFormSubmissions += 1;
  
  await record.save();
  return record;
};

// Method to track section view
landingPageAnalyticsSchema.statics.trackSectionView = async function(schoolId, sectionType) {
  const record = await this.getTodayRecord(schoolId);
  
  const currentCount = record.sectionViews.get(sectionType) || 0;
  record.sectionViews.set(sectionType, currentCount + 1);
  
  await record.save();
  return record;
};

// Method to track time on page
landingPageAnalyticsSchema.statics.trackTimeOnPage = async function(schoolId, timeSpent) {
  const record = await this.getTodayRecord(schoolId);
  
  record.totalTimeOnPage += timeSpent;
  
  await record.save();
  return record;
};

// Method to track bounce
landingPageAnalyticsSchema.statics.trackBounce = async function(schoolId) {
  const record = await this.getTodayRecord(schoolId);
  
  record.bounces += 1;
  
  await record.save();
  return record;
};

// Static method to get analytics for date range
landingPageAnalyticsSchema.statics.getAnalytics = async function(schoolId, startDate, endDate) {
  const records = await this.find({
    school: schoolId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
  
  // Calculate totals
  const totals = records.reduce((acc, record) => {
    acc.pageViews += record.pageViews;
    acc.uniqueVisitors += record.uniqueVisitors;
    acc.contactFormSubmissions += record.contactFormSubmissions;
    acc.totalTimeOnPage += record.totalTimeOnPage;
    acc.ctaClicks += record.ctaClicks.total;
    return acc;
  }, {
    pageViews: 0,
    uniqueVisitors: 0,
    contactFormSubmissions: 0,
    totalTimeOnPage: 0,
    ctaClicks: 0
  });
  
  // Calculate averages
  if (records.length > 0) {
    totals.avgTimeOnPage = Math.round(totals.totalTimeOnPage / totals.pageViews);
    totals.conversionRate = totals.pageViews > 0 
      ? Math.round((totals.contactFormSubmissions / totals.pageViews) * 100 * 100) / 100
      : 0;
  }
  
  return {
    records,
    totals
  };
};

module.exports = mongoose.model('LandingPageAnalytics', landingPageAnalyticsSchema);
