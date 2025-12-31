const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate, isCompany } = require('../middleware/auth');
const upload = require('../middleware/upload');



/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company endpoints
 */

/**
 * @swagger
 * /api/companies/profile:
 *   get:
 *     summary: Get company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, isCompany, companyController.getCompanyProfile);

/**
 * @swagger
 * /api/companies/profile/{id}:
 *   put:
 *     summary: Update company profile
 *     tags: [Companies]
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
  '/profile/:id',
  authenticate, isCompany,
  upload.single('logo'),
  companyController.updateCompany
);

/**
 * @swagger
 * /api/companies/engagements/week:
 *   get:
 *     summary: Get week engagements and all applicants for company jobs
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Week engagements and applicants retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/engagements/week', authenticate, isCompany, companyController.getWeekEngagementsAndApplicants);

// Get all jobs for the authenticated company
/**
 * @swagger
 * /api/companies/jobs:
 *   get:
 *     summary: Get all jobs for the authenticated company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company jobs
 */
router.get('/jobs', authenticate, isCompany, companyController.getMyJobs);

// Get applicants for a specific job
/**
 * @swagger
 * /api/companies/jobs/{id}/applicants:
 *   get:
 *     summary: Get applicants for a specific job (company-only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Applicants list for the job
 */
router.get('/jobs/:id/applicants', authenticate, isCompany, companyController.getJobApplicants);

/**
 * @swagger
 * /api/companies/jobs/{id}:
 *   delete:
 *     summary: Delete a job posting
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to delete
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.delete('/jobs/:id', authenticate, isCompany, companyController.deleteJob);

module.exports = router;
