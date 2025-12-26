const User = require('../models/User.model');
const Company = require('../models/Company.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
      image: imagePath // Saving the path: "uploads/images/image-123.jpg"
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      location,
      website,
      description,
      logo: logoPath // Saving the path
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
      role: 'User'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. Company Login (Strict) ---
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
      role: 'Company'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};