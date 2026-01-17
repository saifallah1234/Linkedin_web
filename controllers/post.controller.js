const PostService = require('../services/post.service');
const { generatePostContent } = require('../utils/groq');

class PostController {
  static async createPost(req, res) {
    try {
      let { content } = req.body;
      const rawUseAI = req.body.useAI;
      const useAI = rawUseAI === true || rawUseAI === 'true' || rawUseAI === '1' || rawUseAI === 1;

      if (useAI) {
        content = await generatePostContent(content);
      }

      const media = req.files || [];
      const mediaWithTypes = media.map(file => {
        // Get MIME type and split it
        const mimeType = file.mimetype;
        const [mainType, subType] = mimeType.split('/');
        
        let mediaType;
        if (mainType === 'image') {
          mediaType = 'image';
        } else if (mainType === 'video') {
          mediaType = 'video';
        } else if (mimeType === 'application/pdf' || subType === 'pdf') {
          mediaType = 'pdf';  
        } else {
          mediaType = 'image';
        }

        return {
          filename: file.filename,
          mediaType: mediaType,
          path: file.path
        };
      });

      const post = await PostService.createPost(
        req.user.id,
        req.user.type,
        content,
        mediaWithTypes
      );

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating post',
        error: error.message
      });
    }
  }

  static async getPost(req, res) {
    try {
      const { id } = req.params;
      const post = await PostService.getPostById(id, req.user?.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching post',
        error: error.message
      });
    }
  }
  static async updatePost(req, res) {
    try {
      const { id } = req.params;
      let { content } = req.body;
      const rawUseAI = req.body.useAI;
      const useAI = rawUseAI === true || rawUseAI === 'true' || rawUseAI === '1' || rawUseAI === 1;

      if (content !== undefined && useAI) {
        content = await generatePostContent(content);
      }

      const updates = {};
      if (content !== undefined) updates.content = content;

      const post = await PostService.updatePost(
        id,
        req.user.id,
        req.user.type,
        updates
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or not authorized'
        });
      }

      res.json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating post',
        error: error.message
      });
    }
  }
  static async deletePost(req, res) {
    try {
      const { id } = req.params;
      const post = await PostService.deletePost(id, req.user.id, req.user.type);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or not authorized'
        });
      }

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting post',
        error: error.message
      });
    }
  }
  static async getFeed(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const feed = await PostService.getUserFeed(req.user.id, page, limit);

      res.json({
        success: true,
        data: feed
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching feed',
        error: error.message
      });
    }
  }
  static async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const posts = await PostService.getPostsByAuthor(userId, 'User', page, limit);

      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user posts',
        error: error.message
      });
    }
  }
  static async getCompanyPosts(req, res) {
    try {
      const { companyId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const posts = await PostService.getPostsByAuthor(companyId, 'Company', page, limit);

      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching company posts',
        error: error.message
      });
    }
  }
  static async searchPosts(req, res) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const results = await PostService.searchPosts(q, page, limit);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching posts',
        error: error.message
      });
    }
  }
}

module.exports = PostController;