const JobOffer = require('../models/JobOffer.model');
const Message = require('../models/message.model');
const User = require('../models/User.model');
const messageService = require('../services/message.service');
const notificationService = require('../services/notification.service');
const { generateJobDescription, enhanceJobDescription } = require('../utils/jobDescriptionAI');
const { generateApplicantScore, updateAllApplicantScores } = require('../utils/aiScoring');


exports.createJob = async (companyId, data) => {
  let finalDescription = data.description;
  const shouldUseAI = data.generateWithAI; 
    if (shouldUseAI) {
    try {
      if (!data.description || data.description.trim() === "") {
        const aiDescription = await generateJobDescription(data);
        if (aiDescription) {
          finalDescription = aiDescription;
        }
      } else {
        const enhancedDescription = await enhanceJobDescription(data.description, data);
        if (enhancedDescription) {
          finalDescription = enhancedDescription;
        }
      }
    } catch (aiError) {
      console.error('AI description generation failed:', aiError);
      
    }
  }
  return JobOffer.create({ 
    ...data, 
    companyId, 
    description: finalDescription,
    generateWithAI: undefined 
  });
};

exports.getAllJobs = async (filters = {}) => {
  let query = { isActive: true };
  if (filters.location) query.location = new RegExp(filters.location, 'i');
  if (filters.type) query.type = filters.type;
  if (filters.experienceLevel) query.experienceLevel = filters.experienceLevel;
  
  return JobOffer.find(query)
    .sort({ createdAt: -1 })
    .populate('companyId', 'name logo location website')
    .lean();
};

exports.getJobById = async (jobId) => {
  return await JobOffer.findById(jobId)
    .populate('companyId', 'name logo location website description')
    .populate('applicants.userId', 'firstName lastName image headline location');
};
exports.applyToJob = async (jobId, userId, applicationData) => {
  const job = await JobOffer.findById(jobId);
  if (!job || !job.isActive) throw new Error('Job not found or closed');
  console.log('Applying user:', userId, 'to job:', jobId);
  console.log('UserId type:', typeof userId);
  console.log('Current applicants count:', job.applicants.length);
  job.applicants.forEach((app, index) => {
  console.log(`Applicant ${index}: userId=${app.userId.toString()}, match=${app.userId.toString() === userId}`);
});
  const alreadyApplied = job.applicants.some(a => a.userId.toString() === userId.toString());
  if (alreadyApplied) throw new Error('Already applied to this job');
  // Get user profile for AI scoring
  const user = await User.findById(userId)
    .select('firstName lastName headline location about experiences skills education projects certificates')
    .lean();

  if (!user) throw new Error('User not found');

  const jobDetails = {
    title: job.title,
    description: job.description,
    requirements: job.requirements || '',
    skillsRequired: job.skillsRequired || [],
    experienceLevel: job.experienceLevel || 'mid',
    type: job.type,
    location: job.location,
    companyName: 'Unknown Company' 
  };

  let aiScore = 0;
  let aiFeedback = '';
  let matchPercentage = 0;
  
  try {
    const aiEvaluation = await generateApplicantScore(user, jobDetails);
    aiScore = aiEvaluation.score;
    aiFeedback = aiEvaluation.feedback || '';
    matchPercentage = aiEvaluation.matchPercentage || aiScore;
  } catch (aiError) {
    console.error('AI scoring failed, using fallback:', aiError);
    const { calculateFallbackScore } = require('../utils/aiScoring');
    aiScore = calculateFallbackScore(user, jobDetails);
    matchPercentage = aiScore;
    aiFeedback = 'AI evaluation temporarily unavailable. Score based on profile matching.';
  }

  job.applicants.push({
    userId,
    resumeUrl: applicationData.resumeUrl,
    additionalAttachment: applicationData.additionalAttachment,
    score: aiScore,
    matchPercentage: matchPercentage,
    aiFeedback: aiFeedback,
    appliedAt: new Date()
  });

  await job.save();

  
  try {
      await messageService.sendMessage(
        userId.toString(),
        job.companyId.toString(),
        `Hello, I've just applied for the "${job.title}" position.`,
        [],
        'User',
        'Company'
  );
  } catch (msgError) {
    console.error('Failed to send application message:', msgError);
  }

  try {
      await notificationService.createNotification(
        { id: job.companyId.toString(), type: 'Company' },
        { id: userId.toString(), type: 'User' },
        'job_application',
        
        { id: job._id.toString(), type: 'JobOffer' } 
      );
  } catch (notifError) {
      console.error('Failed to create notification:', notifError);
  }
  
 
  return {
    jobId: job._id,
    applicant: job.applicants[job.applicants.length - 1]
  };
};
exports.updateApplicantStatus = async (jobId, applicantId, status) => {
  return await JobOffer.findOneAndUpdate(
    { _id: jobId, "applicants.userId": applicantId },
    { $set: { "applicants.$.status": status } },
    { new: true }
  );
};

exports.closeJob = async (jobId, companyId) => {

  const job = await JobOffer.findById(jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.companyId.toString() !== companyId.toString()) {
    throw new Error("Unauthorized");
  }

  if (!job.isActive) {
    throw new Error("Job already closed");
  }

  job.isActive = false;
  job.status = "closed";
  await job.save();

  return job;
};
exports.getTopCandidates = async (jobId, limit = 10) => {
  const job = await JobOffer.findById(jobId)
    .populate({
      path: 'applicants.userId',
      select: 'firstName lastName image headline location experiences skills'
    })
    .lean();

  if (!job || !job.applicants) return [];

  const sortedApplicants = [...job.applicants]
    .filter(app => app.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return sortedApplicants;
};


exports.rescoreApplicants = async (jobId) => {
  const result = await updateAllApplicantScores(jobId);
  return result;
};


exports.getJobStatistics = async (jobId) => {
  const job = await JobOffer.findById(jobId).lean();
  
  if (!job) return null;
  
  const applicants = job.applicants || [];
  const scores = applicants.map(app => app.score).filter(score => score > 0);
  
  return {
    totalApplications: applicants.length,
    scoredApplications: scores.length,
    averageScore: scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    statusDistribution: {
      pending: applicants.filter(app => app.status === 'pending').length,
      accepted: applicants.filter(app => app.status === 'accepted').length,
      rejected: applicants.filter(app => app.status === 'rejected').length
    }
  };
};


exports.getCompanyJobsByCompanyId = async (companyId, options = {}) => {
  const query = {
    companyId,
  };

  
  if (options.onlyActive) {
    query.isActive = true;
  }

  return JobOffer.find(query)
    .sort({ createdAt: -1 })
    .populate("companyId", "name logo location")
    .lean();
};

