# Deployment Guide for Smart Waste AI

## Current Issues & Fixes

### ✅ Frontend (Netlify) - FIXED
The frontend builds successfully and is deployed at `https://wastifi.netlify.app`

### ⚠️ Backend (Render) - NEEDS CONFIGURATION

The backend API requires proper environment variables to enable CORS and ML classification.

---

## Backend Configuration (Render)

### Required Environment Variables

Set these in your Render dashboard under **Environment Variables**:

```bash
# Application
APP_ENV=production
SECRET_KEY=your-secret-key-min-32-characters-long
DEBUG=false

# CORS - Critical for frontend to work
ALLOWED_ORIGINS=https://wastifi.netlify.app,http://localhost:3000,http://localhost:5173

# Database (Auto-set by Render if using their PostgreSQL)
DATABASE_URL=postgresql://...

# Redis (If using external Redis)
REDIS_URL=redis://...

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-min-32-characters
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ML Classification - For Accurate Results
USE_CLIP_CLASSIFIER=true
CLIP_MODEL_ID=openai/clip-vit-base-patch32
CLIP_DEVICE=cpu
# For better performance with GPU: CLIP_DEVICE=cuda

# Storage (Optional - defaults to local)
STORAGE_BACKEND=local
# For S3: STORAGE_BACKEND=s3
# S3_ACCESS_KEY_ID=...
# S3_SECRET_ACCESS_KEY=...
# S3_BUCKET_NAME=...
# S3_REGION=us-east-1

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST=10
```

### Install Dependencies on Render

Ensure your `requirements.txt` includes:
```txt
# Core dependencies are already in requirements.txt
# For ML classification, ensure these are included:
transformers>=4.35.0
torch>=2.0.0
pillow>=10.0.0
```

**Note:** On Render's free tier (CPU only), CLIP inference will be slower (~1-3 seconds per image). Upgrade to a paid plan with GPU for faster classification (~50-200ms).

---

## Frontend Configuration (Netlify)

### Set Environment Variable

In Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add:
   ```
   VITE_API_URL=https://smartwaste-api-byb5.onrender.com
   ```
3. **Trigger a new deploy** for changes to take effect

### Build Settings (Already Configured)

```toml
[build]
  base = "apps/web"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"
```

---

## Deployment Checklist

### Backend (Render)
- [ ] Set all required environment variables
- [ ] Ensure `ALLOWED_ORIGINS` includes `https://wastifi.netlify.app`
- [ ] Set `USE_CLIP_CLASSIFIER=true` for accurate classification
- [ ] Verify Python dependencies are installed (check build logs)
- [ ] Test endpoints: `https://your-api.onrender.com/health`
- [ ] Check CORS: Browser console should not show CORS errors

### Frontend (Netlify)
- [ ] Set `VITE_API_URL` environment variable
- [ ] Trigger redeploy after setting env var
- [ ] Test upload functionality
- [ ] Verify API calls succeed (no CORS errors)
- [ ] Check that classification results appear

---

## Testing Deployment

### 1. Test Backend Health
```bash
curl https://smartwaste-api-byb5.onrender.com/health
# Expected: {"status": "healthy"}
```

### 2. Test CORS (from browser console on Netlify site)
```javascript
fetch('https://smartwaste-api-byb5.onrender.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
```
Expected: No CORS error (may get 401 Unauthorized, which is fine)

### 3. Test Classification
1. Go to https://wastifi.netlify.app/dashboard/upload
2. Upload an image of waste
3. Should get classification results within 1-5 seconds
4. Check accuracy of category/bin type

---

## Troubleshooting

### CORS Errors
**Problem:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Solutions:**
1. Verify `ALLOWED_ORIGINS` in Render includes exact Netlify URL
2. Redeploy backend after changing environment variables
3. Check Render logs for CORS middleware initialization

### Classification Inaccurate
**Problem:** Items classified incorrectly or as "Unknown"

**Solutions:**
1. Set `USE_CLIP_CLASSIFIER=true` on Render
2. Ensure transformers, torch, pillow are installed
3. Check Render logs for ML initialization errors
4. Consider upgrading to GPU-enabled plan for better CLIP performance
5. Adjust confidence thresholds in code if needed

### Slow Upload/Classification
**Problem:** Takes >5 seconds to classify

**Solutions:**
1. Render free tier cold starts can be slow (wait 30-60s on first request)
2. Upgrade to paid tier to avoid cold starts
3. Add GPU for faster CLIP inference
4. Reduce image size on frontend before uploading

### 404 Errors on API Endpoints
**Problem:** Some endpoints return 404

**Solutions:**
1. Check backend routes are properly registered
2. Verify URL paths match API specification
3. Check Render logs for startup errors

---

## Performance Optimization

### Backend
- Enable GPU on Render for 10-20x faster classification
- Use Redis for caching classification results
- Configure connection pooling for database
- Enable gzip compression for API responses

### Frontend
- Resize images before upload (max 1024px)
- Implement client-side image validation
- Add loading states and progress indicators
- Cache user profile and static data

---

## Security Best Practices

1. **Generate strong secrets:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Enable HTTPS only** (already configured)

3. **Rotate secrets regularly** (every 90 days)

4. **Monitor logs** for suspicious activity

5. **Set up rate limiting** (already configured)

---

## Next Steps

1. **Push backend CORS fix:**
   ```bash
   git push origin main
   ```
   Render will auto-deploy the new code

2. **Configure Netlify environment variable:**
   - Add `VITE_API_URL`
   - Trigger redeploy

3. **Test end-to-end:**
   - Register new user
   - Upload waste image
   - Verify classification works
   - Check points/rewards system

4. **Monitor:**
   - Backend logs on Render
   - Frontend Network tab for API calls
   - Error tracking (consider adding Sentry)

---

## Support

If issues persist after following this guide:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure database migrations have run
5. Test API endpoints directly with curl/Postman
