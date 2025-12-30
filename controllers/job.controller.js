const jobService = require('../services/job.service');

// --- PUBLIC / GENERAL ---

exports.getAllJobs = async (req, res) => {
  try {
    // Passes query params (like location or type) to the service for filtering
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
exports.getUserApplications = async (req, res) => {
    try {
        // req.user.id vient de votre mockAuth
        const applications = await jobService.getUserApplications(req.user.id);
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.applyToJob = async (req, res) => {
  try {
    const resumeFile = req.files?.resume?.[0];
    if (!resumeFile) return res.status(400).json({ message: 'Resume is required' });

    const attachmentFile = req.files?.additionalAttachment?.[0];
    let attachmentData = undefined;

    if (attachmentFile) {
      // Normalize path to use forward slashes for URL compatibility
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

    await jobService.applyToJob(req.params.id, req.user.id, applicationData);

    res.status(201).json({ message: 'Application submitted and discussion opened' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- COMPANY ACTIONS ---

// exports.createJob = async (req, res) => {
//   try {
//     const job = await jobService.createJob( req.user.id,req.body);
//     res.status(201).json(job);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };
// Dans controllers/job.controller.js

exports.createJob = async (req, res) => {
    // Étape de diagnostic : Regardez votre terminal après avoir cliqué
    console.log("Données brutes reçues (req.body):", req.body);

    try {
        // On prépare un objet UNIQUE qui contient tout
        const jobData = {
            ...req.body,           // Fusionne title, location, type, etc.
            companyId: req.user.id // Ajoute l'ID du mockAuth
        };

        const job = await jobService.createJob(jobData);
        res.status(201).json(job);
    } catch (err) {
        console.error("Erreur de validation complète:", err.errors);
        res.status(400).json({ message: err.message });
    }
};
exports.closeJob = async (req, res) => {
  try {
    // req.user.id is passed to ensure only the owner can close it
    const job = await jobService.closeJob(req.params.id, req.user.id);
    res.status(200).json({ message: "Job closed successfully", job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateApplicantStatus = async (req, res) => {
  try {
    const { id, userId } = req.params; // id = jobId, userId = applicantId
    const { status } = req.body;

    const updatedJob = await jobService.updateApplicantStatus(id, userId, status);
    res.status(200).json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};