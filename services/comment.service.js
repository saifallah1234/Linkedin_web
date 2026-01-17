const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const Reaction = require('../models/reaction.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const notificationService = require('./notification.service');

class CommentService {
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

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } });
    }

    try {
      const post = await Post.findById(postId).select('author');
      if (post) {
        const postAuthorId = post.author.id;
        const postAuthorType = post.author.type;
        if (postAuthorId.toString() !== authorId.toString()) {
          await notificationService.createNotification(
            { id: postAuthorId, type: postAuthorType },
            { id: authorId, type: authorType },
            parentCommentId ? 'reply' : 'comment',
            { id: parentCommentId || postId, type: parentCommentId ? 'Comment' : 'Post' }
          );
        }
      }
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

  static async getCommentWithAuthor(commentId, currentUserId = null) {
    const comment = await Comment.findById(commentId);

    if (!comment) return null;
    let authorData = null;
    if (comment.author.type === 'User') {
     authorData = await User.findById(comment.author.id).select('firstName lastName image');
    } else if (comment.author.type === 'Company') {
      authorData = await Company.findById(comment.author.id).select('name logo');
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
  }
  static async getCommentsByPost(postId, page = 1, limit = 20, currentUserId = null) {
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      postId,
      parentCommentId: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const commentsWithReactions = await Promise.all(
      comments.map(async (comment) => {
        let authorData = null;
        if (comment.author.type === 'User') {
          authorData = await User.findById(comment.author.id).select('firstName lastName image');
        } else if (comment.author.type === 'Company') {
          authorData = await Company.findById(comment.author.id).select('name logo');
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
  static async deleteComment(commentId, authorId, authorType) {
    const comment = await Comment.findOne({
      _id: commentId,
      'author.id': authorId,
      'author.type': authorType
    });

    if (!comment) return null;
    const replies = await Comment.find({ parentCommentId: commentId }).select('_id').lean();
    const numReplies = replies.length;
    await Comment.findByIdAndDelete(commentId);
    if (numReplies > 0) {
      const replyIds = replies.map(r => r._id);
      await Comment.deleteMany({ parentCommentId: commentId });
      await Reaction.deleteMany({ 'target.id': { $in: replyIds }, 'target.type': 'Comment' });
    }
    const decrement = 1 + numReplies;
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -decrement } });
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } });
    }
    await Reaction.deleteMany({ 'target.id': commentId, 'target.type': 'Comment' });

    return comment;
  }
  static async getReplies(commentId, page = 1, limit = 20, currentUserId = null) {
    const skip = (page - 1) * limit;

    const replies = await Comment.find({
      parentCommentId: commentId
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
    const repliesWithReactions = await Promise.all(
      replies.map(async (reply) => {
        let authorData = null;
        if (reply.author.type === 'User') {
          authorData = await User.findById(reply.author.id).select('firstName lastName image');
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