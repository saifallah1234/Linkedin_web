const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  target: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'target.type'
    },
    type: { 
      type: String, 
      required: true, 
      enum: ['Post', 'Comment', 'Message'] 
    }
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  reactionType: { 
    type: String, 
    enum: ['like', 'love', 'dislike', 'encourage', 'haha'], 
    required: true 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});
reactionSchema.index({ 'target.id': 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);