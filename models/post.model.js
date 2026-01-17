const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video', 'pdf'], required: true },
  url: { type: String, required: true }
});

const postSchema = new mongoose.Schema({
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'author.type' },
    type: { type: String, required: true, enum: ['User', 'Company'], default: 'User' }
  },
  content: { type: String, trim: true },
  media: [mediaSchema],
  likesCount: { 
    type: Number, 
    default: 0 
  },
  commentsCount: { 
    type: Number, 
    default: 0 
  },

  createdAt: { type: Date, default: Date.now }
});

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);