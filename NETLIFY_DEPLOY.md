# Netlify Deployment Guide
## Smart Waste AI Frontend

This React + Vite frontend is optimized for Netlify deployment.

## ✅ Pre-Deployment Checklist

### Required Environment Variables (Netlify Dashboard)

```bash
# Backend API URL (Your Render deployment)
VITE_API_URL=https://your-backend.onrender.com

# Application
VITE_APP_NAME=Smart Waste Platform

# Environment
VITE_ENV=production

# Optional: Mapbox for maps (if using)
# VITE_MAPBOX_TOKEN=your-token
```

## 📦 Build Settings (Netlify Dashboard)

### Configuration:
- **Base directory**: `apps/web`
- **Build command**: `npm run build`
- **Publish directory**: `apps/web/dist`
- **Node version**: `20`

## 🚀 Deployment Steps

### 1. Connect Repository
1. Go to Netlify → Add new site → Import existing project
2. Connect to GitHub
3. Select your `smart-Sustainable-management` repository

### 2. Configure Build Settings
```
Base directory: apps/web
Build command: npm run build
Publish directory: apps/web/dist
```

### 3. Add Environment Variables
Go to Site settings → Environment variables:
- Add `VITE_API_URL` = `https://your-backend.onrender.com`
- **Important**: No `/api/v1` suffix!

### 4. Deploy Site Settings
- **Node version**: 20 (set in Netlify UI or add `NODE_VERSION=20` env var)
- **npm version**: 10

### 5. Deploy
Click "Deploy site" and wait.

## 🔍 Post-Deployment Verification

### 1. Check Build Logs
Look for:
```
✓ built in XXXms
✓ dist/index.html ... size: ...
```

### 2. Test Site
Visit your Netlify domain (e.g., `https://your-app.netlify.app`)

### 3. Test Backend Connection
1. Open DevTools → Console
2. Should see no CORS errors
3. Try:
   - Register new account
   - Upload waste image
   - Check that AI classification works

## 📱 netlify.toml Configuration

The project includes `apps/web/netlify.toml` with:
- ✅ SPA routing redirects (`/* → /index.html`)
- ✅ Security headers
- ✅ Asset caching
- ✅ Build settings

## 🔄 Auto-Deploy on Push

Netlify automatically redeploys when you push to `main` branch.

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or network errors
**Fix**: 
1. Verify `VITE_API_URL` is set correctly
2. Check it does NOT end with `/api/v1`
3. Backend must be running and accessible

### Issue: CORS errors
**Fix**: 
1. Go to Render backend environment variables
2. Add your Netlify domain to `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://wastifi.netlify.app,https://your-app.netlify.app
   ```
3. Redeploy backend

### Issue: 404 on page refresh
**Fix**: This is handled by `netlify.toml` redirect. If still happening:
1. Check `apps/web/netlify.toml` exists
2. Verify redirect rule: `/* → /index.html`

### Issue: Build fails
**Fix**:
1. Check Node version is 20
2. Verify `apps/web/package.json` has all dependencies
3. Check build command: `npm run build`

## 🎨 Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add custom domain
3. Update `CORS_ORIGINS` in backend to include new domain

## ⚡ Performance Tips

### 1. Enable Branch Deploys
Deploy preview branches for testing before production.

### 2. Configure Split Testing
Test new features with a subset of users.

### 3. Add Netlify Functions
For edge functions if needed.

## ✅ Production Checklist

- [ ] Netlify site created and connected
- [ ] Build settings configured correctly
- [ ] `VITE_API_URL` environment variable set
- [ ] Backend URL does NOT include `/api/v1`
- [ ] Site builds successfully
- [ ] Site accessible at Netlify domain
- [ ] Backend API connection works (no CORS errors)
- [ ] Can register/login
- [ ] Can upload images
- [ ] AI classification returns results
- [ ] Maps render correctly
- [ ] All pages load without errors

## 🔐 Security Headers

`netlify.toml` includes:
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy
- ✅ Permissions-Policy

## 📊 Analytics (Optional)

Add Netlify Analytics for visitor insights:
- Go to Site settings → Analytics
- Enable Netlify Analytics

## 🎉 Done!

Your frontend is now deployed on Netlify with full backend integration!

## 🔗 Next Steps

1. Test end-to-end workflow:
   - Register → Upload image → See AI classification → Check history
2. Set up custom domain
3. Enable HTTPS (automatic on Netlify)
4. Monitor performance with Web Vitals
