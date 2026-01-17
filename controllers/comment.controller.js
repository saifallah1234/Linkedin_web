const CommentService = require('../services/comment.service');
const { generatePostContent } = require('../utils/groq');

class CommentController {
  static async createComment(req, res) {
  try {
    const { postId } = req.params;
    let { content, parentCommentId } = req.body;
    const rawUseAI = req.body.useAI;
    const useAI = rawUseAI === true || rawUseAI === 'true' || rawUseAI === '1' || rawUseAI === 1;

    if (useAI) {
      content = await generatePostContent(content);
    }

    const comment = await CommentService.createComment(
      postId,
      req.user.id,
      req.user.type,
      content,
      parentCommentId
    );

    res.status(201).json({
      success: true,
      message: 'Comment added',
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
 static async updateComment(req, res) {
  try {
    const { commentId } = req.params;
    let { content } = req.body;
    const rawUseAI = req.body.useAI;
    const useAI = rawUseAI === true || rawUseAI === 'true' || rawUseAI === '1' || rawUseAI === 1;

    if (content !== undefined && useAI) {
      content = await generatePostContent(content);
    }
    const comment = await CommentService.updateComment(
      commentId,
      req.user.id,
      req.user.type,
      content
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or authorized'
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
          message: 'Comment not found or  authorized'
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