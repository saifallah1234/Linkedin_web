const express = require('express');
const router = express.Router();
const jobCtrl = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job posting and application endpoints
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of all jobs
 */
router.get('/', jobCtrl.getAllJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a job by ID
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
 *       200:
 *         description: Successfully applied
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/apply', authenticate, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'additionalAttachment', maxCount: 1 }
]), jobCtrl.applyToJob);

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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               requirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, jobCtrl.createJob);

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
 *         description: Job closed successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/close', authenticate, jobCtrl.closeJob);

/**
 * @swagger
 * /api/jobs/{id}/applicants/{userId}/status:
 *   put:
 *     summary: Update applicant status for a job
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
 *         description: Applicant (user) ID
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
 *                 enum: [ACCEPTED, REJECTED, PENDING]
 *     responses:
 *       200:
 *         description: Applicant status updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/applicants/:userId/status', authenticate, jobCtrl.updateApplicantStatus);

module.exports = router;
