#!/bin/bash

# Development startup script for WorkflowBuilder Platform

echo "🚀 Starting WorkflowBuilder Platform Development Environment..."

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Start frontend development server
echo "📱 Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend started on http://localhost:5177"
echo "🔧 Backend running on production: https://workflow-lg9z.onrender.com"
echo ""
echo "🎯 Ready to develop!"
echo "   - Frontend: http://localhost:5177"
echo "   - Workflow Builder: http://localhost:5177/workflow"  
echo "   - Social Connections: http://localhost:5177/connections"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
wait $FRONTEND_PID