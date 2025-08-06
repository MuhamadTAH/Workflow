@echo off
REM Development startup script for WorkflowBuilder Platform (Windows)

echo 🚀 Starting WorkflowBuilder Platform Development Environment...

REM Check if we're in the right directory
if not exist "CLAUDE.md" (
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📱 Starting frontend development server...
cd frontend
start "Frontend Dev Server" cmd /k "npm run dev"

echo ✅ Frontend will start on http://localhost:5177
echo 🔧 Backend running on production: https://workflow-lg9z.onrender.com
echo.
echo 🎯 Ready to develop!
echo    - Frontend: http://localhost:5177
echo    - Workflow Builder: http://localhost:5177/workflow  
echo    - Social Connections: http://localhost:5177/connections
echo.
echo Press any key to close this window...
pause > nul