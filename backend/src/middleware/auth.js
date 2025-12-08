const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Get token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Authorize by user type
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is therapist
exports.isTherapist = (req, res, next) => {
  if (req.user.userType !== 'therapist') {
    return res.status(403).json({
      success: false,
      error: 'Only therapists can access this route'
    });
  }
  next();
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can access this route'
    });
  }
  next();
};

// Optional authentication (useful for public routes)
exports.optionalAuth = async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Get token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};