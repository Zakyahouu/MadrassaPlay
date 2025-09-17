// server/controllers/userController.js

// 1. IMPORT PACKAGES AND MODELS
// ==============================================================================
const User = require('../models/User');
const School = require('../models/School');
// NEW: Import bcrypt for password hashing
const bcrypt = require('bcryptjs');
// NEW: Import jsonwebtoken for creating user tokens
const jwt = require('jsonwebtoken');
const LoggingService = require('../services/loggingService');


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
    const { email, username, password } = req.body;

    // Find the user by email or username (username preferred if provided)
    let user = null;
    if (username) {
      user = await User.findOne({ username });
    } else if (email) {
      user = await User.findOne({ email });
    }

    // Check if user exists AND if the provided password matches the hashed password in the DB
    if (user && (await bcrypt.compare(password, user.password))) {
      // If user is assigned to a school, check school status
      if (user.school) {
        const School = require('../models/School');
        const school = await School.findById(user.school);
        if (school && (school.status === 'inactive' || school.status === 'deleted')) {
          return res.status(403).json({ message: 'Your school subscription is deactivated. Please contact the administrator.' });
        }
      }
      // Log successful login
      await LoggingService.logAuthActivity(req, 'login', 
        `User logged in successfully: ${user.name || user.username}`, 
        { userId: user._id, role: user.role, school: user.school },
        user._id, user.role, user.name || user.username
      );

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
  const { name, firstName, lastName, email, username, contact, experience, status, activities } = req.body;

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
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (name) {
      user.name = name;
      // Ensure required first/last names exist before validation
      if (!firstName || !lastName) {
        const parts = String(name).trim().split(/\s+/);
        if (parts.length >= 2) {
          user.firstName = user.firstName || (parts[0] || 'User');
          user.lastName = user.lastName || (parts.slice(1).join(' ') || 'User');
        } else if (parts.length === 1) {
          user.firstName = user.firstName || (parts[0] || 'User');
          user.lastName = user.lastName || 'User';
        }
      }
    }
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
  if ((user.role === 'staff' || user.role === 'employee' || user.role === 'staff pedagogique') && status) {
      user.staffStatus = status;
    }

    // Ensure required name fields are present before save (legacy safety)
  if (!user.firstName || !user.lastName) {
      const base = name || user.name || (user.email ? String(user.email).split('@')[0] : `User-${user._id}`);
      if (!user.firstName && !user.lastName) {
        const parts = String(base).trim().split(/\s+/);
    user.firstName = parts[0] || 'User';
    user.lastName = parts.slice(1).join(' ') || 'User';
      } else {
    if (!user.firstName) user.firstName = base || 'User';
    if (!user.lastName) user.lastName = 'User';
      }
    }

    // Save the updated user with graceful duplicate error handling
    let updatedUser;
    try {
      updatedUser = await user.save();
    } catch (err) {
      if (err && err.code === 11000 && err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
      throw err;
    }

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
// @desc    Get user breakdown by school and type (admin analytics)
// @route   GET /api/users/analytics/user-breakdown
// @access  Admin
const getUserBreakdownAnalytics = async (req, res) => {
  try {
    // Aggregate users by school and role
    const pipeline = [
      {
        $match: {
          role: { $in: ["student", "teacher", "manager", "employee"] }
        }
      },
      {
        $group: {
          _id: { school: "$school", role: "$role" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.school",
          breakdown: {
            $push: {
              role: "$_id.role",
              count: "$count"
            }
          }
        }
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "school"
        }
      },
      {
        $unwind: "$school"
      },
      {
        $project: {
          school: { _id: "$school._id", name: "$school.name" },
          breakdown: 1
        }
      }
    ];
    const results = await User.aggregate(pipeline);
    // Format breakdown as { student: N, teacher: N, manager: N, employee: N }
    const formatted = results.map(r => ({
      school: r.school,
      breakdown: r.breakdown.reduce((acc, curr) => {
        acc[curr.role] = curr.count;
        return acc;
      }, {})
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserBreakdownAnalytics,
};
