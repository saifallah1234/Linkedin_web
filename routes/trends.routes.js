const express = require('express');
const router = express.Router();
const trendsController = require('../controllers/trends.controller');

/**
 * @swagger
 * tags:
 *   name: Trends
 *   description: Trending topics and hashtags endpoints
 */

/**
 * @swagger
 * /api/trends/topics:
 *   get:
 *     summary: Get trending topics/hashtags (like LinkedIn sidebar)
 *     tags: [Trends]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of trending topics to return
 *     responses:
 *       200:
 *         description: List of trending topics with counts and ranks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tag:
 *                         type: string
 *                         example: "#AlinBusiness"
 *                       count:
 *                         type: integer
 *                         example: 12500
 *                       posts:
 *                         type: string
 *                         example: "12.5K posts"
 *                       rank:
 *                         type: integer
 *                         example: 1
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error (returns default trends)
 */
router.get('/topics', trendsController.getTrendingTopics);

/**
 * @swagger
 * /api/trends/feed-trends:
 *   get:
 *     summary: Get trending data for feed sidebar
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: Trending data for feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     trendingTopics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TrendingTopic'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error (returns default trends)
 */
router.get('/feed-trends', trendsController.getFeedTrends);

module.exports = router;