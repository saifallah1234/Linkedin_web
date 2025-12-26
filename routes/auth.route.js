const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const upload = require('../middleware/upload'); // <--- Import Middleware

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// --- USER SIGNUP ---
// Expecting a file field named 'image'
router.post(
  '/signup/user',
  upload.single('image'), // <--- Multer processes file FIRST
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 chars password'),
    body('location').notEmpty().withMessage('Location is required')
  ],
  validate,
  authController.signupUser
);

// --- COMPANY SIGNUP ---
// Expecting a file field named 'logo'
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
// --- USER LOGIN ---
router.post(
  '/login/user',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  authController.loginUser
);

// --- COMPANY LOGIN ---
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