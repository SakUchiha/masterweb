// Vercel Serverless Function
const fs = require("fs");
const path = require("path");

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

  try {
    // Handle specific lesson request
    const lessonId = req.query.id || req.query.lessonId;

    // Try to load lessons from JSON file first
    let lessons = [];
    try {
      // Try multiple methods to load lessons.json
      // Method 1: Try require (works best in Vercel serverless)
      try {
        lessons = require("./data/lessons.json");
        console.log(`Successfully loaded ${lessons.length} lessons using require`);
      } catch (requireError) {
        // Method 2: Try fs.readFileSync with multiple paths
        const possiblePaths = [
          path.join(__dirname, "data", "lessons.json"),
          path.join(process.cwd(), "api", "data", "lessons.json"),
          path.join(process.cwd(), "lessons.json"),
        ];

        let lessonsPath = null;
        for (const testPath of possiblePaths) {
          try {
            if (fs.existsSync(testPath)) {
              lessonsPath = testPath;
              break;
            }
          } catch (e) {
            // Continue to next path
          }
        }

        if (lessonsPath) {
          const lessonsData = fs.readFileSync(lessonsPath, "utf-8");
          lessons = JSON.parse(lessonsData);
          console.log(`Successfully loaded ${lessons.length} lessons from ${lessonsPath}`);
        } else {
          throw new Error("Lessons file not found in any expected location");
        }
      }
    } catch (error) {
      console.warn("Could not load lessons from file, using embedded data:", error.message);
      // Embedded lessons data (fallback)
      lessons = [
      {
        id: "html-intro",
        title: "HTML Introduction",
        category: "HTML",
        difficulty: "Beginner",
        duration: "25 minutes",
        summary: "Learn the basics of HTML structure, tags, and elements.",
        description:
          "HTML (HyperText Markup Language) is the foundation of web development. In this lesson, you'll learn about HTML structure, basic tags, elements, attributes, and how to create your first webpage.",
        slides: [
          {
            id: 1,
            title: "What is HTML?",
            content:
              "<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the foundation of web development.</p><p>It's the standard markup language for creating web pages and web applications.</p><p>HTML provides the structure and content of web pages.</p>",
            type: "content",
          },
          {
            id: 2,
            title: "HTML Structure",
            content:
              "<h2>HTML Structure</h2><p>HTML describes the structure of a web page using markup.</p><div class='code-example'><code>&lt;h1&gt;Hello World&lt;/h1&gt;</code></div>",
            type: "content",
          },
        ],
        learningObjectives: [
          "Understand what HTML is and its purpose",
          "Learn basic HTML structure and syntax",
          "Create well-structured HTML documents",
        ],
      },
      {
        id: "css-intro",
        title: "CSS Introduction",
        category: "CSS",
        difficulty: "Beginner",
        duration: "30 minutes",
        summary:
          "Learn CSS basics, including selectors, properties, and styling.",
        description:
          "CSS (Cascading Style Sheets) controls the visual appearance of web pages. Learn about CSS syntax, selectors, properties, and how to style your HTML.",
        slides: [
          {
            id: 1,
            title: "What is CSS?",
            content:
              "<h2>What is CSS?</h2><p>CSS stands for Cascading Style Sheets.</p><p>It controls the visual presentation of HTML elements.</p>",
            type: "content",
          },
        ],
        learningObjectives: [
          "Understand what CSS is and its purpose",
          "Learn CSS syntax and selectors",
          "Apply styles to HTML elements",
        ],
      },
    ];

    // Ensure lessons is an array
    if (!Array.isArray(lessons)) {
      console.warn("Lessons is not an array, using empty array");
      lessons = [];
    }

    // If lessonId is provided, return specific lesson
    if (lessonId) {
      console.log("Looking for lesson with ID:", lessonId);
      const lesson = lessons.find((l) => l && l.id === lessonId);
      if (!lesson) {
        return res
          .status(404)
          .json({ error: "Lesson not found", id: lessonId });
      }
      return res.status(200).json(lesson);
    }

    // Return all lessons
    return res.status(200).json(lessons || []);
  } catch (error) {
    console.error("Error serving lessons:", error);
    console.error("Error stack:", error.stack);
    
    // Return a proper error response
    return res.status(500).json({
      error: "Failed to serve lessons",
      details: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};
