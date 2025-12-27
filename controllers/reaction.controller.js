const ReactionService = require('../services/reaction.service');

class ReactionController {
  // React to a post or comment
  static async addReaction(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const { reactionType } = req.body;

      if (!['like', 'love', 'dislike', 'encourage', 'haha'].includes(reactionType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reaction type'
        });
      }

      if (!['Post', 'Comment', 'Message'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target type'
        });
      }

      const reaction = await ReactionService.addReaction(
        req.user.id,
        targetType,
        targetId,
        reactionType
      );

      if (reaction) {
        res.json({
          success: true,
          message: 'Reaction added successfully',
          data: reaction
        });
      } else {
        res.json({
          success: true,
          message: 'Reaction removed successfully'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding reaction',
        error: error.message
      });
    }
  }

  // Remove reaction
  static async removeReaction(req, res) {
    try {
      const { targetType, targetId } = req.params;

      const reaction = await ReactionService.removeReaction(
        req.user.id,
        targetType,
        targetId
      );

      if (!reaction) {
        return res.status(404).json({
          success: false,
          message: 'Reaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing reaction',
        error: error.message
      });
    }
  }

  // Get reactions for a target
  static async getReactions(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const reactions = await ReactionService.getReactions(
        targetType,
        targetId,
        page,
        limit
      );

      res.json({
        success: true,
        data: reactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching reactions',
        error: error.message
      });
    }
  }

  // Get user's reaction on a target
  static async getUserReaction(req, res) {
    try {
      const { targetType, targetId } = req.params;

      const reaction = await ReactionService.getUserReaction(
        req.user.id,
        targetType,
        targetId
      );

      res.json({
        success: true,
        data: reaction || null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user reaction',
        error: error.message
      });
    }
  }

  // Get reaction statistics
  static async getReactionStats(req, res) {
    try {
      const { targetType, targetId } = req.params;

      const stats = await ReactionService.getReactionStats(
        targetType,
        targetId
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching reaction stats',
        error: error.message
      });
    }
  }
}

module.exports = ReactionController;