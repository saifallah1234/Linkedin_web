const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['image', 'video', 'file', 'link'], 
    required: true 
  },
  url: { type: String, required: true }
});

const messageSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    trim: true 
  },
  attachments: [attachmentSchema],
  
  isRead: { 
    type: Boolean, 
    default: false 
  },

  // --- Manual Timestamp ---
  createdAt: { type: Date, default: Date.now }
});

// --- Performance Index ---
// Speeds up fetching the chat history between two specific users
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);