const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
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
      'MESSAGE' 
    ]
  },
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
        'Message' 
      ]
    }
  },

  isRead: { 
    type: Boolean, 
    default: false 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }

});
notificationSchema.index({ 'receiver.id': 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
