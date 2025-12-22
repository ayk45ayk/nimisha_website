export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  await new Promise(resolve => setTimeout(resolve, 1000));
  return res.status(200).json({ clientSecret: "mock_secret", status: "succeeded" });
}