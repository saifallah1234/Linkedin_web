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
    select: false 
  },
  description: { 
    type: String, 
    maxlength: 1000 
  },
  website: { type: String },
  logo: { 
    type: String, 
    default: '' 
  },
  
  // --- NEW FIELD: Followers List ---
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);