import api from '../api/axios';

const reactionService = {
  // --- 1. Add/Update Reaction ---
  // POST /api/reactions/:targetType/:targetId
  // targetType: 'Post', 'Comment', or 'Message'
  // reactionType: 'like', 'love', 'dislike', 'encourage', 'haha'
  addReaction: async (targetType, targetId, reactionType) => {
    // Ensure targetType is capitalized to match backend validation
    const type = targetType.charAt(0).toUpperCase() + targetType.slice(1);
    
    return api.post(`/reactions/${type}/${targetId}`, {
      reactionType
    });
  },

  // --- 2. Remove Reaction ---
  // DELETE /api/reactions/:targetType/:targetId
  removeReaction: async (targetType, targetId) => {
    const type = targetType.charAt(0).toUpperCase() + targetType.slice(1);
    return api.delete(`/reactions/${type}/${targetId}`);
  },

  // --- 3. Get User's Current Reaction ---
  // GET /api/reactions/:targetType/:targetId/user
  // Returns { success: true, data: { reactionType: 'like', ... } } or null
  getUserReaction: async (targetType, targetId) => {
    const type = targetType.charAt(0).toUpperCase() + targetType.slice(1);
    return api.get(`/reactions/${type}/${targetId}/user`);
  },

  // --- 4. Get Reaction Counts/Stats ---
  // GET /api/reactions/:targetType/:targetId/stats
  // Returns e.g., { like: 10, love: 5, total: 15 }
  getReactionStats: async (targetType, targetId) => {
    const type = targetType.charAt(0).toUpperCase() + targetType.slice(1);
    return api.get(`/reactions/${type}/${targetId}/stats`);
  },

  // --- 5. Get List of Who Reacted (Optional view) ---
  // GET /api/reactions/:targetType/:targetId?page=1
  getReactionsList: async (targetType, targetId, page = 1) => {
    const type = targetType.charAt(0).toUpperCase() + targetType.slice(1);
    return api.get(`/reactions/${type}/${targetId}`, {
      params: { page }
    });
  }
};

export default reactionService;