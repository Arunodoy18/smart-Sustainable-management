# ==============================================================================
# Smart Waste AI - Production Dockerfile
# ==============================================================================
#
# IMPORTANT: This Dockerfile does NOT run migrations automatically.
# Migrations must be run manually BEFORE deployment using:
#   alembic upgrade head
#
# This is intentional for production safety.
# ==============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Create directories
RUN mkdir -p /app/logs /app/storage

# Environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Start command - DOES NOT run migrations (run them manually before deployment)
CMD uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
