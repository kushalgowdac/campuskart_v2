#!/usr/bin/env bash
set -e

echo "📦 Starting CampusKart..."
echo ""

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 1

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Backend  → http://localhost:5000"
echo "✅ Frontend → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
