const Groq = require('groq-sdk');
const User = require('../models/User.model');
const Company = require('../models/Company.model');

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
async function generateApplicantScore(userProfile, jobDetails, maxTokens = 500) {
  if (!userProfile || !jobDetails) {
    return { score: 0, feedback: "Insufficient data for evaluation" };
  }

  const prompt = `
You are an expert HR AI assistant specializing in candidate evaluation for ${jobDetails.companyName || 'a company'}.
Evaluate the candidate for the position: "${jobDetails.title}"

JOB DETAILS:
- Title: ${jobDetails.title}
- Description: ${jobDetails.description}
- Requirements: ${jobDetails.requirements || 'Not specified'}
- Required Skills: ${jobDetails.skillsRequired ? jobDetails.skillsRequired.join(', ') : 'Not specified'}
- Experience Level: ${jobDetails.experienceLevel || 'Not specified'}
- Type: ${jobDetails.type}
- Location: ${jobDetails.location}

CANDIDATE PROFILE:
${formatUserProfileForAI(userProfile)}

EVALUATION CRITERIA:
1. Skills Match (0-30 points): How well do the candidate's skills align with job requirements?
2. Experience Relevance (0-25 points): Does their experience match the job level and type?
3. Education & Certifications (0-20 points): Are their qualifications appropriate?
4. Project Portfolio (0-15 points): Quality and relevance of projects
5. Overall Potential (0-10 points): Growth potential and cultural fit

INSTRUCTIONS:
1. Analyze the candidate profile against the job requirements
2. Assign a score from 0-100
3. Provide specific, actionable feedback
4. Highlight strengths and areas for improvement
5. Return ONLY a JSON object with this exact structure:
{
  "score": number (0-100),
  "matchPercentage": number (0-100),
  "feedback": "string (detailed feedback)",
  "strengths": ["array", "of", "strengths"],
  "improvements": ["array", "of", "areas", "for", "improvement"],
  "recommendation": "string (Hire/Consider/Reject with reasoning)"
}
  `;

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, 
      max_tokens: maxTokens,
      top_p: 0.9,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content.trim());
    
    if (result.score > 100) result.score = 100;
    if (result.score < 0) result.score = 0;
    if (result.matchPercentage > 100) result.matchPercentage = 100;
    if (result.matchPercentage < 0) result.matchPercentage = 0;
    
    return result;
    
  } catch (err) {
    console.error("Groq API error in generateApplicantScore:", err);
    
    const fallbackScore = calculateFallbackScore(userProfile, jobDetails);
    return {
      score: fallbackScore,
      matchPercentage: fallbackScore,
      feedback: "AI evaluation unavailable. Score based on keyword matching.",
      strengths: ["Profile available for manual review"],
      improvements: ["Consider adding more details to your profile"],
      recommendation: "Manual review required"
    };
  }
}
function formatUserProfileForAI(user) {
  if (!user) return "No profile data available";
  
  return `
Name: ${user.firstName || ''} ${user.lastName || ''}
Headline: ${user.headline || 'Not specified'}
Location: ${user.location || 'Not specified'}
About: ${user.about || 'Not specified'}

EDUCATION:
${user.education && user.education.length > 0 
  ? user.education.map(edu => 
      `- ${edu.school || 'Unknown'}: ${edu.degree || ''} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''} (${edu.startDate || '?'} - ${edu.endDate || 'Present'})`
    ).join('\n')
  : 'No education listed'}

EXPERIENCE:
${user.experiences && user.experiences.length > 0 
  ? user.experiences.map(exp => 
      `- ${exp.title || 'Unknown'} at ${exp.company || 'Unknown'} (${exp.startDate || '?'} - ${exp.endDate || 'Present'}): ${exp.description || 'No description'}`
    ).join('\n')
  : 'No experience listed'}

SKILLS:
${user.skills && user.skills.length > 0 
  ? user.skills.map(skill => skill.name).join(', ')
  : 'No skills listed'}

PROJECTS:
${user.projects && user.projects.length > 0 
  ? user.projects.map(proj => 
      `- ${proj.title || 'Untitled'}: ${proj.technologies ? `Technologies: ${proj.technologies.join(', ')}` : ''} ${proj.link ? `Link: ${proj.link}` : ''}`
    ).join('\n')
  : 'No projects listed'}

CERTIFICATIONS:
${user.certificates && user.certificates.length > 0 
  ? user.certificates.map(cert => 
      `- ${cert.name || 'Unknown'} (${cert.obtainedAt || 'Date unknown'})`
    ).join('\n')
  : 'No certifications listed'}
  `;
}
function calculateFallbackScore(user, job) {
  let score = 50; 
  
  if (!user || !job) return score;
  if (user.skills && job.skillsRequired) {
    const userSkills = user.skills.map(s => s.name.toLowerCase());
    const requiredSkills = job.skillsRequired.map(s => s.toLowerCase());
    
    const matchedSkills = userSkills.filter(skill => 
      requiredSkills.some(reqSkill => skill.includes(reqSkill) || reqSkill.includes(skill))
    );
    
    if (requiredSkills.length > 0) {
      const skillMatchPercentage = (matchedSkills.length / requiredSkills.length) * 30;
      score += skillMatchPercentage;
    }
  }
  if (user.experiences && user.experiences.length > 0) {
    const totalExperienceMonths = user.experiences.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return total + Math.max(0, months);
    }, 0);
    
    if (totalExperienceMonths > 60) score += 20; 
    else if (totalExperienceMonths > 36) score += 15; 
    else if (totalExperienceMonths > 12) score += 10; 
  }
  if (user.education && user.education.length > 0) {
    const hasHigherEducation = user.education.some(edu => 
      ['master', 'phd', 'doctorate'].some(term => 
        (edu.degree || '').toLowerCase().includes(term)
      )
    );
    if (hasHigherEducation) score += 10;
  }
  return Math.min(Math.round(score), 100);
}
async function updateAllApplicantScores(jobId) {
  try {
    const JobOffer = require('../models/JobOffer.model');
    const job = await JobOffer.findById(jobId)
      .populate('companyId', 'name')
      .populate('applicants.userId');
    
    if (!job || !job.applicants || job.applicants.length === 0) {
      return { updated: 0, failed: 0 };
    }
    
    let updated = 0;
    let failed = 0;
    
    for (const applicant of job.applicants) {
      try {
        if (!applicant.userId || typeof applicant.userId === 'string') continue;
        
        const user = await User.findById(applicant.userId).lean();
        if (!user) continue;
        
        const jobDetails = {
          title: job.title,
          description: job.description,
          requirements: job.requirements || '',
          skillsRequired: job.skillsRequired || [],
          experienceLevel: job.experienceLevel || 'mid',
          type: job.type,
          location: job.location,
          companyName: job.companyId?.name || 'Unknown Company'
        };
        
        const aiEvaluation = await generateApplicantScore(user, jobDetails);
        applicant.score = aiEvaluation.score;
        applicant.matchPercentage = aiEvaluation.matchPercentage || aiEvaluation.score;
        applicant.aiFeedback = aiEvaluation.feedback || '';
        
        updated++;
        
      } catch (err) {
        console.error(`Failed to score applicant ${applicant.userId}:`, err);
        failed++;
      }
    }
    
    await job.save();
    
    return { updated, failed };
    
  } catch (err) {
    console.error("Error in updateAllApplicantScores:", err);
    return { updated: 0, failed: 0 };
  }
}

module.exports = {
  generateApplicantScore,
  updateAllApplicantScores,
  calculateFallbackScore
};
