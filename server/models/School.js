// server/models/School.js

const mongoose = require('mongoose');

// This is the blueprint for our School documents.
const schoolSchema = new mongoose.Schema(
  {
    // The 'name' of the school is a simple string and is required.
    // We also make it 'unique' to prevent creating two schools with the same name.
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Removes any extra whitespace from the beginning or end.
    },
    principal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    managers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    contact: {
      email: String,
      phone: String,
      address: String
    },
    logo: { type: String },
    
    // Comprehensive Landing Page System
    landingPage: {
      // Status flags
      isEnabled: { type: Boolean, default: false },
      isDraft: { type: Boolean, default: true },
      publishedAt: { type: Date },
      lastEditedAt: { type: Date },
      
      // Complete configuration as JSON
      config: {
        // Theme Configuration
        theme: {
          primaryColor: { type: String, default: '#3B82F6' },
          secondaryColor: { type: String, default: '#F97316' },
          accentColor: { type: String, default: '#8B5CF6' },
          backgroundColor: { type: String, default: '#FFFFFF' },
          textColor: { type: String, default: '#1F2937' },
          fontFamily: { type: String, default: 'Inter' },
          buttonStyle: { type: String, default: 'rounded' },
          buttonVariant: { type: String, default: 'filled' },
          spacing: { type: String, default: 'normal' },
          animations: { type: Boolean, default: true }
        },
        
        // SEO Configuration
        seo: {
          metaTitle: { type: String },
          metaDescription: { type: String },
          keywords: [{ type: String }],
          ogImage: { type: String },
          ogTitle: { type: String },
          ogDescription: { type: String },
          twitterCard: { type: String },
          twitterImage: { type: String }
        },
        
        // Sections array - flexible structure for all content
        sections: [{
          type: { type: String, required: true },
          enabled: { type: Boolean, default: true },
          order: { type: Number, required: true },
          data: { type: mongoose.Schema.Types.Mixed }
        }]
      },
      
      // Revision history for rollback capability
      revisions: [{
        config: { type: mongoose.Schema.Types.Mixed },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }]
    },
    
    // Trial System Fields
    status: {
      type: String,
      enum: ['trial', 'active', 'inactive', 'deleted'],
      default: 'trial'
    },
    trialStartedAt: {
      type: Date,
      default: Date.now
    },
    trialExpiresAt: {
      type: Date,
      default: function() {
        // 30 days trial by default
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    },
    subscriptionStartedAt: {
      type: Date
    },
    subscriptionExpiresAt: {
      type: Date
  }
    // We can add more details about the school later if needed,
    // like address, contact info, etc.
  },
  {
    // This option automatically adds 'createdAt' and 'updatedAt' timestamp fields.
    timestamps: true,
  }
);

// We compile our schema into a model named 'School'.
// Mongoose will create a 'schools' collection in the database for this model.
module.exports = mongoose.model('School', schoolSchema);
