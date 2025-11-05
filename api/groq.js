const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '..', '.env') });
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const FALLBACK_RESPONSES = {
  unavailable: "I'm sorry, but the AI assistant is currently unavailable because the Groq API key is not configured in this deployment.",
  explanation: (code, language, style = "normal") => {
    const safeLanguage = (language || "code").toLowerCase();
    const snippet = (code || "").toString().slice(0, 5000);
    const styles = {
      brief: "Provide a concise, high-level summary.",
      detailed: "Include extra implementation details, best practices, and next steps.",
    };

    return [
      `This deployment is running in demo mode, so here's a ${style} walkthrough instead of a live Groq response:`,
      "\n",
      `Language: ${safeLanguage}`,
      snippet ? `\nCode snippet preview:\n\n${snippet}` : "",
      "\n",
      "What to look for:",
      "• Understand the intent of the code and how control flows.",
      "• Identify the primary structures (functions, selectors, markup, etc.).",
      "• Note any points to improve (naming, accessibility, performance, security).",
      styles[style] ? `• ${styles[style]}` : "",
      "\n",
      "Tips:",
      "1. Run this code locally and add console logging or breakpoints to inspect behavior.",
      "2. Compare against official documentation for the language or APIs used.",
      "3. Refactor large blocks into smaller, testable units to improve clarity.",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

function buildFallbackResponse({ isCodeExplanation, code, language, responseStyle }) {
  if (!isCodeExplanation) {
    return FALLBACK_RESPONSES.unavailable;
  }
  return FALLBACK_RESPONSES.explanation(code, language, responseStyle);
}

function shouldUseFallback(apiKey) {
  const demoModeEnabled = process.env.GROQ_DEMO_MODE === '1';
  if (!apiKey) return true;
  if (apiKey === "your_groq_api_key_here") return true;
  if (apiKey.length < 10) return true;
  if (demoModeEnabled) return true;
  // For testing purposes, treat invalid keys as fallback
  // if (apiKey.startsWith('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')) return true;
  return false;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    const apiKey = process.env.GROQ_API_KEY;
    const isHealthPath = (req.url || '').includes('health') || req.query?.health === 'true';
    if (isHealthPath) {
      if (apiKey && apiKey.length > 10) {
        return res.status(200).json({ status: 'healthy', suggestions: [] });
      }
      return res.status(200).json({
        status: 'unhealthy',
        suggestions: [
          'Set GROQ_API_KEY in project environment variables',
          'Redeploy the project after setting the key'
        ]
      });
    }
    // Default GET info
    return res.status(200).json({
      status: apiKey ? 'configured' : 'missing',
      keyLength: apiKey ? apiKey.length : 0
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Raw body type:', typeof req.body);
    console.log('Raw body keys:', req.body ? Object.keys(req.body) : 'null');
    const { messages, model = "llama-3.1-8b-instant", code, language, responseStyle = 'normal' } = body;
    const apiKey = process.env.GROQ_API_KEY;

    const isCodeExplanation = code && language;
    
    if (isCodeExplanation) {
      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }
    } else {
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages must be a non-empty array" });
      }
    }

    if (shouldUseFallback(apiKey)) {
      return res.status(200).json({
        response: buildFallbackResponse({
          isCodeExplanation,
          code,
          language,
          responseStyle,
        }),
        model: 'fallback-explanation',
        fallback: true,
        note: process.env.VERCEL
          ? 'Running on Vercel – using demo responses.'
          : 'No Groq API key configured.',
      });
    }

    let requestBody;
    if (isCodeExplanation) {
      requestBody = {
        model: model || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert software educator.' },
          { role: 'user', content: `Explain this ${language} code: ${code}` },
        ],
        max_tokens: 800,
        temperature: 0.3
      };
    } else {
      requestBody = {
        model: model || 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error('Groq API error response:', response.status, errorPayload);
      return res.status(response.status).json({
        error: 'Groq API request failed',
        status: response.status,
        raw: safeParseJson(errorPayload),
      });
    }

    const data = await response.json();
    
    // Function to clean special characters from AI response
    function cleanSpecialCharacters(text) {
      if (!text || typeof text !== 'string') return text;
      
      // Remove control characters but keep common formatting
      return text
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .replace(/\u0000/g, '') // Remove null characters
        .replace(/[\u2028\u2029]/g, ' ') // Replace line/paragraph separators with space
        .trim();
    }
    
    // Handle both response formats (chat completions and code explanation)
    if (isCodeExplanation) {
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const cleanedContent = cleanSpecialCharacters(data.choices[0].message.content);
        return res.status(200).json({ 
          response: cleanedContent, 
          model: requestBody.model 
        });
      }
    } else {
      // Clean response content in chat format
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        data.choices[0].message.content = cleanSpecialCharacters(data.choices[0].message.content);
      }
      // Return full OpenAI-compatible format for chat
      return res.status(200).json(data);
    }

    console.warn('Unexpected Groq response format:', data);
    return res.status(502).json({ error: 'Invalid response from Groq', raw: data });
  } catch (error) {
    console.error("Groq API error:", error);
    return res.status(500).json({
      error: "Failed to process AI request",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

function safeParseJson(payload) {
  try {
    return JSON.parse(payload);
  } catch (err) {
    return payload;
  }
}
