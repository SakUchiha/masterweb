// Vercel Serverless Function for Progress Tracking
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    // Update progress
    return res.status(200).json({
      success: true,
      id: Math.random().toString(36).substr(2, 9),
      message: "Progress updated (demo mode)"
    });
  }

  if (req.method === "GET") {
    // Get progress for user
    const userId = req.query.userId;
    return res.status(200).json({
      userId: userId || "demo-user",
      lessonsCompleted: ["html-intro", "css-intro"],
      totalLessons: 9,
      currentStreak: 5,
      level: { level: 2, xp: 450, nextLevelXp: 1000 },
      timeSpent: 120, // minutes
      lastActivity: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};