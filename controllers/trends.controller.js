const trendsService = require('../services/trends.service');
exports.getTrendingTopics = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const result = await trendsService.getTrendingTopics(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Error in getTrendingTopics controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trending topics',
      data: [
        { tag: '#AlinBusiness', posts: '12.5K posts', count: 12500, rank: 1 },
        { tag: '#RemoteWork', posts: '8.2K posts', count: 8200, rank: 2 },
        { tag: '#TechLayoffs', posts: '6.7K posts', count: 6700, rank: 3 },
        { tag: '#CareerGrowth', posts: '5.4K posts', count: 5400, rank: 4 },
        { tag: '#Leadership', posts: '4.1K posts', count: 4100, rank: 5 }
      ]
    });
  }
};
exports.getFeedTrends = async (req, res) => {
  try {
    const result = await trendsService.getFeedTrends();
    res.json(result);
  } catch (error) {
    console.error('Error in getFeedTrends controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch feed trends',
      data: {
        trendingTopics: [
          { tag: '#AlinBusiness', posts: '12.5K posts', count: 12500, rank: 1 },
          { tag: '#RemoteWork', posts: '8.2K posts', count: 8200, rank: 2 },
          { tag: '#TechLayoffs', posts: '6.7K posts', count: 6700, rank: 3 },
          { tag: '#CareerGrowth', posts: '5.4K posts', count: 5400, rank: 4 },
          { tag: '#Leadership', posts: '4.1K posts', count: 4100, rank: 5 }
        ]
      }
    });
  }
};