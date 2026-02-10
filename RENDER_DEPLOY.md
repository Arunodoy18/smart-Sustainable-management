# Render Deployment Guide (512MB Free Tier)
## Smart Waste AI Backend

This backend is optimized for Render's free tier (512MB RAM) using MobileNetV2.

## ✅ Pre-Deployment Checklist

### Required Environment Variables (Render Dashboard)

```bash
# Database (Use Render PostgreSQL Add-on)
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/dbname

# Redis (Use Render Redis Add-on or free Redis Cloud)
REDIS_URL=redis://user:pass@host:port

# Security
JWT_SECRET=<generate-32-char-random-string>
SECRET_KEY=<generate-32-char-random-string>

# ML Configuration (CRITICAL for 512MB RAM)
ML_CLASSIFIER_TYPE=mobilenet  # DO NOT use 'clip' on free tier!
USE_CLIP_CLASSIFIER=false

# CORS (Add your Netlify domain)
CORS_ORIGINS=https://wastifi.netlify.app,https://your-app.netlify.app
FRONTEND_URL=https://wastifi.netlify.app

# Application
APP_ENV=production
DEBUG=false
APP_NAME=Smart Waste AI

# Optional: Storage (for images)
STORAGE_BACKEND=local  # or s3
# If using S3:
# S3_BUCKET_NAME=your-bucket
# S3_ACCESS_KEY_ID=xxx
# S3_SECRET_ACCESS_KEY=xxx
# S3_REGION=us-east-1
```

## 📦 Build & Start Commands (Render Dashboard)

### Build Command:
```bash
cd apps/api && pip install -r requirements.txt
```

### Start Command:
```bash
cd apps/api && alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

## 🚀 Deployment Steps

### 1. Create Render PostgreSQL Database
1. Go to Render → New → PostgreSQL
2. Name: `smart-waste-db`
3. Plan: Free
4. Copy the **Internal Database URL**

### 2. Create Render Redis (Optional but Recommended)
1. Use https://redis.com/ Free plan (30MB)
2. Or use Render Redis (paid)
3. Copy the connection URL

### 3. Create Web Service
1. Go to Render → New → Web Service
2. Connect your GitHub repo
3. Configuration:
   - **Name**: `smart-waste-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: `Python 3`
   - **Build Command**: `cd apps/api && pip install -r requirements.txt`
   - **Start Command**: `cd apps/api && alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 4. Add Environment Variables
Add all variables from the checklist above.

### 5. Deploy
Click "Create Web Service" and wait for deployment.

## ⚡ Performance Optimization for 512MB

### Memory Budget:
- Python Runtime: ~50MB
- FastAPI + Dependencies: ~100MB
- PostgreSQL Driver: ~30MB
- **MobileNetV2 Model**: ~50-100MB ✅
- Redis Client: ~10MB
- Request Overhead: ~50MB
- **Total: ~290-340MB** ✅ Fits in 512MB!

### Why MobileNetV2 Works on Free Tier:
- **Model Size**: Only 14MB on disk
- **Memory Usage**: 50-100MB during inference
- **Speed**: 50-150ms per classification (CPU)
- **Accuracy**: 70-85% for waste categories

### ⚠️ DO NOT Use CLIP on Free Tier:
- Model Size: 150MB
- Memory Usage: 500MB-1GB during inference
- **Will cause OOM (Out of Memory) crashes**

## 🔍 Health Check

After deployment, verify:

```bash
# Check health
curl https://your-app.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": true,
    "cache": true,
    "ml": true,
    "storage": true
  }
}

# Check ML model info
curl https://your-app.onrender.com/api/v1/admin/health

# Should show "mobilenet_v2" as classifier
```

## 📊 Monitoring

### Check Logs (Render Dashboard):
- Look for: `"ML pipeline initialized", classifier="mobilenet_v2"`
- Memory usage should stay **under 400MB**

### If Memory Issues:
1. Verify `ML_CLASSIFIER_TYPE=mobilenet` (NOT clip!)
2. Check `USE_CLIP_CLASSIFIER=false`
3. Restart the service

## 🔄 Auto-Deploy on Push

Render automatically redeploys when you push to `main` branch.

## 🐛 Troubleshooting

### Issue: "Module not found" errors
**Fix**: Verify `requirements.txt` includes:
```
torch>=2.1.0
torchvision>=0.16.0
pillow>=10.2.0
```

### Issue: Out of Memory
**Fix**: 
1. Set `ML_CLASSIFIER_TYPE=mobilenet`
2. Set `USE_CLIP_CLASSIFIER=false`
3. Restart service

### Issue: Database connection failed
**Fix**: Use **Internal Database URL** from PostgreSQL add-on (starts with `postgresql://`)

### Issue: CORS errors
**Fix**: Add your Netlify domain to `CORS_ORIGINS` environment variable

## 📱 Connect Frontend

Update your Netlify environment variables:

```bash
VITE_API_URL=https://your-app.onrender.com
```

**Important**: Do NOT include `/api/v1` in `VITE_API_URL`!

## ✅ Production Checklist

- [ ] PostgreSQL database created
- [ ] Redis connection configured
- [ ] All environment variables set
- [ ] `ML_CLASSIFIER_TYPE=mobilenet` configured
- [ ] Build command set correctly
- [ ] Start command includes `alembic upgrade head`
- [ ] CORS origins include Netlify domain
- [ ] Health check returns 200 OK
- [ ] Frontend can connect to backend
- [ ] Image upload works
- [ ] AI classification returns results

## 🎉 Done!

Your backend is now deployed on Render with real AI classification!
