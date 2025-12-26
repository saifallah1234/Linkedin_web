const JobOffer = require('../models/joboffer.model');

// Create job
exports.createJob = async (data, companyId) => {
  return JobOffer.create({
    ...data,
    companyId
  });
};

// Get all active jobs
exports.getAllJobs = async () => {
  return JobOffer.find({ isActive: true }).sort({ createdAt: -1 });
};

// Get job by ID
exports.getJobById = async (jobId) => {
  const job = await JobOffer.findById(jobId).populate('companyId');
  if (!job) throw new Error('Job not found');
  return job;
};

// Close job
exports.closeJob = async (jobId, companyId) => {
  const job = await JobOffer.findOneAndUpdate(
    { _id: jobId, companyId },
    { isActive: false },
    { new: true }
  );

  if (!job) throw new Error('Unauthorized or job not found');
  return job;
};

// Apply to job
exports.applyToJob = async (jobId, userId, applicationData) => {
  const job = await JobOffer.findById(jobId);
  if (!job) throw new Error('Job not found');

  if (!job.isActive) {
    throw new Error('Job offer is closed');
  }

  const alreadyApplied = job.applicants.some(
    (a) => a.userId.toString() === userId
  );

  if (alreadyApplied) {
    throw new Error('You already applied to this job');
  }

  job.applicants.push({
    userId,
    resumeUrl: applicationData.resumeUrl,
    additionalAttachment: applicationData.additionalAttachment
  });

  await job.save();
  return job;
};

// Update applicant status
exports.updateApplicantStatus = async (
  jobId,
  applicantId,
  status,
  score
) => {
  const job = await JobOffer.findById(jobId);
  if (!job) throw new Error('Job not found');

  const applicant = job.applicants.find(
    (a) => a.userId.toString() === applicantId
  );

  if (!applicant) throw new Error('Applicant not found');

  applicant.status = status;
  if (score !== undefined) applicant.score = score;

  await job.save();
  return job;
};
