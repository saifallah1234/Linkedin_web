import api from '../api/axios';

const commentService = {
  // --- 1. Create Comment ---
  // POST /api/posts/:postId/comments
  // Supports AI generation if useAI is true
  createComment: async (postId, content, parentCommentId = null, useAI = false) => {
    return api.post(`/posts/${postId}/comments`, {
      content,
      parentCommentId,
      useAI
    });
  },

  // --- 2. Get Comments for a Post ---
  // GET /api/posts/:postId/comments
  getPostComments: async (postId, page = 1, limit = 20) => {
    return api.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
  },

  // --- 3. Update Comment ---
  // PUT /api/posts/comments/:commentId
  updateComment: async (commentId, content, useAI = false) => {
    return api.put(`/posts/comments/${commentId}`, {
      content,
      useAI
    });
  },

  // --- 4. Delete Comment ---
  // DELETE /api/posts/comments/:commentId
  deleteComment: async (commentId) => {
    return api.delete(`/posts/comments/${commentId}`);
  },

  // --- 5. Get Replies (Nested Comments) ---
  // GET /api/posts/comments/:commentId/replies
  getReplies: async (commentId, page = 1, limit = 10) => {
    return api.get(`/posts/comments/${commentId}/replies`, {
      params: { page, limit }
    });
  }
};

export default commentService;