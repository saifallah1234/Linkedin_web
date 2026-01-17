const Groq = require('groq-sdk');
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
async function generateJobDescription(jobData, maxTokens = 500) {
  const { title, requirements, skillsRequired, experienceLevel, type, location, salaryRange } = jobData;
  
  const prompt = `
You are an expert HR and recruitment specialist. Create a compelling and professional job description based on the following details.

JOB DETAILS:
- Job Title: ${title || 'Not specified'}
- Requirements: ${requirements || 'Not specified'}
- Required Skills: ${skillsRequired?.join(', ') || 'Not specified'}
- Experience Level: ${experienceLevel || 'Not specified'}
- Job Type: ${type || 'Not specified'}
- Location: ${location || 'Not specified'}
- Salary Range: ${salaryRange || 'Not specified'}

Please generate a complete, well-structured job description that includes:
1. An engaging introduction/overview
2. Key responsibilities and duties
3. Required qualifications and skills
4. Preferred qualifications (if applicable)
5. What the company offers (benefits, culture, etc.)
6. A professional closing statement

Make it professional, engaging, and optimized for attracting qualified candidates.
Return only the generated job description.
  `;

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 1
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("Groq API error for job description:", err);
    return null;
  }
}
async function enhanceJobDescription(existingDescription, jobData, maxTokens = 300) {
  const prompt = `
You are an expert HR and recruitment specialist. Enhance the following job description to make it more professional, engaging, and effective at attracting qualified candidates.

EXISTING JOB DESCRIPTION:
"${existingDescription}"

ADDITIONAL JOB DETAILS:
- Job Title: ${jobData.title || 'Not specified'}
- Job Type: ${jobData.type || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}
- Salary Range: ${jobData.salaryRange || 'Not specified'}

Please enhance the description while:
1. Maintaining the original intent and requirements
2. Improving clarity and readability
3. Making it more engaging to potential candidates
4. Adding professional polish
5. Keeping it concise and to the point

Return only the enhanced job description.
  `;

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 1
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("Groq API error for enhancing description:", err);
    return existingDescription;
  }
}

module.exports = { generateJobDescription, enhanceJobDescription };