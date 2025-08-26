// server/middleware/schoolValidation.js

const School = require('../models/School');
const User = require('../models/User');

// Phone number validation (basic international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSchoolData = async (req, res, next) => {
  try {
    const { name, address, phone1, phone2, email, commercialRegistryNo } = req.body;

    // Required field validation
    if (!name || !address || !phone1 || !email || !commercialRegistryNo) {
      return res.status(400).json({
        message: 'Missing required fields: name, address, phone1, email, commercialRegistryNo'
      });
    }

    // Phone number validation
    if (!phoneRegex.test(phone1)) {
      return res.status(400).json({
        message: 'Invalid phone1 format. Please use international format.'
      });
    }

    if (phone2 && !phoneRegex.test(phone2)) {
      return res.status(400).json({
        message: 'Invalid phone2 format. Please use international format.'
      });
    }

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format.'
      });
    }

    // Check school name uniqueness (case-insensitive)
    const existingSchoolByName = await School.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingSchoolByName && existingSchoolByName._id.toString() !== req.params.id) {
      return res.status(400).json({
        message: 'School name already exists (case-insensitive).'
      });
    }

    // Check commercial registry number uniqueness
    const existingSchoolByRegistry = await School.findOne({
      commercialRegistryNo: commercialRegistryNo
    });

    if (existingSchoolByRegistry && existingSchoolByRegistry._id.toString() !== req.params.id) {
      return res.status(400).json({
        message: 'Commercial registry number already exists.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Validation error', error: error.message });
  }
};

const validateManagerData = (req, res, next) => {
  const { manager } = req.body;

  if (!manager) {
    return res.status(400).json({
      message: 'Manager data is required for school creation.'
    });
  }

  const { firstName, lastName, phone1, phone2, address, username, password } = manager;

  // Required field validation
  if (!firstName || !lastName || !phone1 || !address || !password) {
    return res.status(400).json({
      message: 'Missing required manager fields: firstName, lastName, phone1, address, password'
    });
  }

  // Phone validation
  if (!phoneRegex.test(phone1)) {
    return res.status(400).json({
      message: 'Invalid manager phone1 format.'
    });
  }

  if (phone2 && !phoneRegex.test(phone2)) {
    return res.status(400).json({
      message: 'Invalid manager phone2 format.'
    });
  }

  // Password validation (minimum 8 characters)
  if (password.length < 8) {
    return res.status(400).json({
      message: 'Manager password must be at least 8 characters long.'
    });
  }

  next();
};

const generateManagerUsername = (schoolName, providedUsername) => {
  if (providedUsername && providedUsername.trim()) {
    return providedUsername.trim();
  }
  
  // Auto-generate username from school name
  const cleanSchoolName = schoolName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
  
  return `manager-${cleanSchoolName}`;
};

module.exports = {
  validateSchoolData,
  validateManagerData,
  generateManagerUsername,
  phoneRegex,
  emailRegex,
};
