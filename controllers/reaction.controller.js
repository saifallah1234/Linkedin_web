const ReactionService = require('../services/reaction.service');

class ReactionController {
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
  static async getReactionStats(req, res) {
    try {
        const { targetType, targetId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target ID'
            });
        }

        const stats = await ReactionService.getReactionStats(
            targetType,
            targetId
        );

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching reaction stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reaction stats',
            error: error.message
        });
    }
}}

module.exports = ReactionController;