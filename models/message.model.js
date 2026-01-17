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
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderType: { type: String, enum: ['User', 'Company'], required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverType: { type: String, enum: ['User', 'Company'], required: true },
  content: { 
    type: String, 
    default: "",
    trim: true 
  },
  attachments: [attachmentSchema],
  
  isRead: { 
    type: Boolean, 
    default: false 
  },

  createdAt: { type: Date, default: Date.now }
});
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);