// @desc    Update a manager account
// @route   PUT /api/schools/:schoolId/managers/:managerId
// @access  Private/Admin
const updateManagerForSchool = async (req, res) => {
  try {
    const { schoolId, managerId } = req.params;
    const { name, firstName, lastName, email, username, password, contact } = req.body;

    const manager = await User.findOne({ _id: managerId, role: 'manager', school: schoolId });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found for this school.' });
    }

    // Identity fields (support legacy 'name' and new first/last)
    if (name !== undefined) manager.name = name;
    if (firstName !== undefined) manager.firstName = firstName;
    if (lastName !== undefined) manager.lastName = lastName;
    if (email !== undefined) manager.email = email;
    if (username !== undefined) manager.username = username;

    // Contact fields (nested)
    if (contact && typeof contact === 'object') {
      const current = manager.contact?.toObject?.() || manager.contact || {};
      manager.contact = {
        ...current,
        ...(contact.phone1 !== undefined ? { phone1: contact.phone1 } : {}),
        ...(contact.phone2 !== undefined ? { phone2: contact.phone2 } : {}),
        ...(contact.address !== undefined ? { address: contact.address } : {}),
      };
    }

    if (password) {
      manager.password = await bcrypt.hash(password, 10);
    }

    await manager.save();
    res.status(200).json(manager);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a manager account
// @route   DELETE /api/schools/:schoolId/managers/:managerId
// @access  Private/Admin
const deleteManagerForSchool = async (req, res) => {
  try {
    const { schoolId, managerId } = req.params;

    const manager = await User.findOne({ _id: managerId, role: 'manager', school: schoolId });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found for this school.' });
    }

    // Remove manager from school's managers array
    const school = await School.findById(schoolId);
    if (school) {
      school.managers = school.managers.filter(id => id.toString() !== managerId);
      await school.save();
    }

    await manager.deleteOne();
    res.status(200).json({ message: 'Manager deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
const User = require('../models/User');
const bcrypt = require('bcryptjs');
// @desc    Create a manager account and assign to a school
// @route   POST /api/schools/:id/managers
// @access  Private/Admin
const createManagerForSchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const { name, firstName, lastName, email, password, contact, address, phone1, phone2 } = req.body;

    // Support both name (legacy) and firstName/lastName (new) formats
    const hasName = name || (firstName && lastName);
    if (!hasName || !email || !password) {
      return res.status(400).json({ message: 'Name (or first name and last name), email, and password are required.' });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create manager user
    const managerData = {
      email,
      password: hashedPassword,
      role: 'manager',
      school: school._id,
      accessLevel: 'principal'
    };

    // Handle name fields - support both formats
    if (firstName && lastName) {
      managerData.firstName = firstName;
      managerData.lastName = lastName;
    } else if (name) {
      managerData.name = name;
    }

    const contactPayload = {};
    const contactSource = (contact && typeof contact === 'object') ? contact : {};
    const resolvedAddress = contactSource.address ?? address;
    const resolvedPhone1 = contactSource.phone1 ?? phone1;
    const resolvedPhone2 = contactSource.phone2 ?? phone2;

    if (resolvedAddress !== undefined) contactPayload.address = resolvedAddress;
    if (resolvedPhone1 !== undefined) contactPayload.phone1 = resolvedPhone1;
    if (resolvedPhone2 !== undefined) contactPayload.phone2 = resolvedPhone2;
    if (Object.keys(contactPayload).length > 0) {
      managerData.contact = contactPayload;
    }

    const manager = await User.create(managerData);

    // Add manager to school's managers array
    try {
    school.managers.push(manager._id);
    await school.save();
    } catch (error) {
      // If adding to school fails, delete the manager to prevent orphaned data
      await User.findByIdAndDelete(manager._id);
      throw new Error('Failed to associate manager with school');
    }

    res.status(201).json({ manager, school });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// server/controllers/schoolController.js

const School = require('../models/School');

// @desc    Create a new school
// @route   POST /api/schools
// @access  Private/Admin
const createSchool = async (req, res) => {
  // --- DEBUGGING LOGS ---
  console.log('--- Create School Route Hit ---');
  console.log('Request Body:', req.body);
  // --------------------

  try {
    const { name, contact, managers, status, trialExpiresAt, customTrialDays } = req.body;

    if (!name) {
      console.log('Validation Failed: No name provided.');
      return res.status(400).json({ message: 'Please provide a school name.' });
    }

    const schoolExists = await School.findOne({ name });
    if (schoolExists) {
      console.log('Validation Failed: School already exists.');
      return res.status(400).json({ message: 'School with this name already exists.' });
    }

    // Validate contact info
    const contactInfo = {
      email: contact?.email || '',
      phone: contact?.phone || '',
      address: contact?.address || ''
    };

    // Validate managers array
    let managerIds = [];
    if (Array.isArray(managers)) {
      managerIds = managers.filter(id => typeof id === 'string');
    }

    // Principal is optional on creation
    const schoolData = {
      name,
      contact: contactInfo,
      managers: managerIds
    };

    if (status) {
      schoolData.status = status;
    }

    if (status === 'trial') {
      schoolData.trialStartedAt = new Date();
      if (trialExpiresAt) {
        schoolData.trialExpiresAt = trialExpiresAt;
      } else if (Number.isFinite(customTrialDays) && customTrialDays > 0) {
        const expires = new Date();
        expires.setDate(expires.getDate() + customTrialDays);
        schoolData.trialExpiresAt = expires.toISOString();
      }
    }
    if (req.body.principal) {
      schoolData.principal = req.body.principal;
    }

    const school = await School.create(schoolData);

    if (school) {
      console.log('SUCCESS: School created successfully.', school);
      res.status(201).json(school);
    } else {
      console.log('ERROR: School creation returned null or failed.');
      res.status(400).json({ message: 'Invalid school data.' });
    }
  } catch (error) {
    // --- CATCH BLOCK LOG ---
    console.error('SERVER ERROR in createSchool:', error);
    // -----------------------
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all schools
// @route   GET /api/schools
// @access  Private/Admin
const getSchools = async (req, res) => {
  try {
    const schools = await School.find({});
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a school's details
// @route   PUT /api/schools/:id
// @access  Private/Admin
const updateSchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const updateData = req.body;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Handle all possible update fields
    if (updateData.name !== undefined) school.name = updateData.name;
    
    if (updateData.contact) {
      if (!school.contact) school.contact = {};
      if (updateData.contact.email !== undefined) school.contact.email = updateData.contact.email;
      if (updateData.contact.phone !== undefined) school.contact.phone = updateData.contact.phone;
      if (updateData.contact.address !== undefined) school.contact.address = updateData.contact.address;
    }
    
    if (updateData.status !== undefined) school.status = updateData.status;
    if (updateData.trialExpiresAt !== undefined) school.trialExpiresAt = updateData.trialExpiresAt;
    if (updateData.subscriptionStartedAt !== undefined) school.subscriptionStartedAt = updateData.subscriptionStartedAt;
    if (updateData.subscriptionStartDate !== undefined) school.subscriptionStartedAt = updateData.subscriptionStartDate;
    if (updateData.commercialRegistryNo !== undefined) school.commercialRegistryNo = updateData.commercialRegistryNo;
    
    if (updateData.socialLinks) {
      if (!school.socialLinks) school.socialLinks = {};
      Object.keys(updateData.socialLinks).forEach(key => {
        if (updateData.socialLinks[key] !== undefined) {
          school.socialLinks[key] = updateData.socialLinks[key];
        }
      });
    }
    
    if (Array.isArray(updateData.managers)) {
      school.managers = updateData.managers.filter(id => typeof id === 'string');
    }

    const updatedSchool = await school.save();
    
    res.status(200).json(updatedSchool);
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
const deleteSchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }
    await school.deleteOne();
    res.status(200).json({ message: 'School deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a school by ID (with managers populated)
// @route   GET /api/schools/:id
// @access  Private/Admin
const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('managers', 'firstName lastName name email username contact phone1 phone2 address');
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }
    // If manager, only allow access to their own school
    let userSchoolId = req.user.school;
    if (userSchoolId && typeof userSchoolId === 'object' && userSchoolId._id) {
      userSchoolId = userSchoolId._id;
    }
    if (req.user.role === 'manager' && school._id.toString() !== String(userSchoolId)) {
      console.warn(`SECURITY: Manager ${req.user._id} tried to access school ${school._id}, but is assigned to ${JSON.stringify(req.user.school)}`);
      return res.status(403).json({ message: 'Managers can only access their own school.' });
    }
    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Public: Get landing page by school id
// @route   GET /api/public/landing-page/:schoolId
// @access  Public
const getPublicLandingPage = async (req, res) => {
  try {
    const { schoolId } = req.params;
    if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });
    const school = await School.findById(schoolId).select('name logo landingPage');
    if (!school) return res.status(404).json({ message: 'Landing page not found' });
    const page = school.landingPage || {};
    if (!page.isEnabled) return res.status(404).json({ message: 'Landing page not available' });
    res.json({ name: school.name, logo: school.logo, pageContent: page });
  } catch (error) {
    console.error('getPublicLandingPage error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update landing page settings for the manager's own school
// @route   PUT /api/schools/my-school/landing-page
// @access  Private (Manager, Admin)
const updateMySchoolLandingPage = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const school = await School.findById(userSchoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    // Only copy allowed landingPage fields
    const allowed = ['isEnabled', 'heroTitle', 'aboutSection', 'contactPhone', 'contactEmail', 'address', 'galleryImages'];
    if (!school.landingPage) school.landingPage = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) school.landingPage[key] = req.body[key];
    }

    await school.save();

    res.json({ success: true, landingPage: school.landingPage });
  } catch (error) {
    console.error('updateMySchoolLandingPage error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Upload a single landing page gallery image (manager)
// @route   POST /api/schools/my-school/landing-page/upload
// @access  Private (Manager, Admin)
const uploadMySchoolLandingImage = async (req, res) => {
  try {
    // multer handled file and saved it to server/public/uploads/ads by middleware
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Construct a public URL for the image
  const host = req.get('host');
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || req.protocol || 'http';
  const path = `/uploads/ads/${req.file.filename}`;
  const url = `${protocol}://${host}${path}`;
    res.json({ success: true, url });
  } catch (error) {
    console.error('uploadMySchoolLandingImage error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ============ NEW LANDING PAGE BUILDER ROUTES ============

// @desc    Get landing page config for manager's school
// @route   GET /api/schools/my-school/landing-page/config
// @access  Private (Manager, Admin)
const getLandingPageConfig = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const school = await School.findById(userSchoolId).select('name logo landingPage');
    if (!school) return res.status(404).json({ message: 'School not found' });

    // If no config exists, initialize with default template
    if (!school.landingPage || !school.landingPage.config) {
      const DEFAULT_CONFIG = require('../utils/defaultLandingPageTemplate');
      if (!school.landingPage) school.landingPage = {};
      school.landingPage.config = DEFAULT_CONFIG;
      school.landingPage.isDraft = true;
      school.landingPage.lastEditedAt = new Date();
      await school.save();
    }

    res.json({
      success: true,
      config: school.landingPage.config,
      status: {
        isEnabled: school.landingPage.isEnabled || false,
        isDraft: school.landingPage.isDraft !== false,
        publishedAt: school.landingPage.publishedAt,
        lastEditedAt: school.landingPage.lastEditedAt
      }
    });
  } catch (error) {
    console.error('getLandingPageConfig error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update landing page config (saves as draft)
// @route   PUT /api/schools/my-school/landing-page/config
// @access  Private (Manager, Admin)
const updateLandingPageConfig = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const school = await School.findById(userSchoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const { config } = req.body;
    if (!config) return res.status(400).json({ message: 'Config is required' });

    // Save current version to revisions before updating
    if (school.landingPage && school.landingPage.config) {
      if (!school.landingPage.revisions) school.landingPage.revisions = [];
      school.landingPage.revisions.push({
        config: school.landingPage.config,
        createdAt: new Date(),
        createdBy: req.user._id
      });
      // Keep only last 10 revisions
      if (school.landingPage.revisions.length > 10) {
        school.landingPage.revisions = school.landingPage.revisions.slice(-10);
      }
    }

    // Update config
    if (!school.landingPage) school.landingPage = {};
    school.landingPage.config = config;
    school.landingPage.isDraft = true;
    school.landingPage.lastEditedAt = new Date();

    await school.save();

    res.json({
      success: true,
      message: 'Config saved as draft',
      config: school.landingPage.config
    });
  } catch (error) {
    console.error('updateLandingPageConfig error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Publish landing page (make draft live)
// @route   POST /api/schools/my-school/landing-page/publish
// @access  Private (Manager, Admin)
const publishLandingPage = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const school = await School.findById(userSchoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    if (!school.landingPage || !school.landingPage.config) {
      return res.status(400).json({ message: 'No landing page config to publish' });
    }

    school.landingPage.isDraft = false;
    school.landingPage.isEnabled = true;
    school.landingPage.publishedAt = new Date();

    await school.save();

    res.json({
      success: true,
      message: 'Landing page published successfully',
      publishedAt: school.landingPage.publishedAt
    });
  } catch (error) {
    console.error('publishLandingPage error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get revision history
// @route   GET /api/schools/my-school/landing-page/revisions
// @access  Private (Manager, Admin)
const getLandingPageRevisions = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const school = await School.findById(userSchoolId)
      .select('landingPage.revisions')
      .populate('landingPage.revisions.createdBy', 'firstName lastName email');
    
    if (!school) return res.status(404).json({ message: 'School not found' });

    const revisions = school.landingPage?.revisions || [];

    res.json({
      success: true,
      revisions: revisions.reverse() // Most recent first
    });
  } catch (error) {
    console.error('getLandingPageRevisions error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Revert to a previous revision
// @route   POST /api/schools/my-school/landing-page/revert/:revisionIndex
// @access  Private (Manager, Admin)
const revertLandingPageRevision = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const { revisionIndex } = req.params;
    const school = await School.findById(userSchoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    if (!school.landingPage || !school.landingPage.revisions || !school.landingPage.revisions[revisionIndex]) {
      return res.status(404).json({ message: 'Revision not found' });
    }

    const revisionConfig = school.landingPage.revisions[revisionIndex].config;

    // Save current as revision before reverting
    if (school.landingPage.config) {
      school.landingPage.revisions.push({
        config: school.landingPage.config,
        createdAt: new Date(),
        createdBy: req.user._id
      });
    }

    // Apply old revision
    school.landingPage.config = revisionConfig;
    school.landingPage.isDraft = true;
    school.landingPage.lastEditedAt = new Date();

    await school.save();

    res.json({
      success: true,
      message: 'Reverted to previous version',
      config: school.landingPage.config
    });
  } catch (error) {
    console.error('revertLandingPageRevision error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Initialize landing page with default template
// @route   POST /api/schools/my-school/landing-page/initialize
// @access  Private (Manager, Admin)
const initializeLandingPage = async (req, res) => {
  try {
    const userSchoolId = (req.user?.school && (req.user.school._id || req.user.school)) || null;
    if (!userSchoolId) return res.status(403).json({ message: 'User is not assigned to a school' });

    const school = await School.findById(userSchoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const DEFAULT_CONFIG = require('../utils/defaultLandingPageTemplate');
    
    if (!school.landingPage) school.landingPage = {};
    school.landingPage.config = DEFAULT_CONFIG;
    school.landingPage.isDraft = true;
    school.landingPage.isEnabled = false;
    school.landingPage.lastEditedAt = new Date();

    await school.save();

    res.json({
      success: true,
      message: 'Landing page initialized with default template',
      config: school.landingPage.config
    });
  } catch (error) {
    console.error('initializeLandingPage error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createSchool,
  getSchools,
  updateSchool,
  deleteSchool,
  createManagerForSchool,
  updateManagerForSchool,
  deleteManagerForSchool,
  getSchoolById,
  updateMySchoolLandingPage,
  uploadMySchoolLandingImage,
  getPublicLandingPage,
  // New Landing Page Builder functions
  getLandingPageConfig,
  updateLandingPageConfig,
  publishLandingPage,
  getLandingPageRevisions,
  revertLandingPageRevision,
  initializeLandingPage,
};

