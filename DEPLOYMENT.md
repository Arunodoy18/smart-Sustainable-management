# Production Deployment & Verification Guide

> **Smart Waste AI Platform** — Full-stack deployment on **Render + Netlify**

**Last Updated:** March 2026  
**Status:** ✅ All production features documented

## 🆕 What's New in 2026

This guide now includes comprehensive documentation for all production features:

### Core Infrastructure
- ✅ **Token Blocklist** - Secure JWT revocation with Redis (Section 4)
- ✅ **Event Bus** - Domain event architecture with Pub/Sub (Section 4)
- ✅ **Circuit Breakers** - Resilient ML and storage operations (Section 4)
- ✅ **OpenTelemetry** - Distributed tracing integration (Section 14)
- ✅ **Redis Integration** - Enhanced caching and rate limiting (Section 10)

### Administration & Analytics
- ✅ **Admin Dashboard API** - Complete management endpoints (Section 13)
- ✅ **Feature Flags** - Configurable feature toggles (Section 12)
- ✅ **Enhanced Health Checks** - Circuit breaker metrics (Section 7)

### Deployment
- ✅ **Graceful Degradation** - App works without Redis (Section 10)
- ✅ **Comprehensive Troubleshooting** - Common issues & solutions (Section 15)
- ✅ **Security Hardening** - Token revocation, request tracing (Section 11)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Netlify CDN                                                     │
│  https://wastifi.netlify.app                                     │
│  React 18 · TypeScript · Vite · Axios                             │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTPS (CORS-protected)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Render Web Service (Free tier, 512 MB)                          │
│  https://smartwaste-api-byb5.onrender.com                        │
│  FastAPI · Uvicorn · MobileNet V2 · SQLAlchemy (async)           │
└──────────────┬──────────────────────────────────────────┬────────┘
               │ asyncpg                                   │
               ▼                                           ▼
┌───────────────────────────────────┐    ┌──────────────────────────┐
│  Render Managed PostgreSQL        │    │  Redis (Optional)        │
│  postgresql://smartwaste:***@...  │    │  Token blocklist, cache, │
└───────────────────────────────────┘    │  event bus, rate limiter │
                                          └──────────────────────────┘
```

---

## 1. Render Environment Variables

### Required (all set ✅)

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_ENV` | `production` | Disables debug, hides tracebacks |
| `APP_NAME` | `Smart Waste Platform` | — |
| `SECRET_KEY` | 64-char hex | Min 32 chars enforced by Pydantic |
| `DEBUG` | `false` | — |
| `DATABASE_URL` | `postgresql://smartwaste:...` | Auto-converted to `postgresql+asyncpg://` |
| `DATABASE_POOL_SIZE` | `20` | — |
| `DATABASE_MAX_OVERFLOW` | `10` | — |
| `JWT_SECRET_KEY` | 64-char hex | Min 32 chars |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | — |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | — |
| `ALLOWED_ORIGINS` | `https://wastifi.netlify.app,http://localhost:3000,http://localhost:5173` | CSV |
| `FRONTEND_URL` | `https://wastifi.netlify.app` | — |
| `ML_CLASSIFIER_TYPE` | `mobilenet` | `mobilenet` / `clip` / `mock` |
| `PYTHON_VERSION` | `3.11.7` | Render build config |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `60` | — |
| `RATE_LIMIT_BURST` | `10` | — |
| `REDIS_URL` | `redis://...` | **Required for token blocklist & event bus** |

### Optional (safe defaults)

| Variable | Default | Notes |
|----------|---------|-------|
| `STORAGE_BACKEND` | `local` | Ephemeral on Render free tier (files lost on redeploy) |
| `AUTO_MIGRATE` | `false` | Set `true` to auto-run Alembic on startup |
| `SENTRY_DSN` | *(unset)* | Enable for error tracking |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `REDIS_CACHE_TTL` | `3600` | Cache expiry in seconds |
| `OTEL_ENABLED` | `false` | Enable OpenTelemetry tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` | OTLP gRPC endpoint |
| `OTEL_SERVICE_NAME` | `smart-waste-api` | Service name for traces |
| `ENABLE_EMAIL_VERIFICATION` | `false` | Require email verification |
| `ENABLE_DRIVER_APPROVAL` | `true` | Require admin approval for drivers |
| `ENABLE_REWARDS_SYSTEM` | `true` | Enable gamification |
| `CLIP_MODEL_ID` | `openai/clip-vit-base-patch32` | HuggingFace model for CLIP |
| `CLIP_DEVICE` | *(auto)* | `cuda` / `cpu` / `None` |
| `CLIP_CACHE_DIR` | *(unset)* | Cache directory for CLIP models |

---

## 2. Netlify Environment Variables

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_API_URL` | `https://smartwaste-api-byb5.onrender.com` | All deploy contexts |

### Build Settings

- **Base directory:** `apps/web`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20 (set via `NODE_VERSION` or `.nvmrc`)

---

## 3. Running Database Migrations

Migrations are **not** auto-run by default (production safety). Two options:

### Option A: Via Render Shell
```bash
cd /app
alembic upgrade head
```

### Option B: Auto-migrate on deploy
Set `AUTO_MIGRATE=true` in Render Environment. The `start.sh` script checks this and runs `alembic upgrade head` before starting Uvicorn.

### Current migration chain
```
3b11939b5277  Initial schema (users, waste_entries, rewards, pickups, ...)
a1b2c3d4e5f6  Enum value fix (no-op)
b2c3d4e5f6g7  Backfill NULL defaults on user_points / user_streaks
```

---

## 4. Production Hardening Summary

### CORS
- `allow_origins` = parsed from `ALLOWED_ORIGINS` env var
- `allow_origin_regex` = Netlify deploy preview pattern
- `allow_methods` / `allow_headers` = `["*"]`
- `allow_credentials` = `true`
- `CatchAllMiddleware` ensures CORS headers on 500 responses

### Token Blocklist (JWT Revocation)
```
Logout -> Revoke Token
  |
  +-- Store token JTI in Redis (expires at token expiry)
  |
  +-- Every protected request checks blocklist
  |
  +-- Fallback: in-memory cache (lost on restart)
```

**Benefits:**
- Instant token revocation (logout, compromised tokens)
- Redis persistence across restarts
- Auto-expiry (TTL = token expiry time)

### Event Bus (Redis Pub/Sub)
```
Domain events:
  - waste.classified    -> Log + telemetry
  - rewards.points_awarded -> Log + audit trail
  - pickup.assigned     -> Notifications (future)
  - user.registered     -> Welcome email (future)
```

**Architecture:**
- In-process: immediate handler execution (no Redis)
- Redis: cross-instance pub/sub for horizontal scaling
- Handlers registered at startup in main.py

### Circuit Breakers
```
ML Pipeline Breaker:
  - Failure threshold: 5 in 60s
  - Half-open after: 30s
  - Protects: classification endpoint
  
Storage Breaker:
  - Failure threshold: 5 in 60s
  - Half-open after: 15s
  - Protects: file upload/download
```

**Graceful degradation:**
- ML fails -> entry saved with `category=None`
- Storage fails -> 503 response (upload retryable)
- Metrics exposed in `/health` endpoint

### Rate Limiting
- **Per-client** based on IP address
- Redis-backed for distributed rate limiting
- Fallback: in-memory (single instance only)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### OpenTelemetry (Optional)
```
Set OTEL_ENABLED=true to enable:
  - Distributed tracing (FastAPI + SQLAlchemy)
  - Metrics (request latency, DB queries, ML inference)
  - Auto-instrumentation of libraries
```

Export to Jaeger/Tempo/Datadog via OTLP:
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
```

### Upload Flow
```
Frontend POST /api/v1/waste/upload (multipart)
  -> Auth check (JWT or guest)
  -> File type validation (image/* only)
  -> Size check (10 MB limit)
  -> Idempotency check (SHA-256 hash, 60s dedup window)
  -> Storage upload (local FS)
  -> DB entry creation
  -> ML classification (try/except — never blocks upload)
  -> Reward points (try/except — never blocks upload)
  -> Event: waste.classified
  -> Event: rewards.points_awarded
  -> DB commit + refresh
  -> 201 WasteEntryResponse
```

### Auth Flow
```
Login -> access_token (30 min) + refresh_token (7 days)
  |
  +-- Axios interceptor adds Bearer token to every request
  |
  +-- On 401 -> refresh token queue (concurrent requests wait)
  |           -> POST /api/v1/auth/refresh
  |           -> Success -> retry all queued requests with new token
  |           -> Failure -> clearTokens() -> guest mode
  |
  +-- On network error -> retry 2x with backoff (2s, 4s)
  |
  +-- On 5xx -> retry once after 1.5s (cold start resilience)
  
Logout -> Revoke both tokens in blocklist
```

### Null Safety
- `UserPoints` / `UserStreak` columns have `server_default` in models
- Migration `b2c3d4e5f6g7` backfills existing NULLs in production DB
- `_update_user_points` backfills any `None` before arithmetic
- All reward summary / level info accessors use `or 0` / `or 1` guards
- Leaderboard guards `user.last_name[0]` against `None`

### Request Tracing
- Every response includes `X-Request-Id` header
- Error logs include request ID for correlation

---

## 5. Endpoint Verification Checklist

All verified 200 (upload returns 201):

```bash
BASE=https://smartwaste-api-byb5.onrender.com

# Health (no auth)
curl $BASE/health
curl $BASE/health/ready
curl $BASE/ready

# Auth
curl -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser2@wastifi.app","password":"TestPass123!"}'
# Save access_token as TOKEN

# Protected endpoints
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/auth/me
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/waste/history?page=1
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/waste/stats/impact
curl $BASE/api/v1/waste/categories/all
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/rewards/summary
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/rewards/streak
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/rewards/achievements
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/rewards/leaderboard?period=weekly"
curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/pickups/my-pickups

# Admin endpoints (requires admin role)
curl -H "Authorization: Bearer $ADMIN_TOKEN" $BASE/api/v1/admin/dashboard
curl -H "Authorization: Bearer $ADMIN_TOKEN" $BASE/api/v1/admin/users?page=1
curl -H "Authorization: Bearer $ADMIN_TOKEN" $BASE/api/v1/admin/analytics/zones
curl -H "Authorization: Bearer $ADMIN_TOKEN" $BASE/api/v1/admin/analytics/heatmap
curl -H "Authorization: Bearer $ADMIN_TOKEN" $BASE/api/v1/admin/analytics/compliance
curl -H "Authorization: Bearer $ADMIN_TOKEN" $BASE/api/v1/admin/system-health

# Upload (multipart)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg" $BASE/api/v1/waste/upload

# Logout (revokes token)
curl -X POST -H "Authorization: Bearer $TOKEN" $BASE/api/v1/auth/logout
```

---

## 6. Zero-Downtime Deployment

1. **Push to `main`** — Render auto-builds from GitHub
2. Render builds new container **while old one keeps serving**
3. New container passes health check -> Render swaps traffic
4. Old container drains connections and shuts down

### If build fails
- Old container keeps running (no downtime)
- Fix code, push again
- If pip hash errors: **Manual Deploy -> Clear build cache & deploy**

### If migration breaks
```bash
alembic downgrade -1          # Roll back one migration
alembic stamp <previous_rev>  # Skip a bad migration
```

---

## 7. Monitoring

### Render Dashboard
Dashboard -> smartwaste-api -> Logs (Live tail)

### Key Log Patterns

| Pattern | Meaning |
|---------|---------|
| `ML pipeline initialized` | MobileNet loaded successfully |
| `Database connection pool warmed up` | DB ready |
| `Cache connected` | Redis cache ready |
| `Token blocklist initialized` | Redis token blocklist ready |
| `Event bus Redis connection failed` | In-process event bus only |
| `Classification failed` | ML error — entry saved unclassified |
| `Award points failed` | Rewards error — upload still succeeds |
| `Rate limit exceeded` | Client hitting rate limit |
| `Circuit breaker opened` | ML/Storage failing repeatedly |
| `Unhandled middleware exception` | Bug — check request ID |
| `Token revoked` | Logout/security event |
| `Classification complete` | Event: waste classified |
| `Points awarded` | Event: rewards given |

### Recommended
- Set `SENTRY_DSN` for automatic error capture with stack traces
- Use Render's built-in metrics for CPU/memory monitoring
- Set up UptimeRobot to ping `/health` every 5 min (prevents cold starts)

---

## 8. Known Limitations (Free Tier)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Render spins down after 15 min | First request 30-60s | Axios retry with backoff |
| 512 MB RAM | MobileNet uses ~100 MB | CPU-only torch |
| Local storage ephemeral | Images lost on redeploy | Future: S3/Cloudinary |
| No Redis (optional) | Features degrade gracefully | Token blocklist/cache in-memory |
| No GPU | Classification ~150ms | Acceptable for MVP |
| Single instance | No load balancing | Rate limiter uses in-memory fallback |

---

## 9. Classifier Options

| Classifier | RAM | Speed (CPU) | Accuracy | Env Var |
|------------|-----|-------------|----------|---------|
| **MobileNet V2** | ~100 MB | 50-150ms | ~75-80% | `ML_CLASSIFIER_TYPE=mobilenet` |
| CLIP | ~1 GB | 100-300ms | ~90-95% | `ML_CLASSIFIER_TYPE=clip` |
| Mock | <10 MB | <10ms | ~60% | `ML_CLASSIFIER_TYPE=mock` |

---

## 10. Redis Configuration (Optional but Recommended)

Redis provides enhanced functionality for production deployments:

### Features Enabled by Redis

| Feature | Without Redis | With Redis |
|---------|---------------|------------|
| **Token Blocklist** | In-memory (lost on restart) | Persistent across restarts |
| **Cache** | In-memory (lost on restart) | Persistent, shared across instances |
| **Event Bus** | In-process only | Cross-instance pub/sub |
| **Rate Limiter** | Per-instance (inaccurate) | Distributed (accurate) |

### Setup on Render

1. Create Redis instance: Dashboard → New → Redis
2. Copy internal Redis URL (e.g., `redis://red-xxx:6379`)
3. Add to environment: `REDIS_URL=redis://red-xxx:6379`
4. Redeploy API

### Fallback Behavior

All Redis features gracefully degrade:
- Token blocklist → in-memory (logout works, lost on restart)
- Cache → in-memory (slower, lost on restart)
- Event bus → in-process only (single instance)
- Rate limiter → per-instance (less accurate)

---

## 11. Security Checklist

- [x] JWT secrets are 64-char hex (not defaults)
- [x] CORS restricts origins to known domains
- [x] Rate limiting enabled (60 req/min, burst 10)
- [x] Password hashing via argon2
- [x] SQL injection prevented (parameterized queries)
- [x] File upload validation (image/*, 10 MB)
- [x] Upload idempotency (SHA-256 dedup, 60s window)
- [x] HTTPS enforced (Render + Netlify)
- [x] Token revocation on logout (blocklist)
- [x] Circuit breakers prevent cascade failures
- [x] Request ID tracing for security audits
- [ ] Rotate secrets every 90 days
- [ ] Enable Sentry for error tracking
- [ ] Add Content-Security-Policy headers
- [ ] Enable OTEL for distributed tracing
- [ ] Setup Redis for persistent token blocklist

---

## 12. Feature Flags

Control application features via environment variables:

| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_EMAIL_VERIFICATION` | `false` | Require email verification on signup |
| `ENABLE_DRIVER_APPROVAL` | `true` | Require admin approval for driver accounts |
| `ENABLE_REWARDS_SYSTEM` | `true` | Enable gamification (points, streaks, achievements) |

---

## 13. Admin Dashboard Features

The `/api/v1/admin/*` endpoints provide comprehensive management:

### Available Endpoints

- **Dashboard** - Overview stats (users, entries, pickups)
- **User Management** - List, update, suspend users
- **Analytics** - Zone analytics, heatmaps, compliance metrics
- **System Health** - Real-time health checks with circuit breaker metrics
- **Pickup Management** - Assign drivers, update status
- **Driver Management** - Approve/reject driver applications

All admin endpoints require `role=admin` JWT token.

---

## 14. OpenTelemetry Integration

Enable distributed tracing for production observability:

```bash
# Environment variables
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
OTEL_SERVICE_NAME=smart-waste-api
```

### What's Traced

- HTTP requests (FastAPI)
- Database queries (SQLAlchemy async)
- ML inference (classification pipeline)
- Redis operations (cache, events, blocklist)
- Circuit breaker state changes

### Compatible Backends

- Jaeger
- Tempo (Grafana)
- Datadog APM
- Honeycomb
- New Relic

---

## 15. Troubleshooting

### Cold Start Delays

**Symptom:** First request after 15 min idle takes 30-60 seconds

**Solution:**
- Frontend has automatic retry with backoff
- Use UptimeRobot to ping `/health` every 5 min
- Add this to `axios` config already implemented

### Redis Connection Failed

**Symptom:** `Event bus Redis connection failed` in logs

**Impact:** Graceful degradation (see section 10)

**Solution:**
- Verify `REDIS_URL` is correct
- Check Redis instance is running on Render
- Not a blocker — app works without Redis

### Circuit Breaker Open

**Symptom:** `Circuit breaker opened` in logs, 503 responses

**Diagnosis:**
```bash
curl https://smartwaste-api-byb5.onrender.com/health | jq .circuit_breakers
```

**Solution:**
- ML breaker: Check RAM usage (MobileNet ~100MB)
- Storage breaker: Check disk space or S3 credentials
- Wait for half-open period (15-30s) then retry

### Token Revoked After Server Restart

**Symptom:** All users logged out after redeploy

**Cause:** Token blocklist in-memory (no Redis)

**Solution:**
- Add Redis: `REDIS_URL=redis://...`
- Or accept: users re-login after redeploys

### Upload Fails with 413

**Symptom:** Large images fail to upload

**Cause:** Nginx/Render body size limit

**Solution:**
- Frontend resizes images before upload (max 10MB)
- Already implemented in `ImageUpload.tsx`

### Classification Returns `null`

**Symptom:** Waste entries have `category: null`

**Cause:** ML pipeline failed to initialize or classify

**Diagnosis:**
```bash
# Check logs for:
grep "ML pipeline initialized" logs.txt
grep "Classification failed" logs.txt

# Check RAM:
curl .../health | jq '.checks.ml_model'
```

**Solution:**
- 512MB RAM: Use `ML_CLASSIFIER_TYPE=mobilenet` (not `clip`)
- Check model download completed
- Classification failure is non-blocking (entry still saved)

### Rate Limit Errors

**Symptom:** Frontend shows "Too many requests"

**Cause:** 60 req/min limit exceeded

**Solution:**
- Check for loops/aggressive polling in frontend
- Increase limit: `RATE_LIMIT_REQUESTS_PER_MINUTE=120`
- Add Redis for distributed limiting (section 10)

### Database Migration Failed

**Symptom:** Alembic error on startup with `AUTO_MIGRATE=true`

**Solution:**
```bash
# Via Render Shell:
cd /app
alembic current           # Check current revision
alembic history           # Show migration chain
alembic downgrade -1      # Roll back one step
alembic upgrade head      # Re-apply
```

**Prevention:**
- Test migrations locally first
- Keep `AUTO_MIGRATE=false` in production
- Run migrations manually via Render Shell

### CORS Errors in Browser

**Symptom:** `Access-Control-Allow-Origin` errors

**Diagnosis:**
1. Check request origin in DevTools Network tab
2. Verify origin in `ALLOWED_ORIGINS` env var
3. Check deploy preview matches regex pattern

**Solution:**
```bash
# Add your origin:
ALLOWED_ORIGINS=https://wastifi.netlify.app,https://deploy-preview-123--wastifi.netlify.app,http://localhost:3000

# Regex pattern already supports deploy previews:
# ^https://([a-z0-9-]+--)?wastifi\.netlify\.app$
```

---

## 16. Recent Changes (2026)

This deployment guide has been updated to reflect the following production features:

### New Subsystems
- ✅ **Token Blocklist** - JWT revocation with Redis fallback
- ✅ **Event Bus** - Domain events with Redis Pub/Sub
- ✅ **Circuit Breakers** - ML and storage resilience
- ✅ **OpenTelemetry** - Optional distributed tracing
- ✅ **Admin Dashboard** - Complete admin API endpoints

### Configuration Updates
- ✅ `REDIS_URL` - Now recommended for production
- ✅ `ML_CLASSIFIER_TYPE` - Choose between mobilenet/clip/mock
- ✅ Feature flags - email verification, driver approval, rewards
- ✅ OTEL configuration - Enable tracing and metrics

### Architecture Enhancements
- ✅ Graceful degradation without Redis
- ✅ Circuit breaker metrics in health checks
- ✅ Request ID tracing for debugging
- ✅ Enhanced rate limiting with Redis
- ✅ Persistent token revocation

### Documentation Sections Added
- Section 10: Redis Configuration
- Section 11: Security Checklist (updated)
- Section 12: Feature Flags
- Section 13: Admin Dashboard Features
- Section 14: OpenTelemetry Integration
- Section 15: Troubleshooting
- Section 16: Recent Changes
