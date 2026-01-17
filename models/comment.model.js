const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true 
  },

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
commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ parentCommentId: 1 });

module.exports = mongoose.model('Comment', commentSchema);