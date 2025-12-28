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

// Helper function to extract keywords from text (Description/Title)
const extractKeywords = (text) => {
  if (!text) return [];
  return text.toLowerCase().split(/[\s,./?]+/).filter(w => w.length > 2);
};

exports.applyToJob = async (jobId, userId, applicationData) => {
  const job = await JobOffer.findById(jobId);
  if (!job || !job.isActive) throw new Error('Job not found or closed');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const alreadyApplied = job.applicants.some(a => a.userId.toString() === userId);
  if (alreadyApplied) throw new Error('Already applied');

  // --- SCORE CALCULATION LOGIC ---
  let score = 0;
  const jobKeywords = extractKeywords(`${job.title} ${job.description}`);

  // 1. Skills Match (40 pts)
  const userSkills = user.skills.map(s => s.name.toLowerCase());
  const matchedSkills = userSkills.filter(skill => jobKeywords.includes(skill));
  score += Math.min(40, matchedSkills.length * 10); 

  // 2. Experience Match (30 pts)
  if (user.experiences && user.experiences.length > 0) {
    const relevantExp = user.experiences.filter(exp => 
        jobKeywords.some(key => exp.title.toLowerCase().includes(key) || exp.description.toLowerCase().includes(key))
    );
    score += Math.min(30, relevantExp.length * 15);
  }

  // 3. Education Match (15 pts)
  const isRelevantEducation = user.education.some(edu => 
    jobKeywords.some(key => edu.fieldOfStudy?.toLowerCase().includes(key) || edu.degree.toLowerCase().includes(key))
  );
  if (isRelevantEducation) score += 15;

  // 4. Projects (10 pts)
  const relevantProjects = user.projects.filter(proj => 
    proj.technologies.some(tech => jobKeywords.includes(tech.toLowerCase()))
  );
  score += Math.min(10, relevantProjects.length * 5);

  // 5. Certificates (5 pts)
  if (user.certificates.length > 0) score += 5;

  // --- SAVE APPLICATION ---
  job.applicants.push({
    userId,
    resumeUrl: applicationData.resumeUrl,
    additionalAttachment: applicationData.additionalAttachment,
    score: score // Store the calculated score
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
// exports.applyToJob = async (jobId, userId, applicationData) => {
//   const job = await JobOffer.findById(jobId);
//   if (!job || !job.isActive) throw new Error('Job not found or closed');

//   const alreadyApplied = job.applicants.some(a => a.userId.toString() === userId);
//   if (alreadyApplied) throw new Error('Already applied');

//   job.applicants.push({
//     userId,
//     resumeUrl: applicationData.resumeUrl,
//     additionalAttachment: applicationData.additionalAttachment
//   });

//   await job.save();

//   // PROJET REQUIREMENT: Open a discussion
//   await Message.create({
//     senderId: userId,
//     receiverId: job.companyId,
//     content: `Hello, I've just applied for the "${job.title}" position. I'm looking forward to your feedback!`
//   });

//   return job;
// };

exports.updateApplicantStatus = async (jobId, applicantId, status) => {
  return await JobOffer.findOneAndUpdate(
    { _id: jobId, "applicants.userId": applicantId },
    { $set: { "applicants.$.status": status } },
    { new: true }
  );
};