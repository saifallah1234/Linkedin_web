const express = require('express');
const router = express.Router();
const jobService = require('../services/job.service');

// ============================
// Apply to job (USER)
// POST /api/applications/:jobId
// ============================
router.post('/:jobId', async (req, res) => {
  try {
    const { userId, resumeUrl, additionalAttachment } = req.body;

    if (!userId || !resumeUrl) {
      return res.status(400).json({
        message: 'userId and resumeUrl are required'
      });
    }

    const job = await jobService.applyToJob(
      req.params.jobId,
      userId,
      { resumeUrl, additionalAttachment }
    );

    res.json(job);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ============================
// Get applicants for a job (COMPANY)
// GET /api/applications/:jobId
// ============================
router.get('/:jobId', async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.jobId);
    res.json(job.applicants);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
});

// ============================
// Update application status (COMPANY)
// PATCH /api/applications/:jobId/:applicantId
// ============================
router.patch('/:jobId/:applicantId', async (req, res) => {
  try {
    const { status, score } = req.body;

    const job = await jobService.updateApplicantStatus(
      req.params.jobId,
      req.params.applicantId,
      status,
      score
    );

    res.json(job);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
//with middlewares
// const express = require('express');
// const router = express.Router();
// const jobService = require('../services/job.service');
// const auth = require('../middlewares/auth.middleware');
// const role = require('../middlewares/role.middleware');

// // Apply to job (User)
// router.post('/:jobId', auth, role('USER'), async (req, res) => {
//   try {
//     const job = await jobService.applyToJob(
//       req.params.jobId,
//       req.user.id,
//       req.body
//     );
//     res.json(job);
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// });

// // Get applicants for a job (Company)
// router.get('/:jobId', auth, role('COMPANY'), async (req, res) => {
//   try {
//     const job = await jobService.getJobById(req.params.jobId);
//     res.json(job.applicants);
//   } catch (e) {
//     res.status(404).json({ message: e.message });
//   }
// });

// // Update application status (Company)
// router.patch('/:jobId/:applicantId', auth, role('COMPANY'), async (req, res) => {
//   try {
//     const { status, score } = req.body;
//     const job = await jobService.updateApplicantStatus(
//       req.params.jobId,
//       req.params.applicantId,
//       status,
//       score
//     );
//     res.json(job);
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// });

// module.exports = router;
