const express = require('express');
const router = express.Router();
const jobCtrl = require('../controllers/job.controller');
const { authenticate, isCompany, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job posting and application endpoints
 */

// --- PUBLIC ROUTES ---
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all active jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full-time, part-time, internship, freelance, contract]
 *         description: Filter by job type
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
 *         description: List of jobs
 */
router.get('/', jobCtrl.getAllJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get('/:id', jobCtrl.getJobById);

// --- APPLICANT ROUTES ---
/**
 * @swagger
 * /api/jobs/{id}/apply:
 *   post:
 *     summary: Apply to a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *               additionalAttachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/apply', authenticate, isUser, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'additionalAttachment', maxCount: 1 }
]), jobCtrl.applyToJob);

// --- COMPANY ROUTES ---
/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - type
 *               - salaryRange
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *                 description: Job description (will be enhanced if generateWithAI is true)
 *               type:
 *                 type: string
 *                 enum: [full-time, part-time, internship, freelance, contract]
 *               location:
 *                 type: string
 *               salaryRange:
 *                 type: string
 *               requirements:
 *                 type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               experienceLevel:
 *                 type: string
 *                 enum: [entry, junior, mid, senior, lead, executive]
 *               educationLevel:
 *                 type: string
 *                 enum: [high_school, bachelor, master, phd, any]
 *               deadline:
 *                 type: string
 *                 format: date
 *               generateWithAI:
 *                 type: boolean
 *                 default: false
 *                 description: If true, AI will generate/enhance the job description
 *     responses:
 *       201:
 *         description: Job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                   description: The generated/enhanced description if AI was used
 *                 companyId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, isCompany, jobCtrl.createJob);

/**
 * @swagger
 * /api/jobs/{id}/close:
 *   put:
 *     summary: Close a job posting
 *     tags: [Jobs]
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
 *         description: Job closed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/close', authenticate, isCompany, jobCtrl.closeJob);

/**
 * @swagger
 * /api/jobs/{id}/applicants/{userId}/status:
 *   put:
 *     summary: Update applicant status
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Applicant User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/applicants/:userId/status', authenticate, isCompany, jobCtrl.updateApplicantStatus);

// --- NEW AI SCORING ROUTES ---
/**
 * @swagger
 * /api/jobs/{id}/top-candidates:
 *   get:
 *     summary: Get top candidates for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of candidates to return
 *     responses:
 *       200:
 *         description: Top candidates
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/top-candidates', authenticate, isCompany, jobCtrl.getTopCandidates);

/**
 * @swagger
 * /api/jobs/{id}/rescore:
 *   post:
 *     summary: Re-score all applicants using AI
 *     tags: [Jobs]
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
 *         description: Rescoring completed
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/rescore', authenticate, isCompany, jobCtrl.rescoreApplicants);

/**
 * @swagger
 * /api/jobs/{id}/statistics:
 *   get:
 *     summary: Get job application statistics
 *     tags: [Jobs]
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
 *         description: Job statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/statistics', authenticate, isCompany, jobCtrl.getJobStatistics);

/**
 * @swagger
 * /api/jobs/companies/{companyId}/jobs:
 *   get:
 *     summary: Get public company jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */

router.get('/companies/:companyId/jobs', jobCtrl.getPublicCompanyJobs);
module.exports = router;

