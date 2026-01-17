const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const upload = require('../middleware/upload');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints (user & company)
 */

/**
 * @swagger
 * /signup/user:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - location
 *               - image
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               location:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation errors
 */
router.post(
  '/signup/user',
  upload.single('image'),
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 chars password'),
    body('location').optional()
  ],
  validate,
  authController.signupUser
);
/**
 * @swagger
 * /signup/user/google:
 *   post:
 *     summary: Register a new user with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleToken
 *             properties:
 *               googleToken:
 *                 type: string
 *                 description: Google ID token from frontend
 *               location:
 *                 type: string
 *                 description: User's location (optional)
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth (optional)
 *     responses:
 *       201:
 *         description: User created successfully with Google
 *       400:
 *         description: Invalid token or email already registered
 */
router.post(
  '/signup/user/google',
  [
    body('googleToken').notEmpty().withMessage('Google token is required')
  ],
  validate,
  authController.signupUserWithGoogle
);

/**
 * @swagger
 * /check-google-signup:
 *   post:
 *     summary: Check if email can be used for Google signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check result
 */
router.post(
  '/check-google-signup',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validate,
  authController.checkGoogleSignupAvailability
);
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Unified login for both users and companies
 *     tags: [Auth]
 *     description: Automatically detects if email belongs to a user or company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [User, Company]
 *                 accountType:
 *                   type: string
 *                   enum: [user, company]
 *                 user:
 *                   type: object
 *                   description: Only present when accountType is "user"
 *                 company:
 *                   type: object
 *                   description: Only present when accountType is "company"
 *       400:
 *         description: Bad request (missing fields, Google user trying password login, etc.)
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  authController.unifiedLogin
);

/**
 * @swagger
 * /login/google:
 *   post:
 *     summary: Unified Google login for users
 *     tags: [Auth]
 *     description: Google login that works for both existing and new users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleToken
 *             properties:
 *               googleToken:
 *                 type: string
 *                 description: Google ID token from frontend
 *     responses:
 *       200:
 *         description: Google login successful
 *       400:
 *         description: Invalid token or account type mismatch
 */
router.post(
  '/login/google',
  [
    body('googleToken').notEmpty().withMessage('Google token is required')
  ],
  validate,
  authController.unifiedGoogleLogin
);

/**
 * @swagger
 * /session:
 *   get:
 *     summary: Get current session information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isAuthenticated:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                   enum: [User, Company]
 *                 accountType:
 *                   type: string
 *                   enum: [user, company]
 *                 user:
 *                   type: object
 *                   description: Only present when accountType is "user"
 *                 company:
 *                   type: object
 *                   description: Only present when accountType is "company"
 */
router.get('/session',authController.getCurrentSession);
/**
 * @swagger
 * /signup/company:
 *   post:
 *     summary: Register a new company
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - logo
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               location:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation errors
 */
router.post(
  '/signup/company',
  upload.single('logo'),
  [
    body('name').notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 chars password'),
    body('location').optional()
  ],
  validate,
  authController.signupCompany
);

/**
 * @swagger
 * /login/user:
 *   post:
 *     summary: Login as a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login/user',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  authController.loginUser
);

/**
 * @swagger
 * /login/company:
 *   post:
 *     summary: Login as a company
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login/company',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  authController.loginCompany,
);


module.exports = router;
