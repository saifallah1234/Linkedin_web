const User = require('../models/User.model');
const Company = require('../models/Company.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  // Ensure role is properly capitalized for your middleware
  const formattedRole = role.toUpperCase() === 'USER' ? 'User' : 
                       role.toUpperCase() === 'COMPANY' ? 'Company' : role;
  
  return jwt.sign({ id, role: formattedRole }, process.env.JWT_SECRET, { expiresIn: '7d' });
};


// --- 1. User Signup ---
exports.signupUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, location, dateOfBirth } = req.body;
    // Ensure model-required fields have fallbacks when frontend omits them
    const safeLocation = location || 'Unknown';
    
    // Check if file was uploaded
    const imagePath = req.file ? req.file.path : ''; 

    // Check duplicates
    if (await User.findOne({ email }) || await Company.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Let the User model handle password hashing in its pre-save middleware
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      location: safeLocation,
      dateOfBirth,
      image: imagePath,
      isGoogleUser: false // Explicitly mark as non-Google user
    });

    const token = generateToken(user._id, 'USER');

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// --- 2. Company Signup ---
exports.signupCompany = async (req, res) => {
  try {
    const { name, email, password, location, website, description } = req.body;
    
    // Check if file was uploaded
    const logoPath = req.file ? req.file.path : '';

    if (await User.findOne({ email }) || await Company.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Let the Company model handle password hashing in its pre-save middleware
    const company = await Company.create({
      name,
      email,
      password,
      location,
      website,
      description,
      logo: logoPath
    });

    const token = generateToken(company._id, 'COMPANY');

    res.status(201).json({
      message: "Company registered successfully",
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        logo: company.logo,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. User Login (UPDATED FOR GOOGLE USERS) ---
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Only search in USER collection
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'User account not found' });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate User Token
    const token = generateToken(user._id, 'User');

    // Clean response
    const userData = user.toObject();
    delete userData.password;

    res.json({
      message: "User login successful",
      token,
      role: 'User',
      user: {
        _id: user._id,
        accountType: 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 4. Company Login ---
exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Only search in COMPANY collection
    const company = await Company.findOne({ email }).select('+password');

    if (!company) {
      return res.status(401).json({ message: 'Company account not found' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate Company Token
    const token = generateToken(company._id, 'Company');

    // Clean response
    const companyData = company.toObject();
    delete companyData.password;

    res.json({
      message: "Company login successful",
      token,
      role: 'Company',
      accountType: 'company',
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        logo: company.logo,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Search in both collections
    const user = await User.findOne({ email }).select('+password');
    const company = await Company.findOne({ email }).select('+password');

    // Check if account exists
    if (!user && !company) {
      return res.status(401).json({ 
        success: false,
        message: 'Account not found' 
      });
    }

    let account = null;
    let role = '';
    let type = '';

    if (user) {
      // Check if this is a Google user trying to use password login
      if (user.googleId || user.isGoogleUser) {
        return res.status(400).json({ 
          success: false,
          message: 'This account uses Google authentication. Please sign in with Google.' 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }
      
      account = user;
      role = 'User'; // Must be 'User' (capitalized) for your middleware
      type = 'user';
    } else if (company) {
      const isMatch = await bcrypt.compare(password, company.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }
      
      account = company;
      role = 'Company'; // Must be 'Company' (capitalized) for your middleware
      type = 'company';
    }

    // Generate token - use the corrected role format
    const token = generateToken(account._id, role);

    // Prepare response based on account type
    let response = {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} login successful`,
      token,
      role,
      accountType: type
    };

    if (type === 'user') {
      // Clean user response
      const userData = account.toObject();
      delete userData.password;
      
      response.user = {
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        image: userData.image,
        location: userData.location,
        isGoogleUser: userData.isGoogleUser
      };
    } else if (type === 'company') {
      // Clean company response
      const companyData = account.toObject();
      delete companyData.password;
      
      response.company = {
        _id: companyData._id,
        name: companyData.name,
        email: companyData.email,
        logo: companyData.logo,
        location: companyData.location,
        website: companyData.website,
        description: companyData.description
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Unified login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Login failed' 
    });
  }
};


// --- Get Current Session Info (Compatible with your middleware) ---
exports.getCurrentSession = async (req, res) => {
  try {
    // Use your authenticate middleware first, then this controller
    if (!req.user) {
      return res.json({ 
        success: true,
        isAuthenticated: false 
      });
    }

    // If we get here, authenticate middleware has already verified the token
    const { type, account } = req.user;
    
    let response = {
      success: true,
      isAuthenticated: true,
      role: type,
      accountType: type === 'User' ? 'user' : 'company'
    };

    if (type === 'User') {
      response.user = {
        _id: account._id,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        image: account.image,
        location: account.location,
        isGoogleUser: account.isGoogleUser
      };
    } else if (type === 'Company') {
      response.company = {
        _id: account._id,
        name: account.name,
        email: account.email,
        logo: account.logo,
        location: account.location,
        website: account.website,
        description: account.description
      };
    }

    res.json(response);
    
  } catch (error) {
    console.error('Get session error:', error);
    res.json({ 
      success: true,
      isAuthenticated: false 
    });
  }
};