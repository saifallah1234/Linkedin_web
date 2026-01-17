const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and following endpoints
 */

// Get logged-in user profile
/**
 * @swagger
 * /api/users/profile:
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
router.get('/profile', authenticate, isUser, userController.getUserProfile);

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/all', authenticate, userController.getAllUsers);



// Public profile by id (no auth) - used by web profile pages
/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: Get public user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public profile retrieved
 *       404:
 *         description: User not found
 */
router.get('/profile/:id', userController.getPublicProfile);

// Get list of companies the user is following
/**
 * @swagger
 * /api/users/following:
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
router.get('/following', authenticate, isUser, userController.getFollowingList);

// Update user profile
/**
 * @swagger
 * /api/users/profile/update:
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
  '/profile/update',
  authenticate, isUser,
  upload.single('image'),
  userController.updateUser
);

// Follow a company
/**
 * @swagger
 * /api/users/follow/{id}:
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
router.post('/follow/:id', authenticate, isUser, userController.followCompany);

/**
 * @swagger
 * /api/users/unfollow/{id}:
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
router.post('/unfollow/:id', authenticate, isUser, userController.unfollowCompany);

/**
 * @swagger
 * /api/users/suggestions/users:
 *   get:
 *     summary: Get suggestions for users to connect with
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of suggestions (default 5)
 *     responses:
 *       200:
 *         description: User suggestions retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/suggestions/users', authenticate, isUser, userController.getUserSuggestions);

/**
 * @swagger
 * /api/users/suggestions/companies:
 *   get:
 *     summary: Get suggestions for companies to follow
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of suggestions (default 5)
 *     responses:
 *       200:
 *         description: Company suggestions retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/suggestions/companies', authenticate, isUser, userController.getCompanySuggestions);

/**
 * @swagger
 * /api/users/resume/download:
 *   get:
 *     summary: Generate and download resume as PDF
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF resume generated successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/resume/download', authenticate, isUser, userController.generateResumePDF);


/**
 * @swagger
 * /api/users/jobs/active:
 *   get:
 *     summary: Get active jobs (not applied to yet)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of active jobs
 *       401:
 *         description: Unauthorized
 */
router.get('/jobs/active', authenticate, isUser, userController.getActiveJobs);

/**
 * @swagger
 * /api/users/jobs/expiring:
 *   get:
 *     summary: Get jobs expiring soon (within 7 days)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of jobs to return
 *     responses:
 *       200:
 *         description: List of expiring jobs
 *       401:
 *         description: Unauthorized
 */
router.get('/jobs/expiring', authenticate, isUser, userController.getExpiringJobs);

/**
 * @swagger
 * /api/users/companies/hiring:
 *   get:
 *     summary: Get companies currently hiring
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of companies to return
 *     responses:
 *       200:
 *         description: List of hiring companies
 *       401:
 *         description: Unauthorized
 */
router.get('/companies/hiring', authenticate, isUser, userController.getHiringCompanies);

router.post('/experiences', authenticate, isUser, userController.addExperience);
router.put('/experiences/:id', authenticate, isUser, userController.updateExperience);
router.delete('/experiences/:id', authenticate, isUser, userController.deleteExperience);

router.post('/projects', authenticate, isUser, userController.addProject);
router.put('/projects/:id', authenticate, isUser, userController.updateProject);
router.delete('/projects/:id', authenticate, isUser, userController.deleteProject);

router.post('/skills', authenticate, isUser, userController.addSkill);
router.put('/skills/:id', authenticate, isUser, userController.updateSkill);
router.delete('/skills/:id', authenticate, isUser, userController.deleteSkill);

router.post('/certificates', authenticate, isUser, userController.addCertificate);
router.put('/certificates/:id', authenticate, isUser, userController.updateCertificate);
router.delete('/certificates/:id', authenticate, isUser, userController.deleteCertificate);

module.exports = router;
