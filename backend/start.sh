#!/bin/bash
# Startup script for Render deployment
# Render automatically sets the PORT environment variable

# Get port from environment or default to 8000
PORT=${PORT:-8000}

echo "🚀 Starting Smart Waste Management API on port $PORT"
echo "Environment: ${ENVIRONMENT:-production}"

# Run database migrations if needed (uncomment when you have migrations)
# python -m alembic upgrade head

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
