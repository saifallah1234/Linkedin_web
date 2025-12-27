const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload'); // <--- Import Middleware

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company endpoints
 */

/**
 * @swagger
 * /company:
 *   get:
 *     summary: Get company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, companyController.getCompanyProfile);

/**
 * @swagger
 * /company/edit/{id}:
 *   put:
 *     summary: Update company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/edit/:id', 
  authenticate,           // 1. Check Token
  upload.single('logo'),  // 2. Handle Logo Upload (Form field name must be 'logo')
  companyController.updateCompany // 3. Logic
);

module.exports = router;
