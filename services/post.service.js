const Post = require('../models/post.model');
const Reaction = require('../models/reaction.model');
const Comment = require('../models/comment.model');
const Connection = require('../models/Connection.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const notificationService = require('./notification.service');

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
    
    const saved = await post.save();

    // Notify relevant users
    try {
      if (authorType === 'User') {
        // Notify accepted connections
        const connections = await Connection.find({
          status: 'ACCEPTED',
          $or: [ { requesterId: authorId }, { receiverId: authorId } ]
        });

        for (const conn of connections) {
          const otherId = conn.requesterId.toString() === authorId.toString() ? conn.receiverId : conn.requesterId;
          await notificationService.createNotification(
            { id: otherId, type: 'User' },
            { id: authorId, type: 'User' },
            'new_post',
            { id: saved._id, type: 'Post' }
          );
        }
      } else if (authorType === 'Company') {
        // Notify followers (users who have this company in followingCompanies)
        const followers = await User.find({ 'followingCompanies.companyId': authorId }).select('_id');
        for (const f of followers) {
          await notificationService.createNotification(
            { id: f._id, type: 'User' },
            { id: authorId, type: 'Company' },
            'company_post',
            { id: saved._id, type: 'Post' }
          );
        }
      }
    } catch (err) {
      console.error('Error creating post notifications:', err);
    }

    return saved;
  }

  // Get post by ID with author details
  static async getPostById(postId, currentUserId = null) {
    const post = await Post.findById(postId);

    if (!post) return null;

    // Populate author based on type
    let authorData = null;
    if (post.author.type === 'User') {
      authorData = await User.findById(post.author.id).select('firstName lastName image email');
    } else if (post.author.type === 'Company') {
      authorData = await Company.findById(post.author.id).select('name logo email');
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
  try {
    const skip = (page - 1) * limit;
    
    console.log('DEBUG - Getting feed for user:', userId);

    // Get user's ACCEPTED connections
    const connections = await Connection.find({
      status: 'ACCEPTED',
      $or: [
        { requesterId: userId },
        { receiverId: userId }
      ]
    });

    console.log('DEBUG - Found connections:', connections.length);

    // Extract connected user IDs
    const connectedUserIds = connections.map(conn => {
      const requesterIdStr = conn.requesterId.toString();
      const receiverIdStr = conn.receiverId.toString();
      const userIdStr = userId.toString();
      
      if (requesterIdStr === userIdStr) {
        return conn.receiverId;
      } else {
        return conn.requesterId;
      }
    });

    console.log('DEBUG - Connected user IDs:', connectedUserIds.map(id => id.toString()));

    // Get user WITH followingCompanies (array of objects)
    const user = await User.findById(userId).select('followingCompanies');
    
    // Extract just the company IDs from the followingCompanies array
    const followedCompanyIds = user?.followingCompanies?.map(item => item.companyId) || [];
    
    console.log('DEBUG - Following companies:', user?.followingCompanies);
    console.log('DEBUG - Followed company IDs:', followedCompanyIds.map(id => id.toString()));

    // Include the user's own ID to see their own posts in the feed
    const allAuthorIds = [
      userId,
      ...connectedUserIds
    ];

    console.log('DEBUG - All author IDs to fetch:', allAuthorIds.map(id => id.toString()));

    // Build query - handle empty arrays properly
    const queryConditions = [
      { 'author.id': userId, 'author.type': 'User' } // Always include own posts
    ];

    // Add connected users condition if there are any
    if (connectedUserIds.length > 0) {
      queryConditions.push({ 
        'author.id': { $in: connectedUserIds }, 
        'author.type': 'User' 
      });
    }

    // Add followed companies condition if there are any
    // NOTE: Now using followedCompanyIds instead of followedCompanies
    if (followedCompanyIds.length > 0) {
      queryConditions.push({ 
        'author.id': { $in: followedCompanyIds }, 
        'author.type': 'Company' 
      });
    }

    const postsQuery = queryConditions.length > 0 ? { $or: queryConditions } : {};

    console.log('DEBUG - Posts query:', JSON.stringify(postsQuery, null, 2));

    // If no query conditions (no connections, no followed companies), return empty
    if (Object.keys(postsQuery).length === 0) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }

    // Fetch posts
    const posts = await Post.find(postsQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('DEBUG - Found posts:', posts.length);

    // Get total count for pagination
    const total = await Post.countDocuments(postsQuery);

    // Populate author details and reactions for each post
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        try {
          let authorData = null;
          
          // Populate author based on type
          if (post.author.type === 'User') {
            authorData = await User.findById(post.author.id)
              .select('firstName lastName image logo')
              .lean();
          } else if (post.author.type === 'Company') {
            authorData = await Company.findById(post.author.id)
              .select('name image  logo')
              .lean();
          }
          
          // Get user's reaction to this post
          const userReaction = await Reaction.findOne({
            'target.id': post._id,
            'target.type': 'Post',
            userId: userId
          }).lean();
          
          return {
            ...post,
            author: {
              ...post.author,
              details: authorData
            },
            userReaction: userReaction || null
          };
        } catch (error) {
          console.error('Error processing post:', post._id, error);
          return {
            ...post,
            author: {
              ...post.author,
              details: null
            },
            userReaction: null
          };
        }
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
  } catch (error) {
    console.error('Error in getUserFeed:', error);
    throw error;
  }
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
    const authorData = await Model.findById(authorId).select('firstName lastName name image ');

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
          authorData = await User.findById(post.author.id).select('firstName lastName logo');
        } else if (post.author.type === 'Company') {
          authorData = await Company.findById(post.author.id).select('name logo');
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