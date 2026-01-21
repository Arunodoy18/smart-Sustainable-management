# Deployment Checklist - Smart Waste AI

## Pre-Deployment Checks

### Code Changes
- [ ] All code changes committed and pushed to main branch
- [ ] All tests passing locally
- [ ] No linting errors
- [ ] Updated version number (if applicable)

### Database Migrations
- [ ] Migration files reviewed and tested locally
- [ ] Migration history is linear: `alembic history --verbose`
- [ ] Current migration matches expectations: `alembic current`
- [ ] Migration files follow naming convention: `<revision_id>_<description>.py`
- [ ] No migration files were renamed or deleted

### Environment Variables
- [ ] All required environment variables are set on Render
- [ ] Database URL is correct
- [ ] Redis URL is correct (if used)
- [ ] JWT secret keys are set
- [ ] CORS origins include production URL
- [ ] Storage backend configured correctly

## Deployment Steps (Render)

### 1. Run Database Migrations on Production

**Before deploying code changes**, connect to the production environment and run migrations:

```bash
# Option A: Using Render Shell
# 1. Go to Render Dashboard
# 2. Select your service
# 3. Click "Shell" tab
# 4. Run:
python -m alembic current
python -m alembic upgrade head
```

```bash
# Option B: Using Render CLI
render shell
alembic current
alembic upgrade head
```

**Verify migrations were successful:**
```bash
alembic current
# Should show: <latest_revision_id> (head)
```

### 2. Deploy Application Code

- Render will automatically deploy when you push to main branch (if auto-deploy is enabled)
- Or manually trigger deploy from Render dashboard

### 3. Monitor Deployment

- [ ] Watch Render logs for any startup errors
- [ ] Check for database connection errors
- [ ] Check for migration-related errors (shouldn't happen since we ran migrations first)

### 4. Post-Deployment Verification

```bash
# Check health endpoint
curl https://your-app.onrender.com/health
# Expected: {"status":"healthy"}

# Check API is responding
curl https://your-app.onrender.com/api/v1/health
```

**Verify in browser:**
- [ ] Frontend can connect to API
- [ ] Users can log in
- [ ] Core features work (upload waste, create pickup, etc.)
- [ ] No console errors related to API responses

## If Deployment Fails

### Scenario 1: Migration Failed

```bash
# Check what went wrong
alembic current
alembic history

# If migration partially applied, rollback
alembic downgrade -1

# Fix the migration file locally
# Test the fix
# Push the fix
# Try again
alembic upgrade head
```

### Scenario 2: App Won't Start

**Check Render logs for:**
- Import errors → missing dependencies
- Database connection errors → check DATABASE_URL
- Migration errors → this shouldn't happen if you ran migrations first

**Common fixes:**
```bash
# If you need to force-mark migrations as applied
# (only if you're CERTAIN the schema is correct)
alembic stamp head
```

### Scenario 3: App Started But Not Working

- Check Render logs for runtime errors
- Check frontend console for API errors
- Verify all environment variables are set
- Check CORS configuration

## Rollback Procedure

If you need to rollback a deployment:

### 1. Rollback Code
- In Render dashboard, select a previous deployment
- Click "Redeploy"

### 2. Rollback Database (if needed)
```bash
# Connect to Render shell
render shell

# Rollback one migration
alembic downgrade -1

# Or rollback to specific revision
alembic downgrade <revision_id>
```

⚠️ **WARNING**: Rolling back migrations can cause data loss. Only do this if:
- The migration added new columns (safe to remove)
- No production data has been written to new tables/columns

**NEVER rollback migrations that:**
- Drop columns or tables
- Modify existing data
- Have been live for more than a few minutes

## Post-Deployment Tasks

- [ ] Update team in Slack/Discord that deployment is complete
- [ ] Monitor error tracking (Sentry, if configured)
- [ ] Monitor user activity for any unusual patterns
- [ ] Update deployment notes in project docs
- [ ] Tag release in git: `git tag v1.0.0 && git push --tags`

## Emergency Contacts

- **Technical Lead**: [Name/Contact]
- **Database Admin**: [Name/Contact]
- **Render Support**: https://render.com/support

## Common Issues Reference

### "KeyError in revision map"
- Empty or corrupted migration file
- Migration file was renamed or deleted
- **Fix**: Check migration files, run `alembic current` and `alembic history`

### "Enum type 'xxx' already exists"
- Migration trying to create enum that exists
- **Fix**: Modify migration to check if enum exists first

### "Target database is not up to date"
- Migrations not run before deployment
- **Fix**: Run `alembic upgrade head`

### "Cannot connect to database"
- DATABASE_URL not set or incorrect
- Database not accessible from app
- **Fix**: Check environment variables and database connection

## Notes

- Always test migrations on staging/local before production
- Always run migrations BEFORE deploying code
- Never auto-run migrations on app startup in production
- Keep this checklist updated with lessons learned
