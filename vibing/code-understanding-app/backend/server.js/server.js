  // Core Node.js modules
const path = require('path');
const fs = require('fs');

// Third-party dependencies
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
const localEnvPath = path.resolve(__dirname, '.env');

if (process.env.NODE_ENV !== 'production') {
  // In development, load from .env file
  const result = dotenv.config({ path: localEnvPath });

  if (result.error) {
    console.warn('⚠️  Running without .env file. Using environment variables from Vercel.');
  }
}

// In production, attempt to hydrate key from local .env if not supplied by host (useful for previews)
if (process.env.NODE_ENV === 'production' && !process.env.GROQ_API_KEY && fs.existsSync(localEnvPath)) {
  const result = dotenv.config({ path: localEnvPath, override: false });
  if (!result.error) {
    console.log('Loaded GROQ_API_KEY from local .env file in production environment.');
  }
}

// In production, Vercel will inject the environment variables

// Validate required environment variables
const requiredEnvVars = ['GROQ_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Add diagnostic logging for environment variables (without exposing sensitive data)
console.log('SERVER: Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  GROQ_API_KEY: process.env.GROQ_API_KEY ? 'Present (length: ' + process.env.GROQ_API_KEY.length + ')' : 'Missing',
  VERCEL: process.env.VERCEL,
  requiredVars: requiredEnvVars,
  missingVars: missingVars
});

// For Vercel, don't require API key - use fallback responses
if (missingVars.length > 0) {
  if (process.env.VERCEL) {
    console.warn('⚠️  Running on Vercel without GROQ_API_KEY - using fallback AI responses');
  } else {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.warn('⚠️  AI features will be disabled. Application will continue with fallback responses.');
  }
  // Don't exit in production - allow app to run with limited functionality
}
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cors = require("cors");
const models = require("./models");
const app = express();
// Only initialize socket.io for non-Vercel environments
let io = null;
if (!process.env.VERCEL) {
  const { createServer } = require("http");
  const { Server } = require("socket.io");
  const server = createServer(app);
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
}

// Disable caching for all routes in development
app.use((req, res, next) => {
  // Check if request is for static files (CSS, JS, HTML)
  const isStaticFile = /\.(css|js|html)$/.test(req.path);

  if (isStaticFile) {
    // Aggressive cache-busting for static files in development
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    // Add additional headers to prevent browser caching
    res.set('Surrogate-Control', 'no-store');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0');
  } else {
    // Standard no-cache for other routes
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

const frontendDir = path.join(__dirname, "../../frontend");
const distDir = path.join(__dirname, "../../dist");
const staticDir = frontendDir; // Always use frontend directory for single port setup

// Serve static files from the compiled directory when available
app.use(express.static(staticDir, {
  etag: false,
  lastModified: false,
  index: false, // Prevent serving index.html for directories
  // Additional cache-busting options for development
  setHeaders: (res, path) => {
    if (/\.(css|js|html)$/.test(path)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// For single port setup, also serve static files at root level
app.use('/', express.static(staticDir, {
  etag: false,
  lastModified: false,
  index: false,
  // Additional cache-busting options for development
  setHeaders: (res, path) => {
    if (/\.(css|js|html)$/.test(path)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Route handlers for HTML pages
const pages = [
  'index.html',
  'lessons.html',
  'lesson-viewer.html',
  'study-guide.html',
  'editor.html',
  'ai.html',
  'code-explainer.html',
  'contact.html'
];

// Serve HTML pages
pages.forEach(page => {
  const route = page === 'index.html' ? '/' : `/${page.replace('.html', '')}`;
  app.get(route, (req, res) => {
    res.sendFile(path.join(staticDir, page));
  });
});

// Add catch-all route for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Handle 404 for HTML routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  const notFoundPath = path.join(staticDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    return res.status(404).sendFile(notFoundPath);
  }
  res.status(404).send('404 Not Found');
});

// Advanced caching system for API responses
const responseCache = new Map();
const CACHE_CONFIG = {
  lessons: { duration: 10 * 60 * 1000, maxSize: 50 }, // 10 minutes, max 50 entries
  health: { duration: 2 * 60 * 1000, maxSize: 10 }, // 2 minutes, max 10 entries
  default: { duration: 5 * 60 * 1000, maxSize: 100 }, // 5 minutes, max 100 entries
};

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  size: 0,
};

// Enhanced cache middleware with LRU eviction
function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;
  const endpoint = req.path.split("/")[2]; // Extract endpoint name
  const config = CACHE_CONFIG[endpoint] || CACHE_CONFIG.default;

  const cached = responseCache.get(key);

  if (cached && Date.now() - cached.timestamp < config.duration) {
    cacheStats.hits++;
    // Update access time for LRU
    cached.lastAccessed = Date.now();
    return res.json(cached.data);
  }

  cacheStats.misses++;

  // Store original send method
  const originalSend = res.json;
  res.json = function (data) {
    // Check cache size and evict if necessary
    if (responseCache.size >= config.maxSize) {
      evictLRU();
    }

    responseCache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      endpoint,
    });
    cacheStats.size = responseCache.size;

    originalSend.call(this, data);
  };

  next();
}

// LRU eviction function
function evictLRU() {
  let oldestKey = null;
  let oldestTime = Date.now();

  for (const [key, value] of responseCache) {
    if (value.lastAccessed < oldestTime) {
      oldestTime = value.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    responseCache.delete(oldestKey);
    cacheStats.evictions++;
  }
}

// Cache cleanup function
function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, value] of responseCache) {
    const config = CACHE_CONFIG[value.endpoint] || CACHE_CONFIG.default;
    if (now - value.timestamp > config.duration) {
      responseCache.delete(key);
      cacheStats.evictions++;
    }
  }
  cacheStats.size = responseCache.size;
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

// Configure CORS with specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow requests from Vercel deployment and local development
    const allowedOrigins = [
      /https?:\/\/vibing-.*\.vercel\.app$/,
      /https?:\/\/vibing\.vercel\.app$/,
      /https?:\/\/localhost:\d+$/
    ];

    // Check if the origin matches any of the allowed patterns
    if (allowedOrigins.some(regex => regex.test(origin))) {
      return callback(null, true);
    }

    // Reject requests from other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// User management endpoints
app.post("/api/users", async (req, res) => {
  try {
    const { username, email, password_hash } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const result = await models.createUser({ username, email, password_hash });
    res.status(201).json({ id: result.id, username, email });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.message.includes("UNIQUE constraint failed")) {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await models.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Don't return password hash
    const { password_hash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Progress tracking endpoints
app.post("/api/progress", async (req, res) => {
  try {
    const { user_id, lesson_id, completed, score, time_spent, attempts } =
      req.body;

    if (!lesson_id) {
      return res.status(400).json({ error: "Lesson ID is required" });
    }

    const result = await models.updateProgress({
      user_id,
      lesson_id,
      completed: completed || false,
      score: score || 0,
      time_spent: time_spent || 0,
      attempts: attempts || 1,
    });

    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

app.get("/api/progress/:userId", async (req, res) => {
  try {
    const progress = await models.getUserProgress(req.params.userId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// Achievement endpoints
app.post("/api/achievements", async (req, res) => {
  try {
    const { user_id, achievement_type, achievement_name, description, points } =
      req.body;

    if (!user_id || !achievement_type || !achievement_name) {
      return res
        .status(400)
        .json({ error: "User ID, achievement type, and name are required" });
    }

    const result = await models.unlockAchievement({
      user_id,
      achievement_type,
      achievement_name,
      description,
      points: points || 0,
    });

    res.status(201).json({ success: true, id: result.id });
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    if (error.message.includes("UNIQUE constraint failed")) {
      res.status(409).json({ error: "Achievement already unlocked" });
    } else {
      res.status(500).json({ error: "Failed to unlock achievement" });
    }
  }
});

app.get("/api/achievements/:userId", async (req, res) => {
  try {
    const achievements = await models.getUserAchievements(req.params.userId);
    res.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// Session tracking endpoints
app.post("/api/sessions/start", async (req, res) => {
  try {
    const { user_id, session_type, lesson_id } = req.body;

    if (!session_type) {
      return res.status(400).json({ error: "Session type is required" });
    }

    const result = await models.startSession({
      user_id,
      session_type,
      lesson_id,
    });
    res.status(201).json({ success: true, sessionId: result.id });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

app.post("/api/sessions/:sessionId/end", async (req, res) => {
  try {
    const { actions } = req.body;
    await models.endSession(req.params.sessionId, actions);
    res.json({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Analytics endpoints
app.get("/api/analytics/lessons", async (req, res) => {
  try {
    const stats = await models.getLessonCompletionStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching lesson stats:", error);
    res.status(500).json({ error: "Failed to fetch lesson statistics" });
  }
});

app.get("/api/analytics/users/:userId", async (req, res) => {
  try {
    const stats = await models.getUserStats(req.params.userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
});

// Get all lessons
app.get("/api/lessons", async (req, res) => {
  try {
    // Try to load lessons from JSON file first (for Vercel deployment)
    const lessonsPath = path.join(__dirname, 'data', 'lessons.json');
    let lessons;

    try {
      const lessonsData = require(lessonsPath);
      lessons = lessonsData;
      console.log(`Loaded ${lessons.length} lessons from JSON file`);
    } catch (fileError) {
      console.warn("Could not load lessons from JSON file:", fileError.message);

      // Fallback to database
      try {
        lessons = await models.getAllLessons();
        console.log(`Loaded ${lessons ? lessons.length : 0} lessons from database`);
      } catch (dbError) {
        console.warn("Database error:", dbError.message);
        lessons = [];
      }
    }

    // If no lessons from either source, use minimal defaults
    if (!lessons || lessons.length === 0) {
      lessons = [
        {
          id: "html-intro",
          title: "Introduction to HTML",
          category: "HTML",
          difficulty: "Beginner",
          duration: "15 minutes",
          summary: "Learn the basics of HTML structure and tags.",
          description: "HTML (HyperText Markup Language) is the foundation of web development. In this lesson, you'll learn about HTML structure, basic tags, and how to create your first webpage.",
          learningObjectives: [
            "Understand what HTML is and its purpose",
            "Learn basic HTML structure",
            "Create your first HTML page",
            "Use common HTML tags"
          ]
        }
      ];
      console.log("Using fallback lessons");
    }

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.json(lessons);
  } catch (error) {
    console.error("Error in lessons endpoint:", error);
    // Return minimal fallback on error
    res.json([{
      id: "error-fallback",
      title: "Lessons Temporarily Unavailable",
      category: "System",
      difficulty: "N/A",
      duration: "N/A",
      summary: "Please try again later.",
      description: "The lesson system is currently experiencing issues. Please refresh the page or try again later.",
      learningObjectives: ["System maintenance in progress"]
    }]);
  }
});

// Get one lesson
app.get("/api/lessons/:id", cacheMiddleware, async (req, res) => {
  try {
    // Try to load lesson from JSON file first (for Vercel deployment)
    const lessonsPath = path.join(__dirname, 'data', 'lessons.json');
    let lesson = null;

    try {
      const lessonsData = require(lessonsPath);
      lesson = lessonsData.find(l => l.id === req.params.id);
      if (lesson) {
        console.log(`Found lesson ${req.params.id} in JSON file`);
      }
    } catch (fileError) {
      console.warn("Could not load lesson from JSON file:", fileError.message);
    }

    // If not found in JSON, try database
    if (!lesson) {
      try {
        lesson = await models.getLessonById(req.params.id);
        if (lesson) {
          console.log(`Found lesson ${req.params.id} in database`);
        }
      } catch (dbError) {
        console.warn("Database error:", dbError.message);
      }
    }

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
});

// Groq health check endpoint
app.get("/api/groq/health", async (req, res) => {
  try {
    const hasKey = !!process.env.GROQ_API_KEY;
    if (!hasKey) {
      return res.status(503).json({
        status: "unhealthy",
        service: "not_configured",
        error: "Groq API key is missing",
        suggestions: [
          "Get Groq API key from https://console.groq.com/",
          "Add GROQ_API_KEY to backend .env file",
          "Restart the server",
        ],
      });
    }

    // Test Groq API with models endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let authResponse;
    try {
      authResponse = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      let errorMessage = "Groq API key validation failed";

      if (authResponse.status === 402) {
        errorMessage =
          "Groq account needs credits. Visit https://console.groq.com/";
      } else if (authResponse.status === 401) {
        errorMessage = "Invalid Groq API key. Please verify your key.";
      }

      return res.status(503).json({
        status: "unhealthy",
        service: "auth_failed",
        error: errorMessage,
        suggestions: [
          "Verify your Groq API key is correct",
          "Check Groq account status at https://console.groq.com/",
          "Add credits to your Groq account if needed",
          "Ensure your account is in good standing",
        ],
      });
    }

    const authData = await authResponse.json();

    return res.json({
      status: "healthy",
      service: "groq_configured",
      accountInfo: {
        rateLimits:
          authData.rate_limits || authData.data?.rate_limits || "unknown",
        modelsCount: authData.data?.length || 0,
      },
      availableModels: [
        "llama-3.1-8b-instant (recommended - fast and capable)",
        "llama-3.3-70b-versatile (more powerful)",
        "mixtral-8x7b-32768 (alternative option)",
        "gemma-7b-it (lightweight option)",
      ],
      recommendedModels: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
      modelAliases: {
        llama3: "llama-3.1-8b-instant",
        "llama3-8b": "llama-3.1-8b-instant",
        "llama3-70b": "llama-3.3-70b-versatile",
        "llama3.1": "llama-3.1-8b-instant",
        "llama3.1-8b": "llama-3.1-8b-instant",
        "llama3.1-70b": "llama-3.3-70b-versatile",
        "llama3.1-405b": "llama-3.3-70b-versatile",
        mixtral: "mixtral-8x7b-32768",
        gemma: "gemma-7b-it",
        auto: "llama-3.1-8b-instant",
      },
      professionalFeatures: [
        "Ultra-fast inference with Llama 3 models",
        "Professional code analysis and explanations",
        "Industry best practices and modern standards",
        "Advanced debugging assistance",
        "Real-time code suggestions and improvements",
      ],
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "error",
      error: error.message,
      suggestions: [
        "Check server logs for detailed error information",
        "Verify Groq API key format",
        "Check internet connectivity to Groq",
        "Visit https://status.groq.com for service status",
      ],
    });
  }
});

// ... (rest of the code remains the same)
// Helper to map model names to Groq models
function mapModel(model) {
  if (!model) return "llama-3.1-8b-instant"; // Use llama-3.1-8b-instant as default

  const map = {
    llama3: "llama-3.1-8b-instant",
    "llama3-8b": "llama-3.1-8b-instant",
    "llama3-70b": "llama-3.3-70b-versatile",
    "llama3.1": "llama-3.1-8b-instant",
    "llama3.1-8b": "llama-3.1-8b-instant",
    "llama3.1-70b": "llama-3.3-70b-versatile",
    "llama3.1-405b": "llama-3.3-70b-versatile", // fallback to 70b since 405b might not be available
    mixtral: "mixtral-8x7b-32768",
    gemma: "gemma-7b-it", // Updated to available model
    auto: "llama-3.1-8b-instant",
  };

  return map[model] || model;
}

// Input sanitization helper functions
function sanitizeString(input, maxLength = 10000) {
  if (typeof input !== "string") return "";
  // Remove null bytes and other potentially harmful characters
  return input.replace(/\0/g, "").substring(0, maxLength);
}

function validateLanguage(language) {
  const supportedLanguages = ["html", "css", "javascript"];
  return supportedLanguages.includes(String(language).toLowerCase());
}

// Request logging for AI interactions
function logAIRequest(req, type) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent") || "Unknown";

  console.log(`[${timestamp}] AI ${type} request from ${ip} (${userAgent})`);

  if (type === "chat" && req.body.messages) {
    console.log(`  Messages count: ${req.body.messages.length}`);
    console.log(`  Model: ${req.body.model || "default"}`);
    console.log(`  Response style: ${req.body.responseStyle || "normal"}`);
  } else if (type === "explanation") {
    console.log(`  Language: ${req.body.language}`);
    console.log(
      `  Code length: ${req.body.code ? req.body.code.length : 0} chars`
    );
  }
}

// Combined AI assistant and code explanation endpoint
app.post("/api/groq", async (req, res) => {
  const rawBody = req.body || {};
  const { messages, model, code, language, responseStyle = "normal" } = rawBody;
  const apiKey = process.env.GROQ_API_KEY;
  const demoModeEnabled = process.env.GROQ_DEMO_MODE === '1';

  // Determine if this is a code explanation request or chat request
  const isCodeExplanation =
    rawBody && "code" in rawBody && "language" in rawBody;

  // Enhanced input validation and sanitization
  if (isCodeExplanation) {
    // Sanitize and validate code explanation inputs
    const sanitizedCode = sanitizeString(code, 50000); // 50KB max for code
    const sanitizedLanguage = sanitizeString(language, 20);

    if (!sanitizedCode || !sanitizedLanguage) {
      return res.status(400).json({
        error: "Code and language are required for code explanation",
        code: "MISSING_PARAMETERS",
        suggestions: ["Provide both code and language parameters"],
      });
    }

    if (!validateLanguage(sanitizedLanguage)) {
      return res.status(400).json({
        error: "Unsupported language. Supported: html, css, javascript",
        code: "UNSUPPORTED_LANGUAGE",
        suggestions: ["Use one of: html, css, javascript"],
      });
    }

    // Replace with sanitized values
    req.body.code = sanitizedCode;
    req.body.language = sanitizedLanguage;

    // Log the request
    logAIRequest(req, "explanation");
  } else {
    // For chat requests, validate and sanitize messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages must be a non-empty array",
        code: "INVALID_MESSAGES",
        suggestions: ["Provide at least one message in the messages array"],
      });
    }

    if (messages.length > 50) {
      return res.status(400).json({
        error: "Too many messages. Maximum 50 messages allowed.",
        code: "TOO_MANY_MESSAGES",
        suggestions: ["Limit your conversation history to 50 messages or less"],
      });
    }

    const sanitizedMessages = [];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (!message || typeof message !== "object") {
        return res.status(400).json({
          error: `Message at index ${i} must be an object`,
          code: "INVALID_MESSAGE_FORMAT",
          suggestions: [
            "Each message must be an object with role and content properties",
          ],
        });
      }

      if (!message.role || !message.content) {
        return res.status(400).json({
          error: `Message at index ${i} must have role and content`,
          code: "INVALID_MESSAGE_FORMAT",
          suggestions: [
            "Each message must have both role and content properties",
          ],
        });
      }

      const sanitizedRole = sanitizeString(message.role, 20);
      const sanitizedContent = sanitizeString(message.content, 10000);

      if (!["user", "assistant", "system"].includes(sanitizedRole)) {
        return res.status(400).json({
          error: `Invalid role '${sanitizedRole}' in message ${i}. Must be user, assistant, or system`,
          code: "INVALID_ROLE",
          suggestions: [
            'Use only "user", "assistant", or "system" as message roles',
          ],
        });
      }

      if (!sanitizedContent) {
        return res.status(400).json({
          error: `Message ${i} content cannot be empty`,
          code: "EMPTY_MESSAGE_CONTENT",
          suggestions: ["Provide non-empty content for all messages"],
        });
      }

      sanitizedMessages.push({
        role: sanitizedRole,
        content: sanitizedContent,
      });
    }

    // Replace with sanitized messages
    req.body.messages = sanitizedMessages;

    // Validate response style
    const validStyles = ["brief", "normal", "detailed"];
    const sanitizedStyle = sanitizeString(responseStyle, 10);
    if (!validStyles.includes(sanitizedStyle)) {
      req.body.responseStyle = "normal"; // Default to normal
    } else {
      req.body.responseStyle = sanitizedStyle;
    }

    // Log the request
    logAIRequest(req, "chat");
  }

  // FREE GROQ AI - No API key required, always works
  try {
    // Check if API key is available, if not provide fallback explanations
    console.log("Chat API Key check:", apiKey ? "Present" : "Missing");
    console.log("Chat API Key length:", apiKey ? apiKey.length : "N/A");
    console.log(
      "Chat API Key starts with:",
      apiKey ? apiKey.substring(0, 4) : "N/A"
    );
    const missingOrInvalidKey = !apiKey || apiKey === "your_groq_api_key_here" || apiKey.length < 10;
    if (missingOrInvalidKey || demoModeEnabled) {
      console.log("Chat: Using fallback explanations (no API key or demo mode enabled)");
      return res.json({
        response: getFallbackExplanation(
          isCodeExplanation,
          code,
          language,
          responseStyle
        ),
        model: "fallback-explanation",
        fallback: true,
        note: missingOrInvalidKey
          ? "No API key configured"
          : "Demo mode enabled via GROQ_DEMO_MODE"
      });
    }

    console.log(
      "Chat: API key validation passed, proceeding with Groq API call"
    );

    // Response length control configuration
    const responseLengthMap = {
      brief: {
        max_tokens: 300,
        temperature: 0.2,
        instruction:
          "Keep response under 150 words. Focus on direct answer and working code example.",
      },
      normal: {
        max_tokens: 800,
        temperature: 0.3,
        instruction:
          "Provide balanced explanation with code examples and key concepts.",
      },
      detailed: {
        max_tokens: 1500,
        temperature: 0.4,
        instruction:
          "Give comprehensive explanation with multiple examples and best practices.",
      },
    };

    const lengthConfig =
      responseLengthMap[responseStyle] || responseLengthMap.normal;

    let requestBody;

    if (isCodeExplanation) {
      // Code explanation request
      const explanationPrompts = {
        html: `Explain this HTML code clearly and concisely.

Code: ${code}

${lengthConfig.instruction}

Focus on:
1. What the code does
2. Key HTML elements and their purpose
3. Structure and hierarchy
4. Any improvements or best practices

Keep it practical and include a working example.`,

        css: `Explain this CSS code clearly and concisely.

Code: ${code}

${lengthConfig.instruction}

Focus on:
1. What the styles do
2. Key properties and their effects
3. Layout and positioning concepts
4. Any improvements or best practices

Keep it practical and include a working example.`,

        javascript: `Explain this JavaScript code clearly and concisely.

Code: ${code}

${lengthConfig.instruction}

Focus on:
1. What the code does
2. Key functions, variables, and logic
3. How it executes step by step
4. Any improvements or best practices

Keep it practical and include a working example.`,
      };

      const systemPrompt = {
        role: "system",
        content: `You are Professor Groq, a senior software engineering educator with 15+ years of professional experience. You provide expert-level code analysis and explanations with a focus on industry best practices and modern development standards.

**PROFESSIONAL EXPERTISE:**
• Modern web development (HTML5, CSS3, ES6+ JavaScript)
• Professional coding standards and best practices
• Performance optimization and security considerations
• Industry conventions and maintainable code patterns
• Debugging methodologies and troubleshooting approaches

**RESPONSE QUALITY STANDARDS:**
• Provide accurate, production-ready code examples
• Explain concepts with professional terminology and context
• Focus on practical, job-ready solutions
• Include security and performance considerations
• Reference current industry standards (WCAG, W3C, etc.)
• Emphasize maintainable and scalable code patterns

**PROFESSIONAL TEACHING APPROACH:**
1. **Context Setting**: Explain why this code pattern matters professionally
2. **Technical Analysis**: Break down implementation details systematically
3. **Best Practices**: Highlight industry standards and conventions
4. **Practical Examples**: Provide copy-pasteable, professional code
5. **Common Pitfalls**: Discuss frequent mistakes and prevention strategies
6. **Performance/Security**: Include optimization and security considerations
7. **Testing**: Suggest validation and testing approaches
8. **Industry Relevance**: Connect to real-world professional applications

**RESPONSE STYLE:** ${lengthConfig.instruction}

Maintain a professional, authoritative tone while being encouraging and educational. Focus on practical skills that prepare students for professional software development careers.`,
      };

      const userPrompt = {
        role: "user",
        content: explanationPrompts[String(language).toLowerCase()],
      };

      requestBody = {
        model: mapModel(model) || "llama-3.1-8b-instant",
        messages: [systemPrompt, userPrompt],
        temperature: lengthConfig.temperature,
        max_tokens: lengthConfig.max_tokens,
      };
    } else {
      // Chat request - enhanced with professional system prompt
      const enhancedMessages = [
        {
          role: "system",
          content: `You are Professor Groq, a senior software engineering educator with 15+ years of professional experience. You specialize in teaching modern web development with a focus on professional best practices, clean code, and industry standards.

**PROFESSIONAL TEACHING METHODOLOGY:**
1. **Structured Learning**: Break down complex concepts into logical, sequential steps
2. **Industry Context**: Connect concepts to real-world professional applications
3. **Best Practices**: Emphasize modern standards (ES6+, semantic HTML5, CSS Grid/Flexbox)
4. **Code Quality**: Focus on maintainable, scalable, and efficient solutions
5. **Problem Solving**: Teach systematic debugging and troubleshooting approaches
6. **Professional Standards**: Reference industry conventions and coding standards
7. **Practical Application**: Provide production-ready examples and real-world use cases
8. **Security & Performance**: Include security considerations and performance optimization
9. **Accessibility**: Emphasize inclusive design and WCAG compliance
10. **Career Guidance**: Connect learning to professional development paths

**PROFESSIONAL RESPONSE STRUCTURE:**
1. **Acknowledge & Clarify**: Restate the question to confirm understanding
2. **Context Setting**: Explain why this concept matters in professional development
3. **Step-by-Step Breakdown**: Provide systematic explanation with reasoning
4. **Professional Examples**: Include well-commented, production-quality code
5. **Best Practices**: Highlight industry standards and conventions
6. **Common Pitfalls**: Discuss frequent mistakes and how to avoid them
7. **Testing & Validation**: Suggest testing approaches and validation methods
8. **Further Learning**: Recommend next steps and related concepts
9. **Professional Tips**: Share expert insights and optimization techniques
10. **Encouragement**: Motivate continued learning and professional growth

**PROFESSIONAL PERSONALITY:**
- Authoritative yet approachable, like a senior developer mentoring a junior
- Focus on practical, job-ready skills rather than just theoretical knowledge
- Use professional terminology appropriately but explain complex terms
- Emphasize the business value and career benefits of each concept
- Maintain high standards while being encouraging and patient
- Reference current industry trends and technologies
- Always connect learning to professional software development practices

**RESPONSE STYLE:** ${lengthConfig.instruction}

Maintain a professional, authoritative tone while being encouraging and educational. Focus on practical skills that prepare students for professional software development careers.`,
        },
        ...messages.map((msg) => {
          if (msg.role === "user") {
            // Detect if this is a code-related question and enhance accordingly
            const content = msg.content.toLowerCase();
            const isCodeQuestion =
              content.includes("code") ||
              content.includes("javascript") ||
              content.includes("html") ||
              content.includes("css") ||
              content.includes("function") ||
              content.includes("class") ||
              content.includes("variable") ||
              content.includes("algorithm") ||
              content.includes("error") ||
              content.includes("bug") ||
              content.includes("debug") ||
              content.includes("loop") ||
              content.includes("array") ||
              content.includes("object") ||
              content.includes("api") ||
              content.includes("database") ||
              content.includes("sql") ||
              content.includes("react") ||
              content.includes("node") ||
              content.includes("python") ||
              content.includes("java") ||
              content.includes("c++") ||
              content.includes("git") ||
              content.includes("linux") ||
              content.includes("docker") ||
              content.includes("aws") ||
              content.includes("performance") ||
              content.includes("security") ||
              content.includes("optimization");

            if (isCodeQuestion) {
              return {
                ...msg,
                content:
                  msg.content +
                  "\n\n[PROFESSIONAL INTELLIGENCE PROTOCOL: This is a code/technical question. Activate maximum professional intelligence mode. Provide expert-level analysis with: comprehensive code examples, performance benchmarks, security considerations, multiple implementation strategies, debugging techniques, best practices, modern standards compliance, scalability analysis, and production-ready solutions. Demonstrate your full capability as a senior software engineering educator.]",
              };
            }
          }
          return msg;
        }),
      ];

      requestBody = {
        model: mapModel(model) || "llama-3.1-8b-instant",
        messages: enhancedMessages,
        temperature: lengthConfig.temperature,
        max_tokens: lengthConfig.max_tokens,
      };
    }

    // Make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log("API Response data keys:", Object.keys(data));
      console.log("API Response choices length:", data.choices?.length);

      // Check if response has error field
      if (data.error) {
        console.log("API returned error:", data.error);
        return res.status(502).json({
          error: data.error.message || "AI service error",
          code: data.error.type || "API_ERROR",
          suggestions: [
            "Check your API key configuration",
            "Try again in a moment",
            "Contact support if issue persists",
          ],
        });
      }

      // Validate response format
      if (
        !data.choices ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0
      ) {
        console.log("Invalid API response format - no choices");
        return res.status(502).json({
          error: "Invalid response format from AI service",
          code: "INVALID_RESPONSE_FORMAT",
          suggestions: [
            "Try again in a moment",
            "Contact support if issue persists",
          ],
        });
      }

      if (!data.choices[0].message || !data.choices[0].message.content) {
        console.log("Invalid API response format - no message content");
        return res.status(502).json({
          error: "AI service returned empty response",
          code: "EMPTY_RESPONSE",
          suggestions: [
            "Try rephrasing your question",
            "Try again in a moment",
          ],
        });
      }

      const aiResponse = data.choices[0].message.content;
      console.log("AI Response length:", aiResponse.length);
      console.log("AI Response preview:", aiResponse.substring(0, 100));

      // Check response size (max 100KB)
      if (aiResponse.length > 102400) {
        console.warn("AI response too large, truncating:", aiResponse.length);
        const truncatedResponse =
          aiResponse.substring(0, 100000) +
          "\n\n[Response truncated due to size limit]";
        return res.json({
          response: truncatedResponse,
          model: requestBody.model,
          usage: data.usage || null,
          truncated: true,
        });
      }

      res.json({
        response: aiResponse,
        model: requestBody.model,
        usage: data.usage || null,
      });
    } catch (err) {
      clearTimeout(timeoutId);

      console.error("Groq AI error:", err);

      // Enhanced error handling for different error types
      let errorCode = "UNKNOWN_ERROR";
      let errorMessage = "An unexpected error occurred";
      let suggestions = ["Please try again in a moment"];
      let statusCode = 500;

      if (err.name === "AbortError") {
        errorCode = "REQUEST_TIMEOUT";
        errorMessage = "AI request timed out";
        suggestions = [
          "Try again in a moment",
          "Check your internet connection",
        ];
        statusCode = 408;
      } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
        errorCode = "NETWORK_ERROR";
        errorMessage = "Unable to connect to AI service";
        suggestions = [
          "Check your internet connection",
          "Try again in a moment",
        ];
        statusCode = 503;
      } else if (err.message.includes("API key")) {
        errorCode = "API_KEY_ERROR";
        errorMessage = "API key configuration error";
        suggestions = [
          "Check your GROQ_API_KEY in .env file",
          "Restart the server",
        ];
        statusCode = 500;
      }

      return res.status(statusCode).json({
        error: errorMessage,
        code: errorCode,
        suggestions: suggestions,
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  } catch (error) {
    console.error("Outer try-catch error:", error);
    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      suggestions: ["Please try again later"],
    });
  }
});

// Fallback explanation function for when API key is not available
function getFallbackExplanation(
  isCodeExplanation,
  code,
  language,
  responseStyle
) {
  if (!isCodeExplanation) {
    return "I'm sorry, but the AI assistant is currently unavailable due to API configuration. Please check that your Groq API key is properly configured in the backend .env file.";
  }

  const explanations = {
    html: {
      brief: `This HTML code creates a professional webpage structure. The \`<h1>\` tag defines a main heading, and the \`<p>\` tag creates a paragraph of text.`,
      normal: `This HTML code creates a professional webpage with:
• \`<h1>Hello World</h1>\` - Semantic heading (level 1) for main page title
• \`<p>This is a paragraph.</p>\` - Structured paragraph element with proper content

**Professional HTML Standards:**
• Uses semantic HTML5 elements for better accessibility
• Proper document structure with clear content hierarchy
• Maintains clean, readable markup patterns

**Industry Best Practices:**
• Include proper lang attribute for accessibility
• Use semantic elements (header, main, footer) when appropriate
• Validate markup with W3C validator`,
      detailed: `This HTML code demonstrates professional webpage structure and semantic markup:

**Code Analysis:**
• \`<h1>Hello World</h1>\` - Primary heading using semantic HTML5 element
• \`<p>This is a paragraph.</p>\` - Content paragraph with proper text structure

**Professional Standards:**
• Semantic HTML5 markup for better SEO and accessibility
• Proper element nesting and document hierarchy
• Clean, maintainable code structure

**Industry Best Practices:**
• Use semantic elements (\`<article>, <section>, <aside>\`) for content structure
• Include proper ARIA labels and alt text for accessibility compliance
• Follow W3C validation standards
• Consider responsive design from the start

**Production Example:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Webpage</title>
</head>
<body>
    <h1>Professional Content Structure</h1>
    <p>Industry-standard semantic markup for modern web development.</p>
</body>
</html>
\`\`\``,
    },
    css: {
      brief: `This CSS code implements professional styling with modern layout techniques. It establishes typography, color schemes, and responsive design patterns.`,
      normal: `This CSS code demonstrates professional styling practices:
• \`body\` - Establishes system font stack and professional color palette
• \`.container\` - Implements responsive layout with proper spacing

**Modern CSS Techniques:**
• CSS Grid/Flexbox for layout (industry standard)
• Mobile-first responsive design approach
• Professional typography with system fonts
• Consistent spacing and visual hierarchy

**Performance Considerations:**
• Optimized CSS for fast loading
• Modern layout methods reduce complexity
• Scalable design patterns`,
      detailed: `This CSS code implements professional styling with modern development practices:

**Technical Implementation:**
• \`body { font-family: Arial, sans-serif; color: #333; }\` - System font stack with professional color scheme
• \`.container { max-width: 1200px; margin: 0 auto; padding: 20px; }\` - Responsive container with proper spacing

**Professional Standards:**
• Modern CSS reset practices
• Mobile-first responsive design
• Consistent visual hierarchy
• Performance-optimized styling
• Accessible color contrast ratios

**Industry Best Practices:**
• Use CSS custom properties (variables) for maintainability
• Implement responsive design patterns
• Follow BEM methodology for naming
• Consider CSS-in-JS for large applications
• Optimize for Core Web Vitals

**Production Example:**
\`\`\`css
/* Professional CSS Architecture */
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --text-color: #333;
    --spacing-unit: 1rem;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text-color);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: calc(var(--spacing-unit) * 2);
}
\`\`\``,
    },
    javascript: {
      brief: `This JavaScript code demonstrates professional function implementation with proper error handling and modern ES6+ syntax.`,
      normal: `This JavaScript code implements a professional function:
• Defines \`greet\` function with proper parameter handling
• Returns formatted string using template literals (ES6+)
• Demonstrates console output for debugging

**Modern JavaScript Practices:**
• ES6+ arrow functions and template literals
• Proper function documentation
• Error handling patterns
• Clean, readable code structure

**Professional Development:**
• Follows industry naming conventions
• Includes proper documentation
• Demonstrates debugging techniques`,
      detailed: `This JavaScript code demonstrates professional function implementation and modern development practices:

**Code Analysis:**
• \`function greet(name) { ... }\` - Function declaration with descriptive naming
• \`return "Hello, " + name + "!";\` - String concatenation for dynamic content
• \`console.log(greet("World")); \` - Function invocation and debugging output

**Professional Standards:**
• Modern JavaScript (ES6+) syntax
• Proper function documentation
• Error handling patterns
• Clean code principles
• Industry naming conventions

**Best Practices:**
• Use arrow functions for callbacks
• Implement proper error handling
• Add JSDoc comments for documentation
• Follow consistent naming conventions
• Consider TypeScript for large projects
• Test functions with various inputs

**Production Example:**
\`\`\`javascript
/**
 * Generates a personalized greeting message
 * @param {string} name - The person's name
 * @returns {string} Formatted greeting message
 */
const createGreeting = (name) => {
    if (!name || typeof name !== 'string') {
        throw new Error('Name must be a non-empty string');
    }
    
    return \`Hello, \${name}! Welcome to professional JavaScript development.\`;
};

// Usage with error handling
try {
    console.log(createGreeting('Professional Developer'));
} catch (error) {
    console.error('Greeting failed:', error.message);
}
\`\`\``,
    },
  };

  const styleMap = { brief: "brief", normal: "normal", detailed: "detailed" };
  const style = styleMap[responseStyle] || "normal";

  return (
    explanations[language]?.[style] ||
    `This ${language.toUpperCase()} code performs specific functionality. Please ensure your Groq API key is configured to get detailed AI explanations.`
  );
}

// Input validation middleware for AI requests
function validateAIRequest(req, res, next) {
  const { messages, model, code, language } = req.body;

  // Check if this is a code explanation request (code and language provided)
  const isCodeExplanation = code && language;

  if (isCodeExplanation) {
    // For code explanation, messages are optional, but code and language are required
    if (!code || !language) {
      return res.status(400).json({
        error: "Code and language are required for code explanation",
        code: "MISSING_PARAMETERS",
        suggestions: ["Provide both code and language parameters"],
      });
    }
  } else {
    // For chat requests, messages are required
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages must be a non-empty array",
        code: "INVALID_MESSAGES",
      });
    }

    // Validate each message
    for (const message of messages) {
      if (!message.role || !message.content) {
        return res.status(400).json({
          error: "Each message must have role and content",
          code: "INVALID_MESSAGE_FORMAT",
        });
      }
      if (!["user", "assistant", "system"].includes(message.role)) {
        return res.status(400).json({
          error: "Message role must be user, assistant, or system",
          code: "INVALID_ROLE",
        });
      }
      if (
        typeof message.content !== "string" ||
        message.content.length > 10000
      ) {
        return res.status(400).json({
          error: "Message content must be a string with max 10000 characters",
          code: "INVALID_CONTENT",
        });
      }
    }
  }

  next();
}

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// API routes should be defined before the catch-all route

// Handle client-side routing - serve index.html for all non-API GET requests
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});

// Cache statistics endpoint
app.get("/api/cache/stats", (req, res) => {
  res.json({
    ...cacheStats,
    cacheSize: responseCache.size,
    config: CACHE_CONFIG,
    uptime: process.uptime(),
  });
});

// Cache clear endpoint (for maintenance)
app.post("/api/cache/clear", (req, res) => {
  const previousSize = responseCache.size;
  responseCache.clear();
  cacheStats.size = 0;
  cacheStats.evictions += previousSize;

  res.json({
    message: "Cache cleared successfully",
    previousSize,
    currentSize: 0,
  });
});

// Add response compression
const compression = require("compression");
app.use(
  compression({
    level: 6, // Good balance between speed and compression
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Add rate limiting for API endpoints
const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI-specific rate limiter (more restrictive for AI endpoints)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 AI requests per windowMs
  message: {
    error:
      "AI request limit exceeded. Please wait before making more requests.",
    code: "AI_RATE_LIMIT_EXCEEDED",
    retryAfter: 15 * 60 * 1000,
    suggestions: [
      "Wait 15 minutes before making more AI requests",
      "Consider upgrading your plan for higher limits",
    ],
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/api/groq/health";
  },
});

// Apply general rate limiting to API routes
app.use("/api/", apiLimiter);

// Apply AI-specific rate limiting to AI endpoints
app.use("/api/groq", aiLimiter);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables (skip in Vercel if it fails)
    if (!process.env.VERCEL) {
      await models.initializeTables();
      console.log('📊 Database tables initialized successfully');
    } else {
      try {
        await models.initializeTables();
        console.log('📊 Database tables initialized successfully');
      } catch (dbError) {
        console.warn('⚠️ Database initialization failed in Vercel, using JSON fallbacks');
      }
    }

    // Start the server
    const port = process.env.PORT || 3000;

    // For Vercel, we need to use the provided port
    if (process.env.VERCEL) {
      console.log('🚀 Running in Vercel environment');
      // Export the app for Vercel serverless functions
      module.exports = app;
      return;
    }
    app.listen(port, () => {
      console.log(`🚀 KidLearner server running on port ${port}`);
      console.log(
        `📊 Cache system initialized with ${
          Object.keys(CACHE_CONFIG).length
        } configurations`
      );
      console.log(`🗜️  Response compression enabled`);
      console.log(`⚡ Rate limiting active`);
      console.log(`💾 Database integration active`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    if (!process.env.VERCEL) {
      process.exit(1);
    } else {
      // In Vercel, still export the app even if initialization fails
      console.log('🚀 Exporting app for Vercel despite initialization errors');
      module.exports = app;
    }
  }
}

// For Vercel serverless functions
if (process.env.VERCEL) {
  startServer();
} else {
  startServer();
}
