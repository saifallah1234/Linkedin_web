const User = require('../models/User.model');
const Company = require('../models/Company.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken } = require('../utils/googleAuth'); // ADD THIS IMPORT

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- 1. User Signup ---
exports.signupUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, location, dateOfBirth } = req.body;
    
    // Check if file was uploaded
    const imagePath = req.file ? req.file.path : ''; 

    // Check duplicates
    if (await User.findOne({ email }) || await Company.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      location,
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

// --- NEW: Google Signup for Users ---
exports.signupUserWithGoogle = async (req, res) => {
  try {
    const { googleToken, location, dateOfBirth } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify Google token and get user info
    const googleUser = await verifyGoogleToken(googleToken);
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: googleUser.email });
    const existingCompany = await Company.findOne({ email: googleUser.email });
    
    if (existingUser || existingCompany) {
      return res.status(400).json({ 
        message: 'Email already registered. Please use regular login.' 
      });
    }

    // Create user with Google data
    const user = await User.create({
      googleId: googleUser.googleId,
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      location: location || 'Unknown',
      dateOfBirth: dateOfBirth || null,
      image: googleUser.picture || '',
      isGoogleUser: true,
      // No password for Google users
      password: undefined
    });

    const token = generateToken(user._id, 'USER');

    res.status(201).json({
      message: "User registered successfully with Google",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        location: user.location,
        isGoogleUser: user.isGoogleUser
      }
    });

  } catch (error) {
    console.error('Google signup error:', error);
    
    if (error.message === 'Invalid Google token') {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    res.status(500).json({ 
      message: error.message || 'Google signup failed' 
    });
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
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

    // Check if this is a Google user trying to use password login
    if (user.googleId || user.isGoogleUser) {
      return res.status(400).json({ 
        message: 'This account uses Google authentication. Please sign in with Google.' 
      });
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

// --- NEW: Check Google Signup Availability ---
exports.checkGoogleSignupAvailability = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    const existingCompany = await Company.findOne({ email });

    if (existingUser || existingCompany) {
      return res.json({
        canUseGoogle: false,
        message: 'Email already registered. Please use regular login.'
      });
    }

    res.json({
      canUseGoogle: true,
      message: 'Email available for Google signup'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};