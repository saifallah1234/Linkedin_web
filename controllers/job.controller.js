const jobService = require('../services/job.service');

// --- PUBLIC / GENERAL ---

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await jobService.getAllJobs(req.query);
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.status(200).json(job);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// --- APPLICANT ACTIONS ---

exports.applyToJob = async (req, res) => {
  try {
    const resumeFile = req.files?.resume?.[0];
    if (!resumeFile) return res.status(400).json({ message: 'Resume is required' });

    const attachmentFile = req.files?.additionalAttachment?.[0];
    let attachmentData = undefined;

    if (attachmentFile) {
      const normalizedPath = attachmentFile.path.replace(/\\/g, "/");

      attachmentData = {
        path: normalizedPath,
        type: attachmentFile.mimetype.startsWith('video/') ? 'video' : 
              attachmentFile.mimetype.startsWith('image/') ? 'image' : 'document'
      };
    }

    const applicationData = { 
      resumeUrl: resumeFile.path.replace(/\\/g, "/"), 
      additionalAttachment: attachmentData 
    };

    const job = await jobService.applyToJob(req.params.id, req.user.id, applicationData);

    res.status(201).json({ 
      message: 'Application submitted successfully',
      applicationId: job.applicants[job.applicants.length - 1]._id,
      aiScore: job.applicants[job.applicants.length - 1].score,
      matchPercentage: job.applicants[job.applicants.length - 1].matchPercentage
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- COMPANY ACTIONS ---

exports.createJob = async (req, res) => {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.closeJob = async (req, res) => {
  try {
    const job = await jobService.closeJob(req.params.id, req.user.id);
    res.status(200).json({ message: "Job closed successfully", job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateApplicantStatus = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status } = req.body;

    const updatedJob = await jobService.updateApplicantStatus(id, userId, status);
    res.status(200).json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- NEW AI SCORING ENDPOINTS ---

exports.getTopCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const candidates = await jobService.getTopCandidates(id, limit);
    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rescoreApplicants = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await jobService.rescoreApplicants(id);
    res.status(200).json({
      message: 'Applicants rescored successfully',
      updated: result.updated,
      failed: result.failed
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJobStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const statistics = await jobService.getJobStatistics(id);
    res.status(200).json(statistics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
