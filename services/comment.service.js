const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const Reaction = require('../models/reaction.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const notificationService = require('./notification.service');

class CommentService {
  // Create a comment
  static async createComment(postId, authorId, authorType, content, parentCommentId = null) {
    const comment = new Comment({
      postId,
      author: {
        id: authorId,
        type: authorType
      },
      content,
      parentCommentId
    });

    const savedComment = await comment.save();

    // Increment comment count on post
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // If it's a reply, increment replies count on parent comment
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } });
    }

    // Notifications:
    try {
      // Notify post author when someone comments (top-level comment)
      const post = await Post.findById(postId).select('author');
      if (post) {
        const postAuthorId = post.author.id;
        const postAuthorType = post.author.type;
        // If commenter is not the post author, notify
        if (postAuthorId.toString() !== authorId.toString()) {
          await notificationService.createNotification(
            { id: postAuthorId, type: postAuthorType },
            { id: authorId, type: authorType },
            parentCommentId ? 'reply' : 'comment',
            { id: parentCommentId || postId, type: parentCommentId ? 'Comment' : 'Post' }
          );
        }
      }

      // If it's a reply, also notify the parent comment author (if different)
      if (parentCommentId) {
        const parent = await Comment.findById(parentCommentId).select('author');
        if (parent && parent.author.id.toString() !== authorId.toString()) {
          await notificationService.createNotification(
            { id: parent.author.id, type: parent.author.type },
            { id: authorId, type: authorType },
            'reply',
            { id: savedComment._id, type: 'Comment' }
          );
        }
      }
    } catch (err) {
      console.error('Error creating comment notifications:', err);
    }

    return await this.getCommentWithAuthor(savedComment._id);
  }

  // Get comment with author details
  static async getCommentWithAuthor(commentId, currentUserId = null) {
    const comment = await Comment.findById(commentId);

    if (!comment) return null;

    // Populate author
    let authorData = null;
    if (comment.author.type === 'User') {
      authorData = await User.findById(comment.author.id).select('firstName lastName avatar logo');
    } else if (comment.author.type === 'Company') {
      authorData = await Company.findById(comment.author.id).select('name avatar logo');
    }

    // Add user's reaction if logged in
    let userReaction = null;
    if (currentUserId) {
      userReaction = await Reaction.findOne({
        'target.id': comment._id,
        'target.type': 'Comment',
        userId: currentUserId
      });
    }

    const commentObj = comment.toObject();
    commentObj.author.details = authorData;
    commentObj.userReaction = userReaction || null;

    return commentObj;
  }

  // Get comments for a post
  static async getCommentsByPost(postId, page = 1, limit = 20, currentUserId = null) {
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      postId,
      parentCommentId: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add user reactions and author details to each comment
    const commentsWithReactions = await Promise.all(
      comments.map(async (comment) => {
        // Populate author
        let authorData = null;
        if (comment.author.type === 'User') {
          authorData = await User.findById(comment.author.id).select('firstName lastName avatar logo');
        } else if (comment.author.type === 'Company') {
          authorData = await Company.findById(comment.author.id).select('name avatar logo');
        }

        let userReaction = null;
        if (currentUserId) {
          userReaction = await Reaction.findOne({
            'target.id': comment._id,
            'target.type': 'Comment',
            userId: currentUserId
          });
        }

        const commentObj = comment.toObject();
        commentObj.author.details = authorData;
        commentObj.userReaction = userReaction || null;
        return commentObj;
      })
    );

    const total = await Comment.countDocuments({
      postId,
      parentCommentId: null
    });

    return {
      comments: commentsWithReactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update comment
  static async updateComment(commentId, authorId, authorType, content) {
    const comment = await Comment.findOne({
      _id: commentId,
      'author.id': authorId,
      'author.type': authorType
    });

    if (!comment) return null;

    comment.content = content;
    return await comment.save();
  }

  // Delete comment
  static async deleteComment(commentId, authorId, authorType) {
    const comment = await Comment.findOne({
      _id: commentId,
      'author.id': authorId,
      'author.type': authorType
    });

    if (!comment) return null;

    await Comment.findByIdAndDelete(commentId);

    // Decrement comment count on post
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

    // If it's a reply, decrement reply count on parent comment
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } });
    }

    // Also delete all replies
    await Comment.deleteMany({ parentCommentId: commentId });

    // Delete all reactions to this comment
    await Reaction.deleteMany({ 'target.id': commentId, 'target.type': 'Comment' });

    return comment;
  }

  // Get replies for a comment
  static async getReplies(commentId, page = 1, limit = 20, currentUserId = null) {
    const skip = (page - 1) * limit;

    const replies = await Comment.find({
      parentCommentId: commentId
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Add user reactions and author details to each reply
    const repliesWithReactions = await Promise.all(
      replies.map(async (reply) => {
        // Populate author
        let authorData = null;
        if (reply.author.type === 'User') {
          authorData = await User.findById(reply.author.id).select('firstName lastName avatar logo');
        } else if (reply.author.type === 'Company') {
          authorData = await Company.findById(reply.author.id).select('name avatar logo');
        }

        let userReaction = null;
        if (currentUserId) {
          userReaction = await Reaction.findOne({
            'target.id': reply._id,
            'target.type': 'Comment',
            userId: currentUserId
          });
        }

        const replyObj = reply.toObject();
        replyObj.author.details = authorData;
        replyObj.userReaction = userReaction || null;
        return replyObj;
      })
    );

    const total = await Comment.countDocuments({
      parentCommentId: commentId
    });

    return {
      replies: repliesWithReactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = CommentService;