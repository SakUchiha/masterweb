// Vercel Serverless Function for Analytics
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = req.query.userId;

  if (req.url.includes('/lessons')) {
    // Lesson completion stats
    return res.status(200).json({
      totalLessons: 9,
      completedLessons: 3,
      averageCompletionTime: 25, // minutes
      popularLessons: [
        { id: "html-intro", completions: 45 },
        { id: "css-intro", completions: 38 },
        { id: "javascript-intro", completions: 32 }
      ],
      difficultyDistribution: {
        beginner: 60,
        intermediate: 30,
        advanced: 10
      }
    });
  }

  if (userId) {
    // User-specific analytics
    return res.status(200).json({
      userId: userId,
      totalTimeSpent: 180, // minutes
      lessonsCompleted: 3,
      averageScore: 85,
      streak: 5,
      achievements: 2,
      favoriteCategory: "HTML",
      lastActivity: new Date().toISOString(),
      progressByCategory: {
        HTML: { completed: 2, total: 3, percentage: 67 },
        CSS: { completed: 1, total: 3, percentage: 33 },
        JavaScript: { completed: 0, total: 3, percentage: 0 }
      }
    });
  }

  return res.status(404).json({ error: "Analytics endpoint not found" });
};