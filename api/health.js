export default function handler(req, res) {
  // Simple health check endpoint for Uptime Robot / Better Stack
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
}