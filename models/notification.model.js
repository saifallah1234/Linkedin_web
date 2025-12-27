const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  
  // --- 1. RECEIVER (Who gets the notification) ---
  receiver: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'receiver.type'
    },
    type: { 
      type: String, 
      required: true, 
      enum: ['User', 'Company']
    }
  },

  // --- 2. SENDER (Who triggered it) ---
  sender: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'sender.type' 
    },
    type: { 
      type: String, 
      required: true, 
      enum: ['User', 'Company'] 
    }
  },

  // --- 3. NOTIFICATION DETAILS ---
  type: {
    type: String,
    required: true,
    enum: [
      'new_post',
      'reaction',
      'comment',
      'reply',
      'job_offer',
      'connection_request',
      'connection_accepted',
      'job_application',
      'company_post',
      'MESSAGE' // ← ADD THIS
    ]
  },
  
  // --- 4. RELATED ENTITY (What is this about?) ---
  entity: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'entity.type' 
    },
    type: { 
      type: String, 
      required: true,
      enum: [
        'Post',
        'Reaction',
        'Comment',
        'JobOffer',
        'Connection',
        'JobApplication',
        'Message' // ← ADD THIS (capital M to match your Message model)
      ]
    }
  },

  isRead: { 
    type: Boolean, 
    default: false 
  },

  // --- Manual Timestamp ---
  createdAt: { 
    type: Date, 
    default: Date.now 
  }

});

// Index to quickly fetch a user's notifications (sorted by newest)
notificationSchema.index({ 'receiver.id': 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);