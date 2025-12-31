// This file contains the new unified login endpoint
// Add this to auth.controller.js at the end of the file

const User = require('../models/User.model');
const Company = require('../models/Company.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- Unified Login (Auto-detects user type and populates session) ---
exports.loginUnified = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First try to find as a User
    let user = await User.findOne({ email }).select('+password');
    let userType = 'User';
    let userData = null;

    if (user) {
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Get full user data for session
      userData = await User.findById(user._id)
        .select('-password')
        .populate('followingCompanies.companyId', 'name logo location');
      
    } else {
      // Try to find as a Company
      let company = await Company.findOne({ email }).select('+password');
      
      if (!company) {
        return res.status(401).json({ message: 'Account not found' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, company.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      userType = 'Company';
      
      // Get full company data for session
      userData = await Company.findById(company._id)
        .select('-password')
        .populate('followers', 'firstName lastName image headline');
    }

    // Generate Token with the detected role
    const token = generateToken(userData._id, userType);

    res.json({
      message: `${userType} login successful`,
      token,
      role: userType,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
