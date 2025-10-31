const fs = require("fs");
const path = require("path");

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // In production, lessons.json should be in the api directory
    const lessonsPath = path.join(process.cwd(), "api", "data", "lessons.json");

    if (!fs.existsSync(lessonsPath)) {
      // Fallback to development paths
      const devPath = path.join(
        process.cwd(),
        "code-understanding-app",
        "backend",
        "server.js",
        "data",
        "lessons.json"
      );
      if (!fs.existsSync(devPath)) {
        return res.status(404).json({ error: "Lessons data not found" });
      }
      const lessonsData = fs.readFileSync(devPath, "utf8");
      const lessons = JSON.parse(lessonsData);
      return res.status(200).json(lessons);
    }

    const lessonsData = fs.readFileSync(lessonsPath, "utf8");
    const lessons = JSON.parse(lessonsData);
    res.status(200).json(lessons);
  } catch (error) {
    console.error("Error loading lessons:", error);
    res.status(500).json({ error: "Failed to load lessons" });
  }
}
