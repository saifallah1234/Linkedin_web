const mockAuth = require('../middleware/mockAuth');
const express = require('express');
const router = express.Router();
const jobCtrl = require('../controllers/job.controller');
// const auth = require('../middleware/auth.middleware'); // Use your real auth
const upload = require('../middleware/upload');

// Public/All Users
router.get('/', jobCtrl.getAllJobs);
router.get('/:id', jobCtrl.getJobById);

// Applicant Routes
router.post('/:id/apply', mockAuth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'additionalAttachment', maxCount: 1 }
]), jobCtrl.applyToJob);

// Company Routes
router.post('/', mockAuth, jobCtrl.createJob);
router.put('/:id/close', mockAuth, jobCtrl.closeJob);
router.put('/:id/applicants/:userId/status', mockAuth, jobCtrl.updateApplicantStatus);

module.exports = router;