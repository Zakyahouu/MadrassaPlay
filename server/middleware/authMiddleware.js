// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer eyJhbGci...")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database using the id from the token
      // and attach it to the request object so our controllers can access it
      req.user = await User.findById(decoded.id).select('-password').populate('school');

      if (req.user?.school) {
        const school = req.user.school;
        if (school.status === 'inactive' || school.status === 'deleted') {
          return res.status(403).json({ message: 'Your school subscription is deactivated. Please contact the administrator.' });
        }
        if (school.status === 'trial' && school.trialExpiresAt) {
          const expiresAt = new Date(school.trialExpiresAt);
          if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
            return res.status(403).json({ message: 'Your school trial has expired. Please contact the administrator.' });
          }
        }
      }

      next(); // Move on to the next piece of middleware or the controller
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('school');
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return next();
};

// Middleware to check for a specific role
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Middleware to check for manager role
const manager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a manager' });
  }
};

// Middleware to check for staff role
const staff = (req, res, next) => {
  if (req.user && ['staff', 'employee', 'staff pedagogique'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as staff' });
  }
};

// Middleware to check for teacher role
const teacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a teacher' });
  }
};

// Middleware factory to authorize any of the specified roles
const authorize = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    return next();
  }
  res.status(403).json({ message: `Not authorized. Requires one of roles: ${roles.join(', ')}` });
};

// Middleware to check for specific staff permissions
// If user is manager, they interpret as having all permissions
const checkPermission = (permission) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  // Managers have all permissions
  if (req.user.role === 'manager') {
    return next();
  }

  // Staff need specific permission check
  if (['staff', 'employee', 'staff pedagogique'].includes(req.user.role)) {
    try {
      // Find the employee record associated with this user
      // We need to look up the Employee model to get permissions
      // Since we can't easily circular depend on Employee model here (it might use User), 
      // we'll require it inside the function
      const Employee = require('../models/Employee');

      const employee = await Employee.findOne({
        userId: req.user._id,
        schoolId: req.user.school
      });

      if (employee && employee.permissions && employee.permissions[permission]) {
        return next();
      }

      return res.status(403).json({
        message: `Not authorized. Requires '${permission}' permission.`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Server error during permission check' });
    }
  }

  // Other roles don't have these permissions
  res.status(403).json({ message: 'Not authorized.' });
};

module.exports = { protect, optionalProtect, admin, manager, staff, teacher, authorize, checkPermission };
