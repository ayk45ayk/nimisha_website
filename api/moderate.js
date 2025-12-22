import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server config error' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
    const result = await model.generateContent(`Analyze for hate speech/toxicity. Return 'SAFE' or 'UNSAFE'. Text: "${text}"`);
    const safetyVerdict = result.response.text().trim();

    return res.status(200).json({ safe: safetyVerdict === 'SAFE' });
  } catch (error) {
    return res.status(200).json({ safe: true }); // Fail open
  }
}