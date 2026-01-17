const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Company = require('../models/Company.model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let account;
    if (decoded.role === 'User') {
      account = await User.findById(decoded.id).select('-password');
    } else if (decoded.role === 'Company') {
      account = await Company.findById(decoded.id).select('-password');
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    req.user = {
      id: account._id,
      type: decoded.role,
      account: account
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
const isAuthor = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      const isAuthorized = 
        resource.author && 
        resource.author.id.equals(req.user.id) && 
        resource.author.type === req.user.type;

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this resource'
        });
      }
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  };
};
const isCompany = (req, res, next) => {
  if (req.user.type !== 'Company') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to companies only'
    });
  }
  next();
};
const isUser = (req, res, next) => {
  if (req.user.type !== 'User') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to users only'
    });
  }
  next();
};

module.exports = {
  authenticate,
  isAuthor,
  isCompany,
  isUser
};