# 🚀 Deployment Guide

This guide covers deploying the Smart Waste Platform to **Render** (backend) and **Netlify** (frontend).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with the latest code
- [ ] Render account (https://render.com)
- [ ] Netlify account (https://netlify.com)
- [ ] PostgreSQL database (Render, Neon, or Supabase DB-only)
- [ ] Storage bucket (Cloudinary or S3-compatible) - optional
- [ ] Domain name (optional, for custom domains)

---

## Environment Setup

### Backend Environment Variables

Create these in your Render dashboard:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `JWT_SECRET_KEY` | ✅ | JWT signing key (min 32 chars) | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `SECRET_KEY` | ✅ | App secret key (min 32 chars) | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALLOWED_ORIGINS` | ✅ | Frontend URL for CORS | `https://your-app.netlify.app` |
| `FRONTEND_URL` | ✅ | Frontend URL | `https://your-app.netlify.app` |
| `APP_ENV` | ✅ | Environment | `production` |
| `DEBUG` | ❌ | Debug mode | `false` |
| `REDIS_URL` | ❌ | Redis for caching | `redis://...` |
| `S3_BUCKET_NAME` | ❌ | Storage bucket | `smartwaste-uploads` |
| `S3_ACCESS_KEY_ID` | ❌ | S3 access key | Your access key |
| `S3_SECRET_ACCESS_KEY` | ❌ | S3 secret key | Your secret key |
| `S3_ENDPOINT_URL` | ❌ | S3-compatible endpoint | `https://...` |
| `MAPBOX_ACCESS_TOKEN` | ❌ | Mapbox for maps | Your token |

### Frontend Environment Variables

Create these in your Netlify dashboard:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ | Backend API URL | `https://your-api.onrender.com/api/v1` |
| `VITE_APP_NAME` | ❌ | App display name | `Smart Waste AI` |
| `VITE_MAPBOX_TOKEN` | ❌ | Mapbox access token | Your token |

---

## Database Setup

### Option 1: Render PostgreSQL

1. Go to Render Dashboard → New → PostgreSQL
2. Choose a name (e.g., `smartwaste-db`)
3. Select region closest to your backend
4. Choose plan (Free tier available for testing)
5. Click **Create Database**
6. Copy the **Internal Database URL** for use in backend

### Option 2: Neon (Recommended for Serverless)

1. Go to https://neon.tech
2. Create new project
3. Copy the connection string
4. Replace `postgresql://` with `postgresql+asyncpg://` for async support

### Option 3: Supabase DB-Only

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database → Connection string
4. Use the **URI** format with `postgresql+asyncpg://`

### Run Migrations

After deploying the backend, run migrations:

```bash
# Via Render Shell (Dashboard → Your Service → Shell)
alembic upgrade head

# Or seed initial data
python scripts/seed_db.py
```

---

## Backend Deployment (Render)

### Step 1: Create Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `smartwaste-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -e .`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Add Environment Variables

Add all required environment variables from the table above.

### Step 3: Configure Health Check

- **Health Check Path**: `/health`

### Step 4: Deploy

Click **Create Web Service**. Render will:
1. Clone your repository
2. Install dependencies
3. Start the application

### Verify Backend

After deployment, verify:

```bash
# Health check
curl https://your-api.onrender.com/health

# Should return:
{"status": "healthy"}
```

---

## Frontend Deployment (Netlify)

### Step 1: Create Site

1. Go to Netlify Dashboard → Add new site → Import from Git
2. Connect your GitHub repository
3. Configure:
   - **Branch**: `main`
   - **Base directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/web/dist`

### Step 2: Add Environment Variables

Go to Site Settings → Build & Deploy → Environment:

- `VITE_API_URL`: Your Render backend URL (e.g., `https://smartwaste-api.onrender.com/api/v1`)

### Step 3: Configure Redirects

Create `apps/web/public/_redirects`:

```
/* /index.html 200
```

Or use `netlify.toml` (already included in the repo).

### Step 4: Deploy

Click **Deploy site**. Netlify will:
1. Install dependencies
2. Build the React app
3. Deploy to CDN

### Verify Frontend

After deployment:
1. Visit your Netlify URL
2. Check browser console for errors
3. Verify API calls work

---

## Post-Deployment Verification

### Checklist

- [ ] Backend `/health` returns 200
- [ ] Backend `/ready` returns all checks passing
- [ ] Frontend loads without console errors
- [ ] User registration works
- [ ] User login works
- [ ] Token refresh works
- [ ] Waste upload and classification works
- [ ] History page loads data
- [ ] Driver portal accessible
- [ ] Admin analytics loads

### Test Commands

```bash
# Test health endpoint
curl https://your-api.onrender.com/health

# Test readiness (DB + Cache)
curl https://your-api.onrender.com/ready

# Test auth (should fail without token)
curl https://your-api.onrender.com/api/v1/auth/me
```

---

## Security Checklist

Before going live:

- [ ] `APP_ENV=production` is set
- [ ] `DEBUG=false` is set
- [ ] Strong `JWT_SECRET_KEY` (32+ chars, randomly generated)
- [ ] Strong `SECRET_KEY` (32+ chars, randomly generated)
- [ ] `ALLOWED_ORIGINS` only includes your Netlify domain
- [ ] HTTPS is enforced (automatic on Render/Netlify)
- [ ] No API docs exposed (`/docs` disabled in production)
- [ ] Database uses SSL connection
- [ ] Sensitive env vars are not logged

### Generate Secure Keys

```python
# Run this locally to generate secure keys
import secrets
print("JWT_SECRET_KEY:", secrets.token_hex(32))
print("SECRET_KEY:", secrets.token_hex(32))
```

---

## Troubleshooting

### Backend Issues

**API returns 500 errors**
```bash
# Check Render logs
# Dashboard → Your Service → Logs

# Common causes:
# - DATABASE_URL not set or incorrect
# - Missing environment variables
# - Database migrations not run
```

**CORS errors**
- Verify `ALLOWED_ORIGINS` matches your Netlify URL exactly
- No trailing slash in origins
- Check for `http://` vs `https://` mismatch

**Database connection errors**
- Verify `DATABASE_URL` format: `postgresql+asyncpg://...`
- Check if database is running
- Verify network access (Render internal vs external)

### Frontend Issues

**API calls fail**
- Check `VITE_API_URL` is correct
- Verify backend is running
- Check browser Network tab for actual errors

**Mixed content warnings**
- Ensure both frontend and backend use HTTPS
- Update `VITE_API_URL` to use `https://`

**SPA routing broken**
- Verify `_redirects` file exists in `public/`
- Or check `netlify.toml` has redirect rules

### Getting Help

1. Check application logs (Render/Netlify dashboards)
2. Test endpoints with curl/Postman
3. Review browser console and network tab
4. Check GitHub Issues

---

## Continuous Deployment

Both Render and Netlify support auto-deploy on push to `main` branch.

### GitHub Actions (Optional)

The included CI/CD workflows handle:
- **CI** (`ci.yml`): Runs tests on PRs
- **CD** (`cd.yml`): Builds Docker images for releases

For Render/Netlify, direct GitHub integration is simpler and recommended.

---

## Cost Estimation

| Service | Free Tier | Paid Starting |
|---------|-----------|---------------|
| Render Backend | ✅ (spins down after 15min) | $7/month |
| Render PostgreSQL | ✅ (90 days) | $7/month |
| Netlify Frontend | ✅ (100GB bandwidth) | $19/month |
| Neon Database | ✅ (10GB storage) | $19/month |

**Recommended for production**: Render paid tier ($7/mo) to avoid cold starts.

---

**🎉 Congratulations!** Your Smart Waste Platform is now deployed!

For local development, see [README.md](README.md).
