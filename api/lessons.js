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

  // Handle specific lesson request
  const lessonId = req.query.id || req.query.lessonId;

  // Fallback lessons data
  const fallbackLessons = [
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

  let lessons = [];

  // Try to load lessons from JSON file
  try {
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
  } catch (fileLoadError) {
    console.warn("Could not load lessons from file, using embedded data:", fileLoadError.message);
    // Use the full lessons data instead of just fallback
    lessons = [
      {
        "id": "html-intro",
        "title": "HTML Introduction",
        "category": "HTML",
        "difficulty": "Beginner",
        "duration": "25 minutes",
        "summary": "Learn the basics of HTML structure, tags, and elements.",
        "description": "HTML (HyperText Markup Language) is the foundation of web development. In this lesson, you'll learn about HTML structure, basic tags, elements, attributes, and how to create your first webpage.",
        "slides": [
          {
            "id": 1,
            "title": "What is HTML?",
            "content": "<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the foundation of web development.</p><p>It's the standard markup language for creating web pages and web applications.</p><p>HTML provides the structure and content of web pages.</p>",
            "type": "content"
          },
          {
            "id": 2,
            "title": "HTML Structure",
            "content": "<h2>HTML Structure</h2><p>HTML describes the structure of a web page using markup.</p><div class='code-example'><code><h1>Hello World</h1></code></div>",
            "type": "content"
          }
        ],
        "learningObjectives": [
          "Understand what HTML is and its purpose",
          "Learn basic HTML structure and syntax",
          "Identify HTML elements, tags, and attributes",
          "Use common HTML tags appropriately",
          "Create well-structured HTML documents",
          "Follow HTML best practices"
        ]
      },
      {
        "id": "html-structure",
        "title": "HTML Document Structure",
        "category": "HTML",
        "difficulty": "Beginner",
        "duration": "30 minutes",
        "summary": "Learn about HTML document structure, semantic elements, and proper organization.",
        "description": "Understanding the proper structure of an HTML document is crucial for creating well-formed, accessible, and SEO-friendly web pages.",
        "learningObjectives": [
          "Understand HTML document structure and hierarchy",
          "Learn about DOCTYPE declarations and head section",
          "Use semantic HTML elements appropriately",
          "Create accessible and SEO-friendly documents",
          "Implement proper navigation structures"
        ]
      },
      {
        "id": "html-links-images",
        "title": "Links and Images",
        "category": "HTML",
        "difficulty": "Beginner",
        "duration": "35 minutes",
        "summary": "Master links, images, and media elements in HTML.",
        "description": "Links and images are essential for creating engaging, interactive web pages. Learn about different types of links, image optimization, and accessibility best practices.",
        "learningObjectives": [
          "Create different types of hyperlinks",
          "Add images with proper attributes and optimization",
          "Implement responsive images",
          "Use semantic elements for media content",
          "Follow accessibility best practices for links and images"
        ]
      },
      {
        "id": "css-intro",
        "title": "CSS Introduction",
        "category": "CSS",
        "difficulty": "Beginner",
        "duration": "30 minutes",
        "summary": "Master CSS fundamentals, selectors, and styling techniques.",
        "description": "CSS (Cascading Style Sheets) controls the visual appearance of your web pages. Learn about CSS syntax, selectors, the cascade, inheritance, and how to create beautiful, responsive designs.",
        "learningObjectives": [
          "Understand CSS purpose and benefits",
          "Master CSS syntax and selectors",
          "Learn about the cascade, specificity, and inheritance",
          "Apply the box model and common properties",
          "Use appropriate CSS units",
          "Connect CSS to HTML documents"
        ]
      },
      {
        "id": "css-colors-fonts",
        "title": "Colors and Fonts",
        "category": "CSS",
        "difficulty": "Beginner",
        "duration": "35 minutes",
        "summary": "Master advanced colors, typography, and text styling in CSS.",
        "description": "Learn advanced color techniques, web fonts, text formatting, and create professional typography for modern web design.",
        "learningObjectives": [
          "Master advanced color techniques and accessibility",
          "Implement web fonts and typography best practices",
          "Apply advanced font and text properties",
          "Use CSS custom properties for maintainable styles",
          "Create responsive typography",
          "Design accessible color schemes"
        ]
      },
      {
        "id": "css-layout",
        "title": "CSS Layout Basics",
        "category": "CSS",
        "difficulty": "Beginner",
        "duration": "40 minutes",
        "summary": "Master modern CSS layout techniques including Flexbox, Grid, and responsive design.",
        "description": "Learn advanced CSS layout methods to create professional, responsive web designs. Master Flexbox, CSS Grid, positioning, and modern layout techniques.",
        "learningObjectives": [
          "Master CSS Grid and Flexbox layout systems",
          "Apply advanced positioning techniques",
          "Create responsive layouts with modern CSS",
          "Use calc() and other CSS functions for dynamic layouts",
          "Implement mobile-first responsive design",
          "Combine multiple layout methods effectively"
        ]
      },
      {
        "id": "javascript-intro",
        "title": "JavaScript Introduction",
        "category": "JavaScript",
        "difficulty": "Beginner",
        "duration": "45 minutes",
        "summary": "Master JavaScript fundamentals, DOM manipulation, and interactive programming.",
        "description": "JavaScript is the programming language that powers modern web applications. Learn about variables, functions, events, DOM manipulation, and how to create dynamic, interactive web experiences.",
        "learningObjectives": [
          "Understand JavaScript's role in web development",
          "Master basic syntax and programming concepts",
          "Work with variables, data types, and operators",
          "Create and use functions effectively",
          "Manipulate the DOM to change page content",
          "Handle events to create interactive experiences",
          "Follow JavaScript best practices"
        ]
      },
      {
        "id": "javascript-variables",
        "title": "Variables and Data Types",
        "category": "JavaScript",
        "difficulty": "Beginner",
        "duration": "40 minutes",
        "summary": "Master JavaScript variables, data types, and advanced data structures.",
        "description": "Deep dive into JavaScript variables, primitive and reference types, arrays, objects, and modern ES6+ features for data manipulation.",
        "learningObjectives": [
          "Master variable declaration with let, const, and var",
          "Understand all JavaScript data types and their characteristics",
          "Work with arrays and array methods effectively",
          "Create and manipulate objects and their properties",
          "Use modern ES6+ features like destructuring and spread/rest",
          "Apply type coercion and conversion appropriately",
          "Implement template literals for string manipulation"
        ]
      },
      {
        "id": "javascript-functions",
        "title": "Functions and Events",
        "category": "JavaScript",
        "difficulty": "Beginner",
        "duration": "35 minutes",
        "summary": "Master JavaScript functions, events, and advanced programming concepts.",
        "description": "Deep dive into function creation, event handling, asynchronous programming, and modern JavaScript patterns for building interactive web applications.",
        "learningObjectives": [
          "Master different function declaration and expression types",
          "Implement advanced event handling and delegation",
          "Work with asynchronous JavaScript using promises and async/await",
          "Apply error handling and debugging techniques",
          "Use modern JavaScript patterns and features",
          "Optimize code performance and user experience",
          "Create interactive quiz games with functions and events"
        ]
      }
    ];
  }

  // Ensure lessons is an array
  if (!Array.isArray(lessons) || lessons.length === 0) {
    console.warn("Lessons is not a valid array, using fallback lessons");
    lessons = fallbackLessons;
  }

  // If lessonId is provided, return specific lesson
  if (lessonId) {
    console.log("Looking for lesson with ID:", lessonId);
    const lesson = lessons.find((l) => l && l.id === lessonId);
    if (!lesson) {
      // Try fallback lessons if not found in loaded lessons
      const fallbackLesson = fallbackLessons.find((l) => l && l.id === lessonId);
      if (fallbackLesson) {
        return res.status(200).json(fallbackLesson);
      }
      return res.status(404).json({ error: "Lesson not found", id: lessonId });
    }
    return res.status(200).json(lesson);
  }

  // Return all lessons
  return res.status(200).json(lessons);
};
