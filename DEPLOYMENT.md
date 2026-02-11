# Production Deployment & Verification Guide

> **Smart Waste AI Platform** — Full-stack deployment on **Render + Netlify**

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
└──────────────┬──────────────────────────────────────────────────┘
               │ asyncpg
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Render Managed PostgreSQL                                       │
│  postgresql://smartwaste:***@...                                 │
└─────────────────────────────────────────────────────────────────┘
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

### Optional (safe defaults)

| Variable | Default | Notes |
|----------|---------|-------|
| `REDIS_URL` | *(unset)* | Falls back to in-memory cache — OK for free tier |
| `STORAGE_BACKEND` | `local` | Ephemeral on Render free tier (files lost on redeploy) |
| `AUTO_MIGRATE` | `false` | Set `true` to auto-run Alembic on startup |
| `SENTRY_DSN` | *(unset)* | Enable for error tracking |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |

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

# Upload (multipart)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg" $BASE/api/v1/waste/upload
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
| `Classification failed` | ML error — entry saved unclassified |
| `Award points failed` | Rewards error — upload still succeeds |
| `Rate limit exceeded` | Client hitting rate limit |
| `Unhandled middleware exception` | Bug — check request ID |

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
| No Redis | Cache lost on restart | Future: Redis add-on |
| No GPU | Classification ~150ms | Acceptable for MVP |

---

## 9. Classifier Options

| Classifier | RAM | Speed (CPU) | Accuracy | Env Var |
|------------|-----|-------------|----------|---------|
| **MobileNet V2** | ~100 MB | 50-150ms | ~75-80% | `ML_CLASSIFIER_TYPE=mobilenet` |
| CLIP | ~1 GB | 100-300ms | ~90-95% | `ML_CLASSIFIER_TYPE=clip` |
| Mock | <10 MB | <10ms | ~60% | `ML_CLASSIFIER_TYPE=mock` |

---

## 10. Security Checklist

- [x] JWT secrets are 64-char hex (not defaults)
- [x] CORS restricts origins to known domains
- [x] Rate limiting enabled (60 req/min, burst 10)
- [x] Password hashing via argon2
- [x] SQL injection prevented (parameterized queries)
- [x] File upload validation (image/*, 10 MB)
- [x] Upload idempotency (SHA-256 dedup, 60s window)
- [x] HTTPS enforced (Render + Netlify)
- [ ] Rotate secrets every 90 days
- [ ] Enable Sentry
- [ ] Add Content-Security-Policy headers
