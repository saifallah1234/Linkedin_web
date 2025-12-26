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
    enum: ['new_post', 'reaction', 'comment', 'reply', 'job_offer' , 'message']
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
      // Note: These must match your actual Mongoose Model names to work with populate()
      // If your model is 'JobOffer', this string must be 'JobOffer'
      enum: ['Post', 'Comment', 'JobOffer'] 
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