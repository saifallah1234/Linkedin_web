const mongoose = require('mongoose');
const applicantSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  resumeUrl: { 
    type: String, 
    required: true 
  },
  additionalAttachment: {
    path: {
        type: String
    },
     type: {
        type: String,
        enum: ['video', 'document', 'image']
    }
  },

  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  score: { 
    type: Number, 
    default: 0 
  },
  appliedAt: { 
    type: Date, 
    default: Date.now 
  }
});
const jobOfferSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['full-time', 'part-time', 'internship', 'freelance', 'contract'], 
    required: true 
  },
  duration: { type: String },
  location: { type: String, required: true },
  salaryRange: { type: String, required: true },
  startDate: { type: Date },
  deadline: { type: Date },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  applicants: [applicantSchema],

  
},{ timestamps: true });

jobOfferSchema.index({ location: 1, type: 1 });

module.exports = mongoose.models.JobOffer || mongoose.model('JobOffer', jobOfferSchema);