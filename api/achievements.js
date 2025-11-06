// Vercel Serverless Function for Achievements
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
    // Unlock achievement
    return res.status(201).json({
      success: true,
      id: Math.random().toString(36).substr(2, 9),
      message: "Achievement unlocked (demo mode)"
    });
  }

  if (req.method === "GET") {
    // Get achievements for user
    const userId = req.query.userId;
    return res.status(200).json([
      {
        id: "first-lesson",
        achievement_type: "lesson",
        achievement_name: "First Steps",
        description: "Completed your first lesson",
        points: 50,
        unlocked_at: new Date().toISOString(),
        icon: "🎓"
      },
      {
        id: "html-master",
        achievement_type: "skill",
        achievement_name: "HTML Master",
        description: "Completed all HTML lessons",
        points: 100,
        unlocked_at: new Date().toISOString(),
        icon: "🏆"
      }
    ]);
  }

  return res.status(405).json({ error: "Method not allowed" });
};