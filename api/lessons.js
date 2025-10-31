const fs = require("fs");
const path = require("path");

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Handle specific lesson request
    const lessonId = req.query.id;
    const lessonsPath = path.join(process.cwd(), "api", "data", "lessons.json");

    if (!fs.existsSync(lessonsPath)) {
      // Fallback to development paths
      const devPath = path.join(
        process.cwd(),
        "vibing",
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

      // If lessonId is provided, return specific lesson
      if (lessonId) {
        const lesson = lessons.find((l) => l.id === lessonId);
        if (!lesson) {
          return res.status(404).json({ error: "Lesson not found" });
        }
        return res.status(200).json(lesson);
      }

      return res.status(200).json(lessons);
    }

    const lessonsData = fs.readFileSync(lessonsPath, "utf8");
    const lessons = JSON.parse(lessonsData);

    // If lessonId is provided, return specific lesson
    if (lessonId) {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      return res.status(200).json(lesson);
    }

    res.status(200).json(lessons);
  } catch (error) {
    console.error("Error loading lessons:", error);
    res.status(500).json({ error: "Failed to load lessons" });
  }
}
