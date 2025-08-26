// server/controllers/userController.js

// 1. IMPORT PACKAGES AND MODELS
// ==============================================================================
const User = require('../models/User');
const School = require('../models/School');
// NEW: Import bcrypt for password hashing
const bcrypt = require('bcryptjs');
// NEW: Import jsonwebtoken for creating user tokens
const jwt = require('jsonwebtoken');


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
    const { name, firstName, lastName, email, password, role, school } = req.body;

    // Support both name (legacy) and firstName/lastName (new) formats
    const hasName = name || (firstName && lastName);
    if (!hasName || !email || !password) {
      console.log('Validation failed:', { name, firstName, lastName, email, password: password ? '[PROVIDED]' : '[MISSING]' });
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
    const userData = {
      email,
      password: hashedPassword, // Store the hashed password
      role,
    };

    // Handle name fields - support both formats
    if (firstName && lastName) {
      userData.firstName = firstName;
      userData.lastName = lastName;
    } else if (name) {
      userData.name = name;
    }

    // Add school if provided
    if (school) {
      userData.school = school;
    }

    const user = await User.create(userData);

    if (user) {
      // If user is a manager and has a school, add them to the school's managers array
      if (user.role === 'manager' && user.school) {
        try {
          const school = await School.findById(user.school);
          if (school) {
            // Add manager to school's managers array if not already present
            if (!school.managers.includes(user._id)) {
              school.managers.push(user._id);
              await school.save();
              console.log(`Manager ${user._id} added to school ${school._id} managers array`);
            }
          } else {
            console.warn(`School ${user.school} not found for manager ${user._id}`);
          }
        } catch (error) {
          console.error('Error adding manager to school:', error);
          // Don't fail the registration if adding to school fails
        }
      }

      // If user is created, generate a token and send it back
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        xp: user.xp,
        level: user.level,
        totalPoints: user.totalPoints,
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
        school: user.school,
        xp: user.xp,
        level: user.level,
        totalPoints: user.totalPoints,
        username: user.username,
        contact: user.contact,
        experience: user.experience,
        status: user.status,
        activities: user.activities,
        rating: user.rating,
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

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
  const { name, email, username, contact, experience, status, activities } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    if (username) user.username = username;
    if (contact) {
      user.contact = {
        phone1: contact.phone1 ?? user.contact?.phone1,
        phone2: contact.phone2 ?? user.contact?.phone2,
        address: contact.address ?? user.contact?.address,
      };
    }
    
    // Update teacher-specific fields if user is a teacher
    if (user.role === 'teacher') {
      if (experience !== undefined) user.experience = experience;
      if (status) user.teacherStatus = status;
      if (Array.isArray(activities)) user.activities = activities;
    }
    // Optional: allow staff/employees to update their own status if exposed in UI
    if ((user.role === 'staff' || user.role === 'employee') && status) {
      user.staffStatus = status;
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Send back the updated user data (without password)
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      school: updatedUser.school,
      experience: updatedUser.experience,
  username: updatedUser.username,
  contact: updatedUser.contact,
  activities: updatedUser.activities,
  status: updatedUser.status,
      rating: updatedUser.rating,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// 4. EXPORT THE FUNCTIONS
// ==============================================================================
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
