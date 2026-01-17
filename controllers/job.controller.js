const jobService = require('../services/job.service');
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await jobService.getAllJobs(req.query);
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getPublicCompanyJobs = async (req, res) => {
  try {
    const { companyId } = req.params;

    const jobs = await jobService.getCompanyJobsByCompanyId(companyId, {
      onlyActive: true, 
    });

    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching public company jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company jobs",
    });
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
exports.applyToJob = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
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
    const result = await jobService.applyToJob(req.params.id, req.user.id, applicationData);
    res.status(201).json({
      message: 'Application submitted successfully',
      aiScore: result.applicant.score,
      matchPercentage: result.applicant.matchPercentage,
      aiFeedback: result.applicant.aiFeedback
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.createJob = async (req, res) => {
  try {
    const { generateWithAI, ...jobData } = req.body;
    
    const dataToSend = {
      ...jobData,
      generateWithAI: generateWithAI === 'true' || generateWithAI === true
    };
    
    const job = await jobService.createJob(req.user.id, dataToSend);
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.closeJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const companyId = req.user.id;

    const job = await jobService.closeJob(jobId, companyId);

    res.json({
      success: true,
      message: "Job closed successfully",
      job,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
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
