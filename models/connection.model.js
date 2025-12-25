const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  requesterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'], 
    default: 'PENDING' 
  },
  
  // --- Manual Timestamps ---
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date } // This stays null until the user Accepts/Rejects

});

// --- CRITICAL INDEX ---
// This ensures User A can only send ONE request to User B.
// Without this, your database could get cluttered with duplicate spam requests.
connectionSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);