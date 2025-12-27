const Post = require('../models/post.model');
const Reaction = require('../models/reaction.model');
const Comment = require('../models/comment.model');
const Connection = require('../models/Connection.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');

class PostService {
  // Create a new post
  static async createPost(authorId, authorType, content, media = []) {
    const post = new Post({
      author: {
        id: authorId,
        type: authorType
      },
      content,
      media: media.map(file => ({
        url: file.path || `/uploads/${file.filename}`,
        type: file.mediaType || 'image'
      }))
    });
    
    return await post.save();
  }

  // Get post by ID with author details
  static async getPostById(postId, currentUserId = null) {
    const post = await Post.findById(postId);

    if (!post) return null;

    // Populate author based on type
    let authorData = null;
    if (post.author.type === 'User') {
      authorData = await User.findById(post.author.id).select('firstName lastName avatar logo email');
    } else if (post.author.type === 'Company') {
      authorData = await Company.findById(post.author.id).select('name avatar logo email');
    }

    const postObj = post.toObject();
    postObj.author.details = authorData;

    // Add user's reaction if logged in
    if (currentUserId) {
      const userReaction = await Reaction.findOne({
        'target.id': post._id,
        'target.type': 'Post',
        userId: currentUserId
      });
      postObj.userReaction = userReaction || null;
    }

    return postObj;
  }

  // Update post
  static async updatePost(postId, authorId, authorType, updates) {
    const post = await Post.findOne({
      _id: postId,
      'author.id': authorId,
      'author.type': authorType
    });

    if (!post) return null;

    if (updates.content !== undefined) post.content = updates.content;
    if (updates.media !== undefined) post.media = updates.media;

    return await post.save();
  }

  // Delete post
  static async deletePost(postId, authorId, authorType) {
    const post = await Post.findOne({
      _id: postId,
      'author.id': authorId,
      'author.type': authorType
    });

    if (!post) return null;

    await Post.findByIdAndDelete(postId);
    
    // Also delete all comments on this post
    await Comment.deleteMany({ postId: postId });
    
    // Delete all reactions to this post
    await Reaction.deleteMany({ 'target.id': postId, 'target.type': 'Post' });

    return post;
  }

  // Get user's feed (connections + followed companies)
  static async getUserFeed(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Get user's connections
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const connectedUserIds = connections.map(conn => 
      conn.requester.equals(userId) ? conn.recipient : conn.requester
    );

    // Get followed companies
    const user = await User.findById(userId);
    const followedCompanies = user.followedCompanies || [];

    // Build query for posts from connections and followed companies
    const posts = await Post.find({
      $or: [
        { 'author.id': { $in: connectedUserIds }, 'author.type': 'User' },
        { 'author.id': { $in: followedCompanies }, 'author.type': 'Company' }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Post.countDocuments({
      $or: [
        { 'author.id': { $in: connectedUserIds }, 'author.type': 'User' },
        { 'author.id': { $in: followedCompanies }, 'author.type': 'Company' }
      ]
    });

    // Populate author details and reactions for each post
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        let authorData = null;
        if (post.author.type === 'User') {
          authorData = await User.findById(post.author.id).select('firstName lastName avatar logo');
        } else if (post.author.type === 'Company') {
          authorData = await Company.findById(post.author.id).select('name avatar logo');
        }
        
        const userReaction = await Reaction.findOne({
          'target.id': post._id,
          'target.type': 'Post',
          userId: userId
        });
        
        const postObj = post.toObject();
        postObj.author.details = authorData;
        postObj.userReaction = userReaction || null;
        return postObj;
      })
    );

    return {
      posts: postsWithReactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get posts by author
  static async getPostsByAuthor(authorId, authorType, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      'author.id': authorId,
      'author.type': authorType
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      'author.id': authorId,
      'author.type': authorType
    });

    // Populate author details
    const Model = authorType === 'User' ? User : Company;
    const authorData = await Model.findById(authorId).select('firstName lastName name avatar logo');

    const postsWithAuthor = posts.map(post => {
      const postObj = post.toObject();
      postObj.author.details = authorData;
      return postObj;
    });

    return {
      posts: postsWithAuthor,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Search posts
  static async searchPosts(query, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      content: { $regex: query, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      content: { $regex: query, $options: 'i' }
    });

    // Populate author details for each post
    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        let authorData = null;
        if (post.author.type === 'User') {
          authorData = await User.findById(post.author.id).select('firstName lastName avatar logo');
        } else if (post.author.type === 'Company') {
          authorData = await Company.findById(post.author.id).select('name avatar logo');
        }
        const postObj = post.toObject();
        postObj.author.details = authorData;
        return postObj;
      })
    );

    return {
      posts: postsWithAuthor,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = PostService;