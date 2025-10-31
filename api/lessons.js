// Vercel Edge Runtime
module.exports = async function handler(req, res) {
  // Enable CORS (using headers from vercel.json)
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT");
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
    const lessonId = req.query.id;

    // Embedded lessons data
    const lessons = [
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

    // If lessonId is provided, return specific lesson
    if (lessonId) {
      console.log("Looking for lesson with ID:", lessonId);
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        return res
          .status(404)
          .json({ error: "Lesson not found", id: lessonId });
      }
      return res.status(200).json(lesson);
    }

    return res.status(200).json(lessons);
  } catch (error) {
    console.error("Error serving lessons:", error);
    return res.status(500).json({
      error: "Failed to serve lessons",
      details: error.message,
    });
  }
};
