import api from '../api/axios';

const postService = {
  // --- 1. Create Post (Text + Images/Video + AI) ---
  // POST /api/posts
  createPost: async (content, mediaFiles = [], useAI = false) => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('useAI', useAI);

    // Append all selected media files
    if (mediaFiles && mediaFiles.length > 0) {
      Array.from(mediaFiles).forEach((file) => {
        formData.append('media', file);
      });
    }

    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- 2. Get Feed (Home Page) ---
  // GET /api/posts/feed?page=1&limit=10
  getFeed: async (page = 1, limit = 10) => {
    return api.get('/posts/feed', {
      params: { page, limit }
    });
  },

  // --- 3. Get Single Post ---
  // GET /api/posts/:id
  getPostById: async (postId) => {
    return api.get(`/posts/${postId}`);
  },

  // --- 4. Update Post ---
  // PUT /api/posts/:id
  updatePost: async (postId, content, useAI = false) => {
    return api.put(`/posts/${postId}`, { content, useAI });
  },

  // --- 5. Delete Post ---
  // DELETE /api/posts/:id
  deletePost: async (postId) => {
    return api.delete(`/posts/${postId}`);
  },

  // --- 6. Get Specific User's Posts (Profile) ---
  // GET /api/posts/user/:userId
  getUserPosts: async (userId, page = 1, limit = 10) => {
    return api.get(`/posts/user/${userId}`, {
      params: { page, limit }
    });
  },

  // --- 7. Get Specific Company's Posts ---
  // GET /api/posts/company/:companyId
  getCompanyPosts: async (companyId, page = 1, limit = 10) => {
    return api.get(`/posts/company/${companyId}`, {
      params: { page, limit }
    });
  },

  // --- 8. Search Posts ---
  // GET /api/posts/search?q=keyword
  searchPosts: async (query, page = 1, limit = 10) => {
    return api.get('/posts/search', {
      params: { q: query, page, limit }
    });
  }
};

export default postService;