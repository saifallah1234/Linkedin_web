const express = require('express');
const router = express.Router();
const jobService = require('../services/job.service');

// Create job (TEMP: companyId from body)
router.post('/', async (req, res) => {
  try {
    const job = await jobService.createJob(
      req.body,
      req.body.companyId // TEMP
    );
    res.status(201).json(job);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Get all active jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await jobService.getAllJobs();
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json(job);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
});

// Close job (TEMP)
router.patch('/:id/close', async (req, res) => {
  try {
    const job = await jobService.closeJob(
      req.params.id,
      req.body.companyId // TEMP
    );
    res.json(job);
  } catch (e) {
    res.status(403).json({ message: e.message });
  }
});

module.exports = router;

//with middlewares
// const express = require('express');
// const router = express.Router();
// const jobService = require('../services/job.service');
// // const auth = require('../middlewares/auth.middleware');
// // const role = require('../middlewares/role.middleware');

// // Create job (Company)
// router.post('/', auth, role('COMPANY'), async (req, res) => {
//   try {
//     const job = await jobService.createJob(req.body, req.user.id);
//     res.status(201).json(job);
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// });

// // Get all active jobs (public)
// router.get('/', async (req, res) => {
//   try {
//     const jobs = await jobService.getAllJobs();
//     res.json(jobs);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // Get job by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const job = await jobService.getJobById(req.params.id);
//     res.json(job);
//   } catch (e) {
//     res.status(404).json({ message: e.message });
//   }
// });

// // Close job
// router.patch('/:id/close', auth, role('COMPANY'), async (req, res) => {
//   try {
//     const job = await jobService.closeJob(req.params.id, req.user.id);
//     res.json(job);
//   } catch (e) {
//     res.status(403).json({ message: e.message });
//   }
// });

// module.exports = router;
