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

module.exports = {
  createSchool,
  getSchools,
};
