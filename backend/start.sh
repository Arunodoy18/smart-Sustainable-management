#!/bin/bash
# Startup script for local development
# Get port from environment or default to 8080
PORT=${PORT:-8080}

echo "🚀 Starting Smart Waste Management API on port $PORT"
echo "Environment: ${ENVIRONMENT:-development}"

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload

