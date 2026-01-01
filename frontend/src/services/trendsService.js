import api from '../api/axios';

const trendsService = {
  // --- 1. Get List of Trending Hashtags ---
  // GET /api/trends/topics?limit=5
  getTrendingTopics: async (limit = 5) => {
    return api.get('/trends/topics', {
      params: { limit }
    });
  },

  // --- 2. Get Combined Feed Trends ---
  // GET /api/trends/feed-trends
  // This likely returns topics + maybe suggested people or news in one payload
  getFeedTrends: async () => {
    return api.get('/trends/feed-trends');
  }
};

export default trendsService;