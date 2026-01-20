# Smart Waste API

FastAPI backend for the Smart Waste Management Platform.

## Development

```bash
# Install dependencies
pip install -e ".[dev]"

# Run development server
uvicorn src.main:app --reload --port 8000
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Health Checks

- **Liveness**: http://localhost:8000/health
- **Readiness**: http://localhost:8000/ready
