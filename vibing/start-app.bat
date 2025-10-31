@echo off
echo Starting KidLearner Web Application...

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%code-understanding-app\backend\server.js
set FRONTEND_DIR=%PROJECT_ROOT%code-understanding-app\frontend

echo Starting backend server...
cd %BACKEND_DIR%
start cmd /k "npm start"

echo Starting frontend server...
cd %FRONTEND_DIR%
start cmd /k "python -m http.server 3000"

echo KidLearner Web Application is now running!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:4000
echo.
echo Available Pages:
echo   • Home: http://localhost:3000/index.html
echo   • Lessons: http://localhost:3000/lessons.html
echo   • Code Editor: http://localhost:3000/editor.html
echo   • AI Assistant: http://localhost:3000/ai.html