// server/controllers/userController.js

// 1. IMPORT PACKAGES AND MODELS
// ==============================================================================
const User = require('../models/User');
// NEW: Import bcrypt for password hashing
const bcrypt = require('bcryptjs');
// NEW: Import jsonwebtoken for creating user tokens
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');


// 2. HELPER FUNCTION TO GENERATE A TOKEN
// ==============================================================================
const generateToken = (id) => {
  // jwt.sign creates a new token.
  // It takes a payload (the data to store in the token), a secret key, and options.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // The token will be valid for 30 days
  });
};


// 3. DEFINE THE CONTROLLER FUNCTIONS
// ==============================================================================

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // --- NEW: Hash the password ---
    const salt = await bcrypt.genSalt(10); // Generate a "salt" for hashing
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

    // Create the user with the HASHED password
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // Store the hashed password
      role,
    });

    if (user) {
      // If user is created, generate a token and send it back
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id), // Generate and include the token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// @desc    Authenticate a user (login)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by their email
    const user = await User.findOne({ email });

    // Check if user exists AND if the provided password matches the hashed password in the DB
    if (user && (await bcrypt.compare(password, user.password))) {
      // If they match, send back the user data and a new token
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // If user doesn't exist or password doesn't match, send an error
      res.status(401).json({ message: 'Invalid credentials.' }); // 401 means "Unauthorized"
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a user for a school (admin)
// @route   POST /api/users/school/:schoolId
// @access  Private (admin)
const createSchoolUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, staffRole } = req.body;
  const { schoolId } = req.params;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    staffRole: staffRole || 'none',
    school: schoolId
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    school: user.school
  });
});

// @desc    Get users for a school (admin)
// @route   GET /api/users/school/:schoolId
// @access  Private (admin)
const getSchoolUsers = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { role } = req.query;

  const query = { school: schoolId };
  if (role) {
    query.role = role;
  }

  const users = await User.find(query).select('-password');
  res.json(users);
});

// @desc    Get the current user's details
// @route   GET /api/users/profile
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  // Get user data (excluding password)
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('school', 'name');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user);
});

// @desc    Delete a user (admin)
// @route   DELETE /api/users/school/:schoolId/:userId
// @access  Private (admin)
const deleteSchoolUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Optional: Add check to ensure the user belongs to the school being managed
  if (user.school.toString() !== req.params.schoolId) {
    res.status(403);
    throw new Error('User does not belong to this school');
  }

  await user.deleteOne();
  res.json({ message: 'User removed successfully' });
});

// 4. EXPORT THE FUNCTIONS
// ==============================================================================
module.exports = {
  registerUser,
  loginUser,
  createSchoolUser,
  getSchoolUsers,
  getCurrentUser,
  deleteSchoolUser,
};
