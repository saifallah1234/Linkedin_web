const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  // --- POLYMORPHIC TARGET (What is being liked?) ---
  target: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'target.type' // Dynamic reference
    },
    type: { 
      type: String, 
      required: true, 
      // Mongoose Note: These must match your Model names exactly for populate() to work
      // e.g. 'Post', 'Comment', 'Message' (Capitalized)
      enum: ['Post', 'Comment', 'Message'] 
    }
  },

  // --- WHO REACTED? ---
  // (Assuming only Users react. If Companies can react, use the "author" pattern from Post.js)
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

  // --- Manual Timestamp ---
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// --- CRITICAL RULE: One Reaction Per User Per Target ---
// This prevents a user from liking the same post 50 times.
// If they click "like" again, your frontend should send a DELETE request, not a second create.
reactionSchema.index({ 'target.id': 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);