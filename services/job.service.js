const JobOffer = require('../models/joboffer.model');
const Message = require('../models/message.model');

// Fix: Correct argument order (companyId first)
exports.createJob = async (companyId, data) => {
  return JobOffer.create({ ...data, companyId });
};

exports.getAllJobs = async (filters = {}) => {
  let query = { isActive: true };
  if (filters.location) query.location = new RegExp(filters.location, 'i');
  return JobOffer.find(query).sort({ createdAt: -1 }).populate('companyId', 'firstName lastName avatar');
};

exports.getJobById = async (jobId) => {
  return await JobOffer.findById(jobId).populate('companyId', 'firstName lastName email bio');
};

exports.applyToJob = async (jobId, userId, applicationData) => {
  const job = await JobOffer.findById(jobId);
  if (!job || !job.isActive) throw new Error('Job not found or closed');

  const alreadyApplied = job.applicants.some(a => a.userId.toString() === userId);
  if (alreadyApplied) throw new Error('Already applied');

  job.applicants.push({
    userId,
    resumeUrl: applicationData.resumeUrl,
    additionalAttachment: applicationData.additionalAttachment
  });

  await job.save();

  // PROJET REQUIREMENT: Open a discussion
  await Message.create({
    senderId: userId,
    receiverId: job.companyId,
    content: `Hello, I've just applied for the "${job.title}" position. I'm looking forward to your feedback!`
  });

  return job;
};

exports.updateApplicantStatus = async (jobId, applicantId, status) => {
  return await JobOffer.findOneAndUpdate(
    { _id: jobId, "applicants.userId": applicantId },
    { $set: { "applicants.$.status": status } },
    { new: true }
  );
};