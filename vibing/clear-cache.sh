#!/bin/bash

# Cache clearing script for KidLearner
# This script clears service worker caches and forces a browser refresh

echo "🧹 Clearing KidLearner caches..."

# Clear browser caches if possible
echo "📱 To clear browser cache:"
echo "   1. Press F12 to open Developer Tools"
echo "   2. Right-click the refresh button"
echo "   3. Select 'Empty Cache and Hard Reload'"
echo ""
echo "Or use keyboard shortcuts:"
echo "   • Chrome/Firefox: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "   • Safari: Cmd+Option+R"
echo ""
echo "🔄 Forcing service worker update..."
echo "   The updated service worker (v1.0.1) will automatically clear old caches."

echo ""
echo "✅ Changes made to fix the caching issue:"
echo "   • Updated service worker cache version to v1.0.1"
echo "   • Updated API endpoints from /api/deepseek to /api/groq"
echo "   • Added cache-busting scripts to HTML files"
echo "   • Added ai-chat-only.js to ask-ai.html"
echo "   • Updated Content-Security-Policy to use port 4001"
echo ""
echo "📋 Next steps:"
echo "   1. Clear browser cache using one of the methods above"
echo "   2. Refresh the page"
echo "   3. The AI chat should now work with Groq API"
echo ""
echo "🔍 If you still see errors, check the browser console (F12) for service worker messages."
