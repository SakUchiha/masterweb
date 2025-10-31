// Configuration file for KidLearner application
// Use window.CONFIG if it exists, otherwise create it
if (!window.CONFIG) {
  window.CONFIG = {
    // API endpoints - configurable based on environment
    // For Vercel deployment, use relative URLs for API calls
    API_BASE_URL: window.location.origin,
    API_BASE_URL_ALT: window.location.origin,
    FRONTEND_BASE_URL: window.location.origin,

    // Feature flags
    ENABLE_AI_ASSISTANT: true,
    ENABLE_PROGRESS_TRACKING: true,
    ENABLE_AUTO_RUN: true,

    // UI settings
    DEFAULT_THEME: "light",
    MAX_CHAT_HISTORY: 50,

    // Error messages
    MESSAGES: {
      API_UNAVAILABLE: "Service temporarily unavailable. Please try again later.",
      NETWORK_ERROR: "Network connection error. Please check your internet connection."
    },

    // API settings
    API_TIMEOUT: 10000, // 10 seconds
    AUTO_RUN_DEBOUNCE: 1000, // 1 second

    // Cache settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

    // Development settings
    DEBUG_MODE: window.location.hostname === "localhost"
  };
}

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.CONFIG;
}

// Add diagnostic logging for environment detection
console.log('CONFIG: Environment detection:', {
  hostname: window.location.hostname,
  origin: window.location.origin,
  protocol: window.location.protocol,
  API_BASE_URL: CONFIG.API_BASE_URL,
  API_BASE_URL_ALT: CONFIG.API_BASE_URL_ALT,
  FRONTEND_BASE_URL: CONFIG.FRONTEND_BASE_URL,
  DEBUG_MODE: CONFIG.DEBUG_MODE
});
