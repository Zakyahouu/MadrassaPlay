// server/models/ContactInquiry.js

const mongoose = require('mongoose');

/**
 * ContactInquiry Model
 * Stores contact form submissions from school landing pages
 * Used for lead capture and conversion tracking
 */
const contactInquirySchema = new mongoose.Schema(
  {
    // Reference to the school that received this inquiry
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    
    // Contact information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    
    phone: {
      type: String,
      trim: true
    },
    
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    
    // Source tracking
    source: {
      type: String,
      default: 'landing_page',
      enum: ['landing_page', 'contact_form', 'chat', 'other']
    },
    
    // Status workflow
    status: {
      type: String,
      enum: ['new', 'contacted', 'in_progress', 'converted', 'archived'],
      default: 'new',
      index: true
    },
    
    // Manager notes
    notes: {
      type: String
    },
    
    // Response tracking
    respondedAt: {
      type: Date
    },
    
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Metadata
    ipAddress: {
      type: String
    },
    
    userAgent: {
      type: String
    },
    
    referrer: {
      type: String
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Indexes for better query performance
contactInquirySchema.index({ school: 1, createdAt: -1 });
contactInquirySchema.index({ school: 1, status: 1 });
contactInquirySchema.index({ email: 1 });

// Virtual for time since inquiry
contactInquirySchema.virtual('daysSinceInquiry').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to mark as contacted
contactInquirySchema.methods.markAsContacted = function(userId) {
  this.status = 'contacted';
  this.respondedAt = new Date();
  this.respondedBy = userId;
  return this.save();
};

// Method to mark as converted
contactInquirySchema.methods.markAsConverted = function() {
  this.status = 'converted';
  return this.save();
};

// Static method to get inquiry statistics for a school
contactInquirySchema.statics.getStats = async function(schoolId, dateRange = {}) {
  const match = { school: schoolId };
  
  if (dateRange.start) {
    match.createdAt = { $gte: new Date(dateRange.start) };
  }
  if (dateRange.end) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = new Date(dateRange.end);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
