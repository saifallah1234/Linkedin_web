const mongoose = require('mongoose');
const Post = mongoose.models.Post || require('../models/post.model');
const JobOffer = mongoose.models.JobOffer || require('../models/JobOffer.model');
exports.getTrendingTopics = async (limit = 5) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPosts = await Post.find({
      createdAt: { $gte: last24Hours }
    }).select('content').lean();
    const hashtagCount = {};
    
    recentPosts.forEach(post => {
      const hashtags = post.content.match(/#[a-zA-Z0-9_]+/g) || [];
      hashtags.forEach(tag => {
        const cleanTag = tag.toLowerCase();
        hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
      });
    });
    const topHashtags = Object.entries(hashtagCount)
      .map(([tag, count]) => ({ 
        tag, 
        count,
        posts: formatCount(count) 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    if (topHashtags.length < limit) {
      const fallbackTrends = [
        { tag: '#AlinBusiness', count: 12500, posts: '12.5K posts', isDefault: true },
        { tag: '#RemoteWork', count: 8200, posts: '8.2K posts', isDefault: true },
        { tag: '#TechLayoffs', count: 6700, posts: '6.7K posts', isDefault: true },
        { tag: '#CareerGrowth', count: 5400, posts: '5.4K posts', isDefault: true },
        { tag: '#Leadership', count: 4100, posts: '4.1K posts', isDefault: true },
        { tag: '#JobSearch', count: 3800, posts: '3.8K posts', isDefault: true },
        { tag: '#Networking', count: 3200, posts: '3.2K posts', isDefault: true },
        { tag: '#WorkLifeBalance', count: 2900, posts: '2.9K posts', isDefault: true }
      ];
      const existingTags = new Set(topHashtags.map(t => t.tag));
      fallbackTrends.forEach(trend => {
        if (topHashtags.length < limit && !existingTags.has(trend.tag)) {
          topHashtags.push(trend);
          existingTags.add(trend.tag);
        }
      });
    }
    const trendingTopics = topHashtags.map((topic, index) => ({
      ...topic,
      rank: index + 1
    }));
    
    return {
      success: true,
      data: trendingTopics,
      lastUpdated: new Date()
    };
    
  } catch (error) {
    console.error('Error in getTrendingTopics service:', error);
    const defaultTrends = [
      { tag: '#AlinBusiness', posts: '12.5K posts', count: 12500, rank: 1, isDefault: true },
      { tag: '#RemoteWork', posts: '8.2K posts', count: 8200, rank: 2, isDefault: true },
      { tag: '#TechLayoffs', posts: '6.7K posts', count: 6700, rank: 3, isDefault: true },
      { tag: '#CareerGrowth', posts: '5.4K posts', count: 5400, rank: 4, isDefault: true },
      { tag: '#Leadership', posts: '4.1K posts', count: 4100, rank: 5, isDefault: true }
    ];
    
    return {
      success: true,
      data: defaultTrends,
      message: 'Using default trends due to error',
      lastUpdated: new Date()
    };
  }
};
exports.getTrendingJobCategories = async () => {
  try {
    const jobCategories = await JobOffer.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          jobs: formatCount('$count'),
          _id: 0
        }
      }
    ]);
    if (jobCategories.length === 0) {
      jobCategories.push(
        { category: 'Software Development', jobs: '1.2K jobs', count: 1200 },
        { category: 'Marketing', jobs: '850 jobs', count: 850 },
        { category: 'Sales', jobs: '720 jobs', count: 720 },
        { category: 'Finance', jobs: '580 jobs', count: 580 },
        { category: 'Healthcare', jobs: '450 jobs', count: 450 }
      );
    }
    
    return {
      success: true,
      data: jobCategories
    };
    
  } catch (error) {
    console.error('Error in getTrendingJobCategories service:', error);
    throw error;
  }
};
exports.getTrendingCompanies = async () => {
  try {
    const trendingCompanies = await Post.aggregate([
      {
        $match: {
          "author.type": "Company",
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$author.id',
          postCount: { $sum: 1 },
          totalEngagement: { 
            $sum: { $add: [{ $ifNull: ["$likesCount", 0] }, { $ifNull: ["$commentsCount", 0] }] }
          }
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $unwind: '$company'
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          companyId: '$_id',
          companyName: '$company.name',
          logo: '$company.logo',
          postCount: 1,
          totalEngagement: 1,
          _id: 0
        }
      }
    ]);
    
    return { 
      success: true, 
      data: trendingCompanies 
    };
  } catch (error) {
    console.error('Error in getTrendingCompanies service:', error);
    throw error;
  }
};
exports.getFeedTrends = async () => {
  try {
    const trendingTopics = await this.getTrendingTopics(5);
    
    return {
      success: true,
      data: {
        trendingTopics: trendingTopics.data
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getFeedTrends service:', error);
    return {
      success: true,
      data: {
        trendingTopics: [
          { tag: '#AlinBusiness', posts: '12.5K posts', count: 12500, rank: 1 },
          { tag: '#RemoteWork', posts: '8.2K posts', count: 8200, rank: 2 },
          { tag: '#TechLayoffs', posts: '6.7K posts', count: 6700, rank: 3 },
          { tag: '#CareerGrowth', posts: '5.4K posts', count: 5400, rank: 4 },
          { tag: '#Leadership', posts: '4.1K posts', count: 4100, rank: 5 }
        ]
      },
      message: 'Using default trends due to error',
      timestamp: new Date().toISOString()
    };
  }
};

function formatCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M posts';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K posts';
  }
  return count.toString() + ' posts';
}