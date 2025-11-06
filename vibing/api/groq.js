const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '..', '..', '.env') });
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
  return false;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Health endpoint compatibility for frontend checker
    const apiKey = process.env.GROQ_API_KEY;
    const isHealthPath = (req.url || '').endsWith('/health');
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { messages, model, code, language, responseStyle = 'normal' } = req.body || {};
  const apiKey = process.env.GROQ_API_KEY;

  const isCodeExplanation = code && language;
  if (isCodeExplanation) {
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }
  } else {
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages must be a non-empty array' });
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

  try {
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
        max_tokens: 800,
        temperature: 0.3
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
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return res.status(200).json({ response: data.choices[0].message.content, model: requestBody.model });
    }

    console.warn('Unexpected Groq response format:', data);
    return res.status(502).json({ error: 'Invalid response from Groq', raw: data });
  } catch (error) {
    console.error('Groq serverless error:', error);
    return res.status(500).json({
      error: 'Unexpected error while contacting Groq',
      message: error.message,
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
