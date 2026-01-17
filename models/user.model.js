const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Add bcrypt import

// --- 1. Sub-Schemas (Embedded Objects) ---

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String },
  technologies: [{ type: String }],
  description: { type: String },
  startDate: { type: Date },     
  endDate: { type: Date }        
});
const educationSchema = new mongoose.Schema({
  school: { type: String, required: true }, // e.g., "Harvard University"
  degree: { type: String, required: true }, // e.g., "Bachelor's"
  fieldOfStudy: { type: String, required: false }, // e.g., "Computer Science"
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // null = Present (still studying)
  grade: { type: String }, // e.g., "GPA 3.8"
  description: { type: String }
});

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // null = Current
  description: { type: String }
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  obtainedAt: { type: Date, default: Date.now }
});

const followingCompanySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  followedAt: { type: Date, default: Date.now }
});


const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: function() {
      return !this.googleId;
    }, 
    select: false 
  },
  dateOfBirth: { type: Date },
  image: { type: String, default: '' }, 
  location: { type: String, required: true, trim: true },
  googleId: {
    type: String,
    unique: true,
    sparse: true 
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  followingCompanies: [followingCompanySchema],
  education: [educationSchema],
  projects: [projectSchema],
  experiences: [experienceSchema],
  skills: [skillSchema],
  certificates: [certificateSchema],
  createdAt: { type: Date, default: Date.now }
});
userSchema.pre('save', async function() {
  if (this.isModified('password') && this.password && !this.googleId) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

module.exports = mongoose.model('User', userSchema);