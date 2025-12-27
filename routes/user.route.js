const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const protect = require('../middleware/mockAuth'); // Replace with real auth later
const upload = require('../middleware/upload'); // For image upload

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and following endpoints
 */

// Get logged-in user profile
/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, userController.getUserProfile);

// Get list of companies the user is following
/**
 * @swagger
 * /user/following:
 *   get:
 *     summary: Get list of followed companies
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/following', protect, userController.getFollowingList);

// Update user profile
/**
 * @swagger
 * /user/edit/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               location:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/edit/:id', 
  protect,              
  upload.single('image'), 
  userController.updateUser
);

// Follow a company
/**
 * @swagger
 * /user/follow/{id}:
 *   post:
 *     summary: Follow a company
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to follow
 *     responses:
 *       200:
 *         description: Company followed successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/follow/:id', protect, userController.followCompany);

// Unfollow a company
/**
 * @swagger
 * /user/unfollow/{id}:
 *   post:
 *     summary: Unfollow a company
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to unfollow
 *     responses:
 *       200:
 *         description: Company unfollowed successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/unfollow/:id', protect, userController.unfollowCompany);

module.exports = router;
