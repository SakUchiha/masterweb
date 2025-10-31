#!/bin/bash

# KidLearner Web Application Startup Script
# This script automatically starts both the backend server and serves the frontend

echo "🚀 Starting KidLearner Web Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/code-understanding-app/backend/server.js"
FRONTEND_DIR="$PROJECT_ROOT/code-understanding-app/frontend"

echo -e "${BLUE}📁 Project Root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}📁 Backend Directory: $BACKEND_DIR${NC}"
echo -e "${BLUE}📁 Frontend Directory: $FRONTEND_DIR${NC}"

# Find available ports for both frontend and backend
is_port_in_use() {
    lsof -i :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Find available backend port starting at 4000
BACKEND_PORT=4000
MAX_BACKEND_PORT=4005
while is_port_in_use "$BACKEND_PORT"; do
    BACKEND_PORT=$((BACKEND_PORT + 1))
    if [ "$BACKEND_PORT" -gt "$MAX_BACKEND_PORT" ]; then
        echo -e "${RED}❌ No available ports found between 4000 and $MAX_BACKEND_PORT for the backend.${NC}"
        exit 1
    fi
done

# Use the same port as backend for frontend (single port setup)
FRONTEND_PORT=$BACKEND_PORT

# .env is optional; warn if missing or placeholder
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env not found in $BACKEND_DIR. AI Assistant will be disabled.${NC}"
else
    if grep -qE "your_openai_api_key_here|your_actual_api_key_here" "$BACKEND_DIR/.env"; then
        echo -e "${YELLOW}⚠️  Please update your OpenAI API key in $BACKEND_DIR/.env. AI Assistant will be disabled until then.${NC}"
    fi
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down server...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Server stopped${NC}"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${BLUE}🔧 Starting backend server on port $BACKEND_PORT...${NC}"
cd "$BACKEND_DIR"
PORT=$BACKEND_PORT npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"

# Frontend is now served by the backend server on the same port
echo -e "${GREEN}✅ Frontend served by backend server on port $BACKEND_PORT${NC}"

# Display access information
echo -e "\n${GREEN}🎉 KidLearner Web Application is now running!${NC}"
echo -e "${BLUE}🌐 Application: http://localhost:$BACKEND_PORT${NC}"
echo -e "\n${YELLOW}📋 Available Pages:${NC}"
echo -e "   • Home: http://localhost:$BACKEND_PORT/"
echo -e "   • Lessons: http://localhost:$BACKEND_PORT/lessons.html"
echo -e "   • Code Editor: http://localhost:$BACKEND_PORT/editor.html"
echo -e "   • AI Assistant: http://localhost:$BACKEND_PORT/ai.html"
echo -e "\n${YELLOW}💡 Press Ctrl+C to stop the server${NC}"

# Keep the script running and monitor backend process only
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        cleanup
        exit 1
    fi
    sleep 5
done








