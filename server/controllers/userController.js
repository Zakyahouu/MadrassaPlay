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

// @desc    Bootstrap the first admin (only if no admin exists)
// @route   POST /api/users/bootstrap-admin
// @access  Public (dev) / Key-gated (optional via ADMIN_BOOTSTRAP_KEY)
const bootstrapAdmin = async (req, res) => {
  try {
    // Optional hard gate: if ADMIN_BOOTSTRAP_KEY is set, it must match.
    // If not set, we only allow bootstrapping outside production.
    const bootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY;
    const providedKey = req.headers['x-admin-bootstrap-key'] || req.body?.bootstrapKey;

    if (bootstrapKey) {
      if (!providedKey || String(providedKey) !== String(bootstrapKey)) {
        return res.status(403).json({ message: 'Invalid bootstrap key.' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Avoid leaving an open public bootstrap endpoint in production.
      return res.status(404).json({ message: 'Not found.' });
    }

    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) {
      return res.status(409).json({ message: 'Admin already exists.' });
    }

    const { firstName, lastName, email, password, username } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'firstName, lastName, email and password are required.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password (User model also hashes, but we keep consistent behavior with registerUser)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin',
      username: username ? String(username).trim() : undefined,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      school: user.school,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// 3. DEFINE THE CONTROLLER FUNCTIONS
// ==============================================================================

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, role, school, address, phone1, phone2 } = req.body;

    console.log('Manager registration request:', {
      name, firstName, lastName, email,
      password: password ? '[PROVIDED]' : '[MISSING]',
      role, school, address, phone1, phone2
    });

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

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    let effectiveRole = role;

    if (isAdmin) {
      if (effectiveRole !== 'manager') {
        return res.status(403).json({ message: 'Admins can only create manager accounts.' });
      }
    } else if (isManager) {
      const allowedRoles = new Set(['teacher', 'student', 'staff', 'employee', 'staff pedagogique']);
      if (!effectiveRole || !allowedRoles.has(effectiveRole)) {
        return res.status(403).json({ message: 'Managers can only create teacher, student, or staff accounts.' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to create accounts.' });
    }

    // Create the user with the HASHED password
    const userData = {
      email,
      password: hashedPassword, // Store the hashed password
      role: effectiveRole,
    };

    // Handle name fields - support both formats
    if (firstName && lastName) {
      userData.firstName = firstName;
      userData.lastName = lastName;
    } else if (name) {
      userData.name = name;
    }

    // Assign school based on creator role
    if (isAdmin) {
      if (!school) {
        return res.status(400).json({ message: 'School is required when creating a manager.' });
      }
      userData.school = school;
    }

    if (isManager) {
      if (!req.user.school) {
        return res.status(403).json({ message: 'Manager is not assigned to a school.' });
      }
      userData.school = req.user.school;
    }

    // Add additional fields for managers - Map to contact object
    if (address || phone1 || phone2) {
      userData.contact = {};
      if (address) userData.contact.address = address;
      if (phone1) userData.contact.phone1 = phone1;
      if (phone2) userData.contact.phone2 = phone2;
    }

    console.log('Creating user with data:', userData);
    const user = await User.create(userData);
    console.log('User created successfully:', user);

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
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        xp: user.xp,
        level: user.level,
        totalPoints: user.totalPoints,
        token: generateToken(user._id), // Generate and include the token
      };

      // Include additional fields for managers
      if (user.role === 'manager') {
        userResponse.firstName = user.firstName;
        userResponse.lastName = user.lastName;
        userResponse.address = user.address;
        userResponse.phone1 = user.phone1;
        userResponse.phone2 = user.phone2;
        userResponse.contact = user.contact;
        // Include the original password for the credentials popup
        userResponse.password = password;
      }

      res.status(201).json(userResponse);
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
        if (school && school.status === 'trial' && school.trialExpiresAt) {
          const expiresAt = new Date(school.trialExpiresAt);
          if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
            return res.status(403).json({ message: 'Your school trial has expired. Please contact the administrator.' });
          }
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
    const { name, firstName, lastName, email, username, password, contact, experience, status, activities } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);

    // Enforce role-based restrictions
    const RESTRICTED_ROLES = ['teacher', 'student'];
    if (RESTRICTED_ROLES.includes(user.role)) {
      // Only allow username and password
      // Reset other fields to null/undefined so they are ignored by update logic below
      // Or explicitly prevent them from being used
      if (req.body.name) delete req.body.name;
      if (req.body.firstName) delete req.body.firstName;
      if (req.body.lastName) delete req.body.lastName;
      if (req.body.email) delete req.body.email;
      if (req.body.contact) delete req.body.contact;
      if (req.body.experience) delete req.body.experience;
      if (req.body.status) delete req.body.status;
      if (req.body.activities) delete req.body.activities;

      // Locally update variables to reflect deletion (since destructuring happened earlier)
      // Actually, destructured vars are const/let in function scope, so we can't 'delete' them from scope.
      // We must rely on 'user' object updates below.
      // We should overwrite the destructured variables or change how we use them.
      // Better approach: Re-read explicitly or use conditional logic below.
    }

    // Re-assign destructured variables if they were restricted (to safe defaults or null)
    // Since we can't reassign const, let's just use conditional logic in the update blocks.
    const isRestricted = RESTRICTED_ROLES.includes(user.role);

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
    if (firstName && !isRestricted) user.firstName = firstName;
    if (lastName && !isRestricted) user.lastName = lastName;
    if (name && !isRestricted) {
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
    // Only update email if not restricted
    if (!isRestricted) {
      user.email = email || user.email;
    }

    if (username) user.username = username;
    if (password) user.password = password; // pre-save hook will hash this

    if (contact && !isRestricted) {
      user.contact = {
        phone1: contact.phone1 ?? user.contact?.phone1,
        phone2: contact.phone2 ?? user.contact?.phone2,
        address: contact.address ?? user.contact?.address,
      };
    }

    // Update teacher-specific fields if user is a teacher
    if (user.role === 'teacher' && !isRestricted) {
      // NOTE: Even though teachers are restricted generally, if we want to allow them to update specific things we could exception here.
      // But user said "allow them ONLY to change username and password". So we block this too.
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
  bootstrapAdmin,
  getUserBreakdownAnalytics,
};
