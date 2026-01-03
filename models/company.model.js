const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Make sure to import bcryptjs

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
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: { type: Date, default: Date.now }
});


// Encrypt password before saving
companySchema.pre('save', async function() {
  // 1. If password is not modified, return immediately
  if (!this.isModified('password')) return;

  // 2. Hash the password
  // (No try/catch needed here; if it fails, Mongoose catches the promise rejection automatically)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Company', companySchema);