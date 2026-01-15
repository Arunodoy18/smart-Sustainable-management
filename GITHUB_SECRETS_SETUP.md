# 🔐 GitHub Secrets - Quick Reference

**Repository:** https://github.com/Arunodoy18/smart-Sustainable-management  
**Settings:** https://github.com/Arunodoy18/smart-Sustainable-management/settings/secrets/actions

---

## ⚠️ ACTION REQUIRED: Add These 3 Secrets

### 1️⃣ Google Maps API Key
```
Name: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: AIzaSyDsB2d8WisWd2a2zsuOurWUZPJgYvimfo4
```

**Then restrict in Google Cloud Console:**
- URL: https://console.cloud.google.com/apis/credentials
- Click your API key
- Application restrictions → HTTP referrers:
  ```
  http://localhost:3000/*
  https://*.azurecontainerapps.io/*
  ```

---

### 2️⃣ Supabase URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://rjridgeocwgqpyuxjlsv.supabase.co
```

---

### 3️⃣ Supabase Anon Key
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqcmlkZ2VvY3dncXB5dXhqbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyNjg0NDQsImV4cCI6MjA1Mjg0NDQ0NH0.sb_publishable_YaXbqb_eePQD29d38qN1g_5hyINSIj
```

---

## ✅ Already Configured (No Action Needed)

- ✅ AZURE_CREDENTIALS
- ✅ REGISTRY_LOGIN_SERVER
- ✅ REGISTRY_USERNAME
- ✅ REGISTRY_PASSWORD
- ✅ NEXT_PUBLIC_API_URL
- ✅ NEXT_PUBLIC_WS_URL

---

## 🚀 After Adding Secrets

**Option 1 - Re-run Failed Workflow:**
1. Go to: https://github.com/Arunodoy18/smart-Sustainable-management/actions
2. Click the most recent failed workflow
3. Click "Re-run all jobs"

**Option 2 - Trigger New Deployment:**
```bash
git commit --allow-empty -m "chore: trigger deployment with new secrets"
git push origin main
```

**Expected Result:**
- ✅ Validate job passes
- ✅ Build-and-push job passes
- ✅ Deploy job passes
- ✅ LIVE URL updated within 5-10 minutes

---

## 🎯 Verification

Visit: https://frontend.jollysea-c5c0b121.centralus.azurecontainerapps.io

**Should see:**
- ✅ Login page with animated background
- ✅ No console errors
- ✅ Google Maps loads on `/driver` page
- ✅ Auth works (Supabase)

---

*Last Updated: 2026-01-15*
