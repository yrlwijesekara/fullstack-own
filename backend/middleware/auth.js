const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Protect routes - verify authentication
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in:
  // 1. Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Cookies (httpOnly cookie)
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

/**
 * @desc    Check if user is admin
 * @note    Must be used after protect middleware
 */
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during authorization check' });
  }
};
