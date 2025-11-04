// Vercel Serverless Function for Session Tracking
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const sessionId = req.query.sessionId;

    if (sessionId) {
      // End session
      return res.status(200).json({
        success: true,
        message: "Session ended (demo mode)"
      });
    } else {
      // Start session
      return res.status(201).json({
        success: true,
        sessionId: Math.random().toString(36).substr(2, 9),
        message: "Session started (demo mode)"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};