// Vercel serverless function wrapper
// This file acts as the entry point for all API routes in Vercel

// Set environment to production for Vercel
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

// Import the Express app from the backend
const app = require('../backend/server.js/server.js');

// Export for Vercel serverless functions
module.exports = app;
