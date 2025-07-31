// server/controllers/schoolController.js

const School = require('../models/School');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// @desc    Create a new school
// @route   POST /api/schools
// @access  Private/Admin
const createSchool = async (req, res) => {
  // --- DEBUGGING LOGS ---
  console.log('--- Create School Route Hit ---');
  console.log('Request Body:', req.body);
  // --------------------

  try {
    const { name } = req.body;

    if (!name) {
      console.log('Validation Failed: No name provided.');
      return res.status(400).json({ message: 'Please provide a school name.' });
    }

    const schoolExists = await School.findOne({ name });

    if (schoolExists) {
      console.log('Validation Failed: School already exists.');
      return res.status(400).json({ message: 'School with this name already exists.' });
    }

    console.log('Validation Passed. Attempting to create school in DB...');
    const school = await School.create({ name });

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

// @desc    Assign principal to a school
// @route   POST /api/schools/:schoolId/principal
// @access  Private/Admin
const assignPrincipal = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { schoolId } = req.params;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create principal account with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const principal = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'staff',
      staffRole: 'principal',
      school: schoolId
    });

    // Update school with principal
    school.principal = principal._id;
    await school.save();

    res.status(201).json({
      message: 'Principal assigned successfully',
      principal: {
        id: principal._id,
        name: principal.name,
        email: principal.email
      }
    });
  } catch (error) {
    console.error("Error in assignPrincipal:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get details of a school
// @route   GET /api/schools/:schoolId
// @access  Private/Admin
const getSchoolDetails = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const school = await School.findById(schoolId)
    .populate('principal', 'name email')
    .populate('staff.user', 'name email staffRole');

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  res.json(school);
});

const updateSchoolDetails = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { name, address, contact, status } = req.body;

  const school = await School.findById(schoolId);
  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  school.name = name || school.name;
  if (address) school.address = address;
  if (contact) school.contact = contact;
  if (status) school.status = status;

  const updatedSchool = await school.save();
  res.json(updatedSchool);
});

const resetManagerPassword = asyncHandler(async (req, res) => {
  const { managerId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400);
    throw new Error('New password is required');
  }

  const manager = await User.findOne({ 
    _id: managerId, 
    role: 'staff',
    staffRole: 'principal'
  });

  if (!manager) {
    res.status(404);
    throw new Error('Manager not found');
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  manager.password = hashedPassword;
  await manager.save();

  res.json({ message: 'Password reset successfully' });
});

module.exports = {
  createSchool,
  getSchools,
  assignPrincipal,
  getSchoolDetails,
  updateSchoolDetails,
  resetManagerPassword,
};

