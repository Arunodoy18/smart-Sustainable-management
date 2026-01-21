# Smart Waste API

FastAPI backend for the Smart Waste Management Platform.

## Development

```bash
# Install dependencies
pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Run development server
uvicorn src.main:app --reload --port 8000
```

## Database Migrations

**IMPORTANT**: Migrations are NOT run automatically on startup. You must run them manually.

```bash
# Check current migration state
alembic current

# Apply all pending migrations
alembic upgrade head

# View migration history
alembic history --verbose

# Generate new migration from model changes
alembic revision --autogenerate -m "description"
```

See [ALEMBIC_GUIDE.md](./ALEMBIC_GUIDE.md) for detailed migration documentation.

## Production Deployment

1. **Before deploying new code**, run migrations on production:
   ```bash
   alembic upgrade head
   ```

2. **Deploy the application** - it will start without running migrations

3. **Verify the application is healthy**:
   - Check `/health` endpoint
   - Check `/ready` endpoint

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Health Checks

- **Liveness**: http://localhost:8000/health
- **Readiness**: http://localhost:8000/ready
