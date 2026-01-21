# Railway Deployment Guide

## Quick Setup

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `smart-Sustainable-management` repository
5. Railway will auto-detect the Dockerfile

## Environment Variables

Add these in Railway dashboard:

```
APP_ENV=production
DEBUG=false  
DATABASE_URL=<will-be-set-by-railway-postgres>
REDIS_URL=<will-be-set-by-railway-redis>
JWT_SECRET_KEY=<generate-random-32-chars>
ALLOWED_ORIGINS=https://wastifi.netlify.app
STORAGE_BACKEND=local
PORT=8000
```

## Add Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Click "New" → "Database" → "Add Redis"
3. Railway will automatically set DATABASE_URL and REDIS_URL

## Run Migrations

After first deployment:
1. Open service → Settings → "Connect"
2. Run: `alembic upgrade head`

## Done!

Your API will be live at: `https://<your-service>.up.railway.app`

## Advantages

- ✅ Better Docker support
- ✅ Auto-detects Dockerfile  
- ✅ No YAML configuration needed
- ✅ Built-in PostgreSQL and Redis
- ✅ Free tier with $5/month credit
