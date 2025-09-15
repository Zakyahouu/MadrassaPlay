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
    const { name, firstName, lastName, email, password } = req.body;

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
    const { name, contact, managers } = req.body;

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
    if (updateData.subscriptionStartDate !== undefined) school.subscriptionStartDate = updateData.subscriptionStartDate;
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
      .populate('managers', 'firstName lastName name email username contact');
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

module.exports = {
  createSchool,
  getSchools,
  updateSchool,
  deleteSchool,
  createManagerForSchool,
  updateManagerForSchool,
  deleteManagerForSchool,
  getSchoolById,
};
