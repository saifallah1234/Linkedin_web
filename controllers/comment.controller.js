const CommentService = require('../services/comment.service');

class CommentController {
  // Create a comment
  static async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;

      const comment = await CommentService.createComment(
        postId,
        req.user.id,
        req.user.type,
        content,
        parentCommentId
      );

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating comment',
        error: error.message
      });
    }
  }

  // Get comments for a post
  static async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const comments = await CommentService.getCommentsByPost(
        postId,
        page,
        limit,
        req.user?.id
      );

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  }

  // Update comment
  static async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const comment = await CommentService.updateComment(
        commentId,
        req.user.id,
        req.user.type,
        content
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or not authorized'
        });
      }

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: error.message
      });
    }
  }

  // Delete comment
  static async deleteComment(req, res) {
    try {
      const { commentId } = req.params;

      const comment = await CommentService.deleteComment(
        commentId,
        req.user.id,
        req.user.type
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or not authorized'
        });
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting comment',
        error: error.message
      });
    }
  }

  // Get comment replies
  static async getReplies(req, res) {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const replies = await CommentService.getReplies(
        commentId,
        page,
        limit,
        req.user?.id
      );

      res.json({
        success: true,
        data: replies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching replies',
        error: error.message
      });
    }
  }
}

module.exports = CommentController;