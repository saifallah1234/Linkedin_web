const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true 
  },

  // --- POLYMORPHIC AUTHOR ---
  author: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      refPath: 'author.type' 
    },
    type: { 
      type: String, 
      required: true, 
      enum: ['User', 'Company'],
      default: 'User'
    }
  },

  // --- THREADING (Replies) ---
  // If null, it's a main comment. If set, it's a reply to another comment.
  parentCommentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null 
  },

  content: { 
    type: String, 
    required: true, 
    trim: true 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index 1: Quickly load all comments for a specific post
commentSchema.index({ postId: 1, createdAt: 1 });

// Index 2: Quickly load replies for a specific comment
commentSchema.index({ parentCommentId: 1 });

module.exports = mongoose.model('Comment', commentSchema);