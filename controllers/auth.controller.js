const User = require('../models/User.model');
const Company = require('../models/Company.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken } = require('../utils/googleAuth');

const generateToken = (id, role) => {
  const formattedRole = role.toUpperCase() === 'USER' ? 'User' : 
                       role.toUpperCase() === 'COMPANY' ? 'Company' : role;
  
  return jwt.sign({ id, role: formattedRole }, process.env.JWT_SECRET, { expiresIn: '7d' });
};


exports.signupUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, location, dateOfBirth } = req.body;
    const safeLocation = location || 'Unknown';
    const imagePath = req.file ? req.file.path : ''; 
    if (await User.findOne({ email }) || await Company.findOne({ email })) {
      return res.status(400).json({ message: 'Email in use' });
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      location: safeLocation,
      dateOfBirth,
      image: imagePath,
      isGoogleUser: false
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

exports.signupUserWithGoogle = async (req, res) => {
  try {
    const { googleToken, location, dateOfBirth } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ message: 'Google token required' });
    }
    const googleUser = await verifyGoogleToken(googleToken);
    
    const existingUser = await User.findOne({ email: googleUser.email });
    const existingCompany = await Company.findOne({ email: googleUser.email });
    
    if (existingUser || existingCompany) {
      return res.status(400).json({ 
        message: 'Email already registered. Please use regular login.' 
      });
    }

    const user = await User.create({
      googleId: googleUser.googleId,
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      location: location || 'Unknown',
      dateOfBirth: dateOfBirth || null,
      image: googleUser.picture || '',
      isGoogleUser: true,
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

exports.signupCompany = async (req, res, next) => {
  try {
    const { name, email, password, location, website, description } = req.body;
    
    const logoPath = req.file ? req.file.path : '';

    if (await User.findOne({ email }) || await Company.findOne({ email })) {
      return res.status(400).json({ message: 'Email in use' });
    }
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

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'User account not found' });
    }
    if (user.googleId || user.isGoogleUser) {
      return res.status(400).json({ 
        message: 'This account uses Google authentication. Please sign in with Google.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user._id, 'User');
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

exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await Company.findOne({ email }).select('+password');

    if (!company) {
      return res.status(401).json({ message: 'Company account not found' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(company._id, 'Company');
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
exports.unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    const user = await User.findOne({ email }).select('+password');
    const company = await Company.findOne({ email }).select('+password');
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
      if (!user.googleId && !user.isGoogleUser) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          account = user;
          role = 'User';
          type = 'user';
        }
      }
    }
    if (!account && company) {
      const isMatch = await bcrypt.compare(password, company.password);
      if (isMatch) {
        account = company;
        role = 'Company';
        type = 'company';
      }
    }
    if (!account) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    const token = generateToken(account._id, role);
    let response = {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} login successful`,
      token,
      role,
      accountType: type
    };

    if (type === 'user') {
      const userData = account.toObject();
      delete userData.password;
      response.user = userData;
    } else {
      const companyData = account.toObject();
      delete companyData.password;
      response.company = companyData;
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
exports.unifiedGoogleLogin = async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Google token is required' 
      });
    }
    const googleUser = await verifyGoogleToken(googleToken);
    const existingUser = await User.findOne({ email: googleUser.email });
    const existingCompany = await Company.findOne({ email: googleUser.email });

    let account = null;
    let role = '';
    let type = '';

    if (existingUser) {
      if (!existingUser.googleId && !existingUser.isGoogleUser) {
        return res.status(400).json({ 
          success: false,
          message: 'This email is registered with regular password. Please use password login.' 
        });
      }
      
      account = existingUser;
      role = 'User'; 
      type = 'user';
      
      if (!account.googleId) {
        account.googleId = googleUser.googleId;
        account.isGoogleUser = true;
        await account.save();
      }
      
    } else if (existingCompany) {
      return res.status(400).json({ 
        success: false,
        message: 'This email is registered as a company account. Please use password login.' 
      });
    } else {
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email. Please sign up first.',
        email: googleUser.email,
        canSignup: true
      });
    }
    const token = generateToken(account._id, role);
    let response = {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} Google login successful`,
      token,
      role,
      accountType: type
    };

    if (type === 'user') {
      const userData = account.toObject();
      delete userData.password;
      
      response.user = {
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        image: userData.image || googleUser.picture,
        location: userData.location,
        isGoogleUser: userData.isGoogleUser
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Unified Google login error:', error);
    
    if (error.message === 'Invalid Google token') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid Google token' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message || 'Google login failed' 
    });
  }
};

exports.getCurrentSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ 
        success: true,
        isAuthenticated: false 
      });
    }

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
