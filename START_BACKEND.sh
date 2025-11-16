#!/bin/bash

# QuikThread Backend Startup Script
# This script ensures the backend runs reliably

echo "🚀 Starting QuikThread Backend Server..."

# Kill any existing processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Navigate to functions directory
cd "$(dirname "$0")/functions"

# Start server in background with nohup
nohup node test-server.js > /tmp/quikthread-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server started successfully on http://localhost:3001"
    echo "📝 Server PID: $SERVER_PID"
    echo "📋 Logs: tail -f /tmp/quikthread-server.log"
    echo ""
    echo "To stop the server: kill $SERVER_PID"
else
    echo "❌ Failed to start server. Check logs: tail /tmp/quikthread-server.log"
    exit 1
fi
