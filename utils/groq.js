const Groq = require('groq-sdk'); 
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
async function generatePostContent(content, maxTokens = 300) {
  if (!content || content.trim() === "") return "";

  const prompt = `
You are an expert social media assistant.
Enhance the following post for clarity, engagement, and readability.
Keep it professional but appealing.

POST CONTENT:
"${content}"

Return only the enhanced content.
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
    console.error("Groq API error:", err);
    return content;
  }
}

module.exports = { generatePostContent };
