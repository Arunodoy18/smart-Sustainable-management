# 🚀 Deployment Guide - Render & Netlify

## Overview
This guide will help you deploy the Smart Waste Management app:
- **Backend** → Render (Web Service)
- **Frontend** → Netlify (Static Site)

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub repository with your code
- ✅ [Render](https://render.com) account (free tier available)
- ✅ [Netlify](https://netlify.com) account (free tier available)
- ✅ Supabase project set up
- ✅ OpenAI API key
- ✅ Google Maps API key
- ✅ PostgreSQL database (can use Render's free PostgreSQL or Supabase)

---

## 🔧 Step 1: Deploy Backend to Render

### 1.1 Create PostgreSQL Database (Optional)
If not using Supabase as your database:

1. Go to Render Dashboard
2. Click **New +** → **PostgreSQL**
3. Name: `smart-waste-db`
4. Select Free tier
5. Click **Create Database**
6. Copy the **Internal Database URL** (starts with `postgresql://`)

### 1.2 Deploy Backend Service

1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `smart-waste-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `bash start.sh`
   - **Instance Type**: Free

### 1.3 Add Environment Variables

In the Render service settings, add these environment variables:

```bash
# Core Settings
ENVIRONMENT=production
PROJECT_NAME=Smart Waste Management AI
API_V1_STR=/api/v1

# Security - IMPORTANT: Generate a secure key!
# Generate with: openssl rand -hex 32
SECRET_KEY=your-generated-secret-key-min-32-characters

# Database
DATABASE_URL=your-postgresql-connection-string
# Example: postgresql://user:password@host:5432/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key
MODEL_NAME=gpt-4o

# CORS
FRONTEND_URL=https://your-app.netlify.app
```

### 1.4 Verify Deployment

1. Wait for deployment to complete
2. Visit: `https://smart-waste-backend.onrender.com/health`
3. Should return: `{"status": "ok", "version": "..."}`
4. Check API docs: `https://smart-waste-backend.onrender.com/docs`

**Important**: Note your backend URL for frontend configuration!

---

## 🎨 Step 2: Deploy Frontend to Netlify

### 2.1 Deploy Site

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repository
4. Configure:
   - **Branch**: `main`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### 2.2 Add Environment Variables

In Netlify: Site settings → Environment variables, add:

```bash
# API Configuration
VITE_API_URL=https://smart-waste-backend.onrender.com/api/v1

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 2.3 Trigger Redeploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for build to complete

### 2.4 Configure Custom Domain (Optional)

1. Go to **Domain settings**
2. Add your custom domain
3. Follow DNS configuration instructions

---

## ✅ Step 3: Verify Everything Works

### Backend Health Check
```bash
curl https://smart-waste-backend.onrender.com/health
```

### Frontend Connection
1. Visit your Netlify URL: `https://your-app.netlify.app`
2. Open browser console (F12)
3. Look for: `🔗 API Base URL: https://...`
4. Try signing up/logging in

### Test Features
- ✅ User signup/login
- ✅ Google OAuth
- ✅ Waste classification (upload image)
- ✅ Driver dashboard
- ✅ Analytics page

---

## 🔄 Continuous Deployment

Both Render and Netlify support automatic deployments:
- Push to `main` branch → Automatically deploys
- No manual steps needed after initial setup

---

## 📊 Monitoring

### Render
- View logs: Service → **Logs** tab
- Monitor resources: Service → **Metrics** tab

### Netlify
- View build logs: Site → **Deploys** tab
- Function logs: Site → **Functions** tab

---

## 🐛 Troubleshooting

### Backend issues

**Backend returns 500 errors:**
- Check Render logs for detailed errors
- Verify DATABASE_URL is correct
- Ensure SUPABASE credentials are set

**Health check fails:**
- Wait 2-3 minutes for service to start
- Check logs for startup errors

### Frontend issues

**API connection fails:**
- Verify VITE_API_URL is set correctly
- Check browser console for CORS errors
- Ensure backend is running

**Build fails:**
- Check Netlify build logs
- Verify all VITE_ environment variables are set
- Try clearing cache and redeploying

**Auth not working:**
- Verify Supabase credentials
- Check Supabase dashboard → Authentication settings
- Ensure redirect URLs are configured

---

## 💰 Cost Estimates

### Free Tier (Recommended for testing)
- **Render Free**: 750 hours/month, sleeps after inactivity
- **Netlify Free**: 100GB bandwidth, unlimited sites
- **Supabase Free**: 500MB database, 2GB bandwidth
- **Total**: $0/month

### Paid Tier (Recommended for production)
- **Render Starter**: $7/month (always on, no sleep)
- **Netlify Pro**: $19/month (100GB bandwidth)
- **Supabase Pro**: $25/month (8GB database)
- **Total**: ~$51/month

---

## 🔐 Security Checklist

Before going to production:
- ✅ Use strong SECRET_KEY (generated, not default)
- ✅ Enable HTTPS (automatic on Render/Netlify)
- ✅ Configure proper CORS origins
- ✅ Never commit .env files
- ✅ Use Supabase RLS (Row Level Security)
- ✅ Rotate API keys regularly
- ✅ Monitor error logs

---

## 🎉 Success!

Your app is now live! Share your URLs:
- Frontend: `https://your-app.netlify.app`
- Backend API: `https://smart-waste-backend.onrender.com/docs`

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
