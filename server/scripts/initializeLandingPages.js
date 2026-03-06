// server/scripts/initializeLandingPages.js

/**
 * Script to initialize landing page configs for existing schools
 * Run with: node server/scripts/initializeLandingPages.js
 */

const mongoose = require('mongoose');
const School = require('../models/School');
const DEFAULT_CONFIG = require('../utils/defaultLandingPageTemplate');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/madrassaplay';

async function initializeLandingPages() {
  try {
    console.log('🚀 Starting landing page initialization...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all schools without landing page config
    const schools = await School.find({
      $or: [
        { 'landingPage.config': { $exists: false } },
        { 'landingPage.config': null },
        { landingPage: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${schools.length} schools without landing page config\n`);

    if (schools.length === 0) {
      console.log('✅ All schools already have landing page configs!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    // Initialize each school
    for (const school of schools) {
      try {
        // Initialize landing page object if it doesn't exist
        if (!school.landingPage) {
          school.landingPage = {};
        }

        // Set default config
        school.landingPage.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        school.landingPage.isDraft = true;
        school.landingPage.isEnabled = false;
        school.landingPage.lastEditedAt = new Date();

        // Customize with school's actual info if available
        if (school.name) {
          // Update hero section with school name
          const heroSection = school.landingPage.config.sections.find(s => s.type === 'hero');
          if (heroSection) {
            heroSection.data.title = `Welcome to ${school.name}`;
          }

          // Update SEO meta title
          if (school.landingPage.config.seo) {
            school.landingPage.config.seo.metaTitle = `${school.name} - Online Learning Excellence`;
            school.landingPage.config.seo.ogTitle = school.name;
          }

          // Update footer
          const footerSection = school.landingPage.config.sections.find(s => s.type === 'footer');
          if (footerSection) {
            footerSection.data.copyrightText = `© ${new Date().getFullYear()} ${school.name}. All rights reserved.`;
          }
        }

        // Update contact section with actual school contact info
        if (school.contact) {
          const contactSection = school.landingPage.config.sections.find(s => s.type === 'contact');
          if (contactSection) {
            if (school.contact.email) {
              contactSection.data.contactInfo.email = school.contact.email;
            }
            if (school.contact.phone) {
              contactSection.data.contactInfo.phone = school.contact.phone;
            }
            if (school.contact.address) {
              contactSection.data.contactInfo.address = school.contact.address;
            }
          }
        }

        await school.save();
        successCount++;
        console.log(`✅ Initialized: ${school.name} (ID: ${school._id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error initializing ${school.name}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Initialization Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
initializeLandingPages();
