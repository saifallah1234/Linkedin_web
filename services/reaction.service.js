const Reaction = require('../models/reaction.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const mongoose = require('mongoose');
const notificationService = require('./notification.service');

class ReactionService {
  static async addReaction(userId, targetType, targetId, reactionType) {
    const modelType = targetType.charAt(0).toUpperCase() + targetType.slice(1);
    let target;
    if (targetType === 'Post') {
      target = await Post.findById(targetId);
    } else if (targetType === 'Comment') {
      target = await Comment.findById(targetId);
    }

    if (!target) {
      throw new Error(`${targetType} not found`);
    }
    const existingReaction = await Reaction.findOne({
      'target.id': targetId,
      'target.type': modelType,
      userId: userId
    });

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        await Reaction.findByIdAndDelete(existingReaction._id);
        if (modelType === 'Post') {
          await Post.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
        } else if (modelType === 'Comment') {
          await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
        }
        return null;
      } else {
        existingReaction.reactionType = reactionType;
        await existingReaction.save();
        return existingReaction;
      }
    } else {
      const reaction = new Reaction({
        target: {
          id: targetId,
          type: modelType
        },
        userId: userId,
        reactionType: reactionType
      });

      await reaction.save();
      if (modelType === 'Post') {
        await Post.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
      } else if (modelType === 'Comment') {
        await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
      }
      try {
        let targetAuthor = null;
        if (targetType === 'Post') {
          const p = await Post.findById(targetId).select('author');
          targetAuthor = p && p.author ? p.author : null;
        } else if (targetType === 'Comment') {
          const c = await Comment.findById(targetId).select('author');
          targetAuthor = c && c.author ? c.author : null;
        }

        if (targetAuthor && targetAuthor.id.toString() !== userId.toString()) {
          await notificationService.createNotification(
            { id: targetAuthor.id, type: targetAuthor.type },
            { id: userId, type: 'User' },
            'reaction',
            { id: targetId, type: modelType }
          );
        }
      } catch (err) {
        console.error('Error creating reaction notification:', err);
      }
      return reaction;
    }
  }

  static async removeReaction(userId, targetType, targetId) {
    const modelType = targetType.charAt(0).toUpperCase() + targetType.slice(1);

    const reaction = await Reaction.findOneAndDelete({
      'target.id': targetId,
      'target.type': modelType,
      userId: userId
    });

    if (reaction) {
      if (modelType === 'Post') {
        await Post.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
      } else if (modelType === 'Comment') {
        await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
      }
    }

    return reaction;
  }

  static async getReactions(targetType, targetId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const modelType = targetType.charAt(0).toUpperCase() + targetType.slice(1);

    const reactions = await Reaction.find({
      'target.id': targetId,
      'target.type': modelType
    })
      .populate({
        path: 'userId',
        select: 'firstName lastName name avatar logo',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reaction.countDocuments({
      'target.id': targetId,
      'target.type': modelType
    });

    return {
      reactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  static async getUserReaction(userId, targetType, targetId) {
    const modelType = targetType.charAt(0).toUpperCase() + targetType.slice(1);

    return await Reaction.findOne({
      'target.id': targetId,
      'target.type': modelType,
      userId: userId
    });
  }
  static async getReactionStats(targetType, targetId) {
    const modelType = targetType.charAt(0).toUpperCase() + targetType.slice(1);

    const stats = await Reaction.aggregate([
        {
            $match: {
                'target.id': new mongoose.Types.ObjectId(targetId), 
                'target.type': modelType
            }
        },
        {
            $group: {
                _id: '$reactionType',
                count: { $sum: 1 }
            }
        }
    ]);
    const result = {};
    Object.keys(this.reactionTypes).forEach(type => {
        result[type] = 0;
    });

    stats.forEach(stat => {
        result[stat._id] = stat.count;
    });

    return result;
}}

module.exports = ReactionService;