const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  
  // --- 1. RECEIVER (Who gets the notification) ---
  receiver: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'receiver.type' // Dynamic Reference
    },
    type: { 
      type: String, 
      required: true, 
      enum: ['User', 'Company'] // Must match your Model names
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
    enum: ['new_post', 'reaction', 'comment', 'reply', 'job_offer' ,'connection_request',
      'connection_accepted',  'company_post','message','job_application']
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
            enum: ['Post', 'Reaction','Comment','Connection', 'JobOffer','JobApplication','message'] 
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