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
  if (req.user && req.user.role === 'staff') {
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

module.exports = { protect, admin, manager, staff, teacher, authorize };
