const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  location: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true, 
    select: false // Hides password by default when querying
  },
  description: { 
    type: String, 
    maxlength: 1000 
  },
  website: {type: String},
  logo: { 
    type: String, 
    default: '' // URL to the logo image
  },
  createdAt: { type: Date, default: Date.now }
}); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Company', companySchema);