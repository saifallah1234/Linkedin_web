const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const PostController = require('../controllers/post.controller');
const CommentController = require('../controllers/comment.controller');
const ReactionController = require('../controllers/reaction.controller');
const { authenticate, isAuthor } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Post = require('../models/post.model');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The text content of the post
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional media files to attach
 *               useAI:
 *                 type: boolean
 *                 description: Whether to enhance content using AI
 *                 default: false
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

router.post(
  '/',
  authenticate,
  upload.array('media', 10),
  [
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 5000 })
      .withMessage('Content too long (max 5000 chars)'),
    body('useAI').optional().isBoolean().withMessage('useAI must be boolean')
  ],
  validate,
  PostController.createPost
);


/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get user's feed (connections + followed companies)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/feed',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  PostController.getFeed
);

/**
 * @swagger
 * /api/posts/search:
 *   get:
 *     summary: Search posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 */
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  PostController.searchPosts
);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid post ID')
  ],
  validate,
  PostController.getPost
);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               useAI:
 *                 type: boolean
 *                 description: Whether to enhance content using AI
 *                 default: false
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not authorized to update this post
 *       404:
 *         description: Post not found
 */
router.put(
  '/:id',
  authenticate,
  isAuthor(Post, 'id'),
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('content')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('Content too long (max 5000 chars)'),
    body('useAI').optional().isBoolean().withMessage('useAI must be boolean')
  ],
  validate,
  PostController.updatePost
);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 */
router.delete(
  '/:id',
  authenticate,
  isAuthor(Post, 'id'),
  [
    param('id').isMongoId().withMessage('Invalid post ID')
  ],
  validate,
  PostController.deletePost
);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Get posts by user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 */
router.get(
  '/user/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  PostController.getUserPosts
);

/**
 * @swagger
 * /api/posts/company/{companyId}:
 *   get:
 *     summary: Get posts by company
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Company posts retrieved successfully
 */
router.get(
  '/company/:companyId',
  [
    param('companyId').isMongoId().withMessage('Invalid company ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  PostController.getCompanyPosts
);

// Comment routes
/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management endpoints
 */

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *                 description: ID of parent comment for nested replies
 *               useAI:
 *                 type: boolean
 *                 description: Whether to enhance content using AI
 *                 default: false
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post(
  '/:postId/comments',
  authenticate,
  [
    param('postId').isMongoId().withMessage('Invalid post ID'),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 2000 })
      .withMessage('Content too long (max 2000 chars)'),
    body('parentCommentId').optional().isMongoId().withMessage('Invalid parent comment ID'),
    body('useAI').optional().isBoolean().withMessage('useAI must be boolean')
  ],
  validate,
  CommentController.createComment
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get(
  '/:postId/comments',
  [
    param('postId').isMongoId().withMessage('Invalid post ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  CommentController.getPostComments
);

/**
 * @swagger
 * /api/posts/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               useAI:
 *                 type: boolean
 *                 description: Whether to enhance content using AI
 *                 default: false
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: Not authorized to update this comment
 *       404:
 *         description: Comment not found
 */
router.put(
  '/comments/:commentId',
  authenticate,
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 2000 })
      .withMessage('Content too long (max 2000 chars)'),
    body('useAI').optional().isBoolean().withMessage('useAI must be boolean')
  ],
  validate,
  CommentController.updateComment
);

/**
 * @swagger
 * /api/posts/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 */
router.delete(
  '/comments/:commentId',
  authenticate,
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID')
  ],
  validate,
  CommentController.deleteComment
);

/**
 * @swagger
 * /api/posts/comments/{commentId}/replies:
 *   get:
 *     summary: Get replies for a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Replies retrieved successfully
 *       404:
 *         description: Comment not found
 */
router.get(
  '/comments/:commentId/replies',
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  CommentController.getReplies
);

// Reaction routes
/**
 * @swagger
 * tags:
 *   name: Reactions
 *   description: Reaction management endpoints
 */

/**
 * @swagger
 * /api/posts/reactions/{targetType}/{targetId}:
 *   post:
 *     summary: Add or update a reaction
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Post, Comment, Message]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reactionType
 *             properties:
 *               reactionType:
 *                 type: string
 *                 enum: [like, love, dislike, encourage, haha]
 *     responses:
 *       200:
 *         description: Reaction added/updated successfully
 *       400:
 *         description: Invalid reaction type or target type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Target not found
 */
router.post(
  '/reactions/:targetType/:targetId',
  authenticate,
  [
    param('targetType').isIn(['Post', 'Comment', 'Message']),
    param('targetId').isMongoId(),
    body('reactionType').isIn(['like', 'love', 'dislike', 'encourage', 'haha'])
  ],
  validate,
  ReactionController.addReaction
);

/**
 * @swagger
 * /api/posts/reactions/{targetType}/{targetId}:
 *   delete:
 *     summary: Remove a reaction
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Post, Comment, Message]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reaction not found
 */
router.delete(
  '/reactions/:targetType/:targetId',
  authenticate,
  [
    param('targetType').isIn(['Post', 'Comment', 'Message']),
    param('targetId').isMongoId()
  ],
  validate,
  ReactionController.removeReaction
);

/**
 * @swagger
 * /api/posts/reactions/{targetType}/{targetId}:
 *   get:
 *     summary: Get reactions for a target
 *     tags: [Reactions]
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Post, Comment, Message]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Reactions retrieved successfully
 *       404:
 *         description: Target not found
 */
router.get(
  '/reactions/:targetType/:targetId',
  [
    param('targetType').isIn(['Post', 'Comment', 'Message']),
    param('targetId').isMongoId(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  ReactionController.getReactions
);

/**
 * @swagger
 * /api/posts/reactions/{targetType}/{targetId}/user:
 *   get:
 *     summary: Get user's reaction on a target
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Post, Comment, Message]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User reaction retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/reactions/:targetType/:targetId/user',
  authenticate,
  [
    param('targetType').isIn(['Post', 'Comment', 'Message']),
    param('targetId').isMongoId()
  ],
  validate,
  ReactionController.getUserReaction
);

/**
 * @swagger
 * /api/posts/reactions/{targetType}/{targetId}/stats:
 *   get:
 *     summary: Get reaction statistics for a target
 *     tags: [Reactions]
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Post, Comment, Message]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reaction statistics retrieved successfully
 *       404:
 *         description: Target not found
 */
router.get(
  '/reactions/:targetType/:targetId/stats',
  [
    param('targetType').isIn(['Post', 'Comment', 'Message']),
    param('targetId').isMongoId()
  ],
  validate,
  ReactionController.getReactionStats
);

module.exports = router;