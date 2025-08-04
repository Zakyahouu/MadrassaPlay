// @desc    Update a manager account
// @route   PUT /api/schools/:schoolId/managers/:managerId
// @access  Private/Admin
const updateManagerForSchool = async (req, res) => {
  try {
    const { schoolId, managerId } = req.params;
    const { name, email, password } = req.body;

    const manager = await User.findOne({ _id: managerId, role: 'manager', school: schoolId });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found for this school.' });
    }

    if (name) manager.name = name;
    if (email) manager.email = email;
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
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
    const manager = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'manager',
      school: school._id,
      accessLevel: 'principal'
    });

    // Add manager to school's managers array
    school.managers.push(manager._id);
    await school.save();

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
    const { name, contact, managers } = req.body;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    if (name) school.name = name;
    if (contact) {
      school.contact.email = contact.email || school.contact.email;
      school.contact.phone = contact.phone || school.contact.phone;
      school.contact.address = contact.address || school.contact.address;
    }
    if (Array.isArray(managers)) {
      school.managers = managers.filter(id => typeof id === 'string');
    }

    await school.save();
    res.status(200).json(school);
  } catch (error) {
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
    const school = await School.findById(req.params.id).populate('managers', 'name email');
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }
    // If manager, only allow access to their own school
    if (req.user.role === 'manager' && school._id.toString() !== req.user.school.toString()) {
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
