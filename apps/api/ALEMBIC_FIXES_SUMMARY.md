# Alembic Stabilization - Summary of Changes

## Date: January 21, 2026

## Issues Fixed

### 1. ✅ Empty Migration File Breaking Revision Chain
**Problem**: The file `a1b2c3d4e5f6_fix_enum_values.py` was completely empty, causing Alembic to fail with `KeyError` in the revision map.

**Solution**: Populated the file with a proper no-op migration that maintains chain integrity:
```python
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3b11939b5277'

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
```

**Impact**: Alembic can now read the migration chain without errors.

---

### 2. ✅ Enum Value Mismatch (Database vs. Python)
**Problem**: The initial migration created PostgreSQL enums with UPPERCASE values:
```sql
CREATE TYPE user_role AS ENUM ('CITIZEN', 'DRIVER', 'ADMIN');
```

But Python enum classes used lowercase:
```python
class UserRole(str, enum.Enum):
    CITIZEN = "citizen"  # ❌ Mismatch!
```

**Solution**: Updated all Python enum values to UPPERCASE to match database:
```python
class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"  # ✅ Matches database
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"
```

**Enums Updated**:
- `UserRole`: CITIZEN, DRIVER, ADMIN
- `UserStatus`: PENDING, ACTIVE, SUSPENDED, DEACTIVATED
- `WasteCategory`: ORGANIC, RECYCLABLE, HAZARDOUS, ELECTRONIC, GENERAL, MEDICAL
- `WasteSubCategory`: FOOD_WASTE, PLASTIC, PAPER, GLASS, etc.
- `BinType`: GREEN, BLUE, RED, BLACK, YELLOW, SPECIAL
- `ClassificationConfidence`: HIGH, MEDIUM, LOW
- `WasteEntryStatus`: PENDING, CLASSIFIED, VERIFIED, PICKUP_REQUESTED, COLLECTED, CANCELLED
- `DriverStatus`: PENDING_APPROVAL, APPROVED, SUSPENDED, INACTIVE
- `PickupStatus`: REQUESTED, ASSIGNED, EN_ROUTE, ARRIVED, COLLECTED, CANCELLED, FAILED
- `PickupPriority`: LOW, NORMAL, HIGH, URGENT
- `RewardType`: RECYCLING_POINTS, STREAK_BONUS, etc.
- `AchievementCategory`: RECYCLING, CONSISTENCY, COMMUNITY, etc.

**Impact**: 
- ✅ No more type mismatches when inserting/querying data
- ⚠️ Breaking change for frontend - API now returns UPPERCASE values

---

### 3. ✅ Automatic Migration Execution on Startup
**Problem**: `start.sh` ran `alembic upgrade head` automatically on every app startup:
```bash
echo "Running database migrations..."
python -m alembic upgrade head

echo "Starting application..."
exec uvicorn src.main:app
```

**Why this is dangerous**:
- Migrations can fail midway, breaking the app
- No visibility into what's happening
- Hard to debug migration issues
- Can cause downtime during auto-restart
- Production databases should never be migrated automatically

**Solution**: 
1. Removed automatic migration from `start.sh`
2. Updated `Dockerfile` to not run migrations in CMD
3. Added database connectivity check and migration status check
4. App now starts immediately without touching migrations

**Impact**: 
- ✅ App can start even if migrations are pending
- ✅ Migrations must be run manually (safer for production)
- ✅ Better visibility and control

---

### 4. ✅ Frontend Enum Value Mismatches
**Problem**: Frontend TypeScript types expected lowercase enum values:
```typescript
export type UserRole = 'citizen' | 'driver' | 'admin';
```

But API now returns UPPERCASE.

**Solution**: Updated all frontend TypeScript types to match backend:
```typescript
export type UserRole = 'CITIZEN' | 'DRIVER' | 'ADMIN';
```

**Files Updated**:
- `apps/web/src/types/api.ts` - Type definitions
- `apps/web/src/components/layouts/MainLayout.tsx` - Role checks
- `apps/web/src/lib/hooks/useAuth.ts` - Login redirect logic
- `apps/web/src/pages/dashboard/PickupsPage.tsx` - Status filters
- `apps/web/src/pages/driver/DriverPickupsPage.tsx` - Status filters

**Impact**: Frontend and backend now use consistent enum values.

---

## New Files Created

### 1. `ALEMBIC_GUIDE.md`
Comprehensive guide covering:
- Quick reference commands
- Critical rules (what NEVER to do)
- Standard workflow
- Recovery procedures
- Enum handling
- Troubleshooting

### 2. `DEPLOYMENT_CHECKLIST.md`
Production deployment checklist including:
- Pre-deployment checks
- Step-by-step deployment procedure
- Migration running steps
- Rollback procedures
- Common issues and fixes

---

## Files Modified

### Configuration & Setup
- ✅ `alembic.ini` - Better documentation and removed hardcoded DB URL
- ✅ `alembic/env.py` - Added guardrails, comments, better error handling
- ✅ `start.sh` - Removed auto-migration, added safety checks
- ✅ `Dockerfile` - Removed auto-migration from CMD
- ✅ `README.md` - Added migration instructions

### Migration Files
- ✅ `alembic/versions/3b11939b5277_initial_schema.py` - Added safety comments
- ✅ `alembic/versions/a1b2c3d4e5f6_fix_enum_values.py` - Fixed empty file

### Python Models (Backend)
- ✅ `src/models/user.py` - Fixed UserRole, UserStatus enums
- ✅ `src/models/waste.py` - Fixed WasteCategory, WasteSubCategory, BinType, etc.
- ✅ `src/models/pickup.py` - Fixed DriverStatus, PickupStatus, PickupPriority
- ✅ `src/models/rewards.py` - Fixed RewardType, AchievementCategory

### Frontend (TypeScript)
- ✅ `apps/web/src/types/api.ts` - Updated all enum types to UPPERCASE
- ✅ `apps/web/src/components/layouts/MainLayout.tsx` - Updated role checks
- ✅ `apps/web/src/lib/hooks/useAuth.ts` - Updated role-based routing
- ✅ `apps/web/src/pages/dashboard/PickupsPage.tsx` - Updated status filters
- ✅ `apps/web/src/pages/driver/DriverPickupsPage.tsx` - Updated status filters

---

## How to Apply These Changes

### Locally
```bash
# Backend
cd apps/api

# Check migration status
alembic current

# Apply migrations (if needed)
alembic upgrade head

# Start server
uvicorn src.main:app --reload

# Frontend
cd apps/web
npm install
npm run dev
```

### On Render (Production)

⚠️ **CRITICAL: Run migrations BEFORE deploying code**

```bash
# 1. Connect to Render shell
render shell

# 2. Check current state
alembic current

# 3. Run migrations
alembic upgrade head

# 4. Verify
alembic current

# 5. Exit shell
exit
```

Then deploy the code via Render dashboard or auto-deploy.

---

## Testing the Fixes

### Backend Testing
```bash
# Test migration chain
alembic history
alembic current

# Test enum values in Python
python -c "from src.models.user import UserRole; print(UserRole.CITIZEN.value)"
# Expected: CITIZEN

# Start server and test API
uvicorn src.main:app --reload
curl http://localhost:8000/health
```

### Frontend Testing
1. Start backend and frontend
2. Register a new user
3. Check browser console - API should return:
   ```json
   {
     "role": "CITIZEN",
     "status": "ACTIVE"
   }
   ```
4. Verify navigation works based on role
5. Test pickup status filtering

---

## What NOT To Do

❌ **DO NOT** rename the migration files  
❌ **DO NOT** delete the `a1b2c3d4e5f6_fix_enum_values.py` file  
❌ **DO NOT** modify the enum values back to lowercase  
❌ **DO NOT** run migrations automatically in production  
❌ **DO NOT** skip running migrations before deploying  

---

## Recovery if Deployment Still Fails

### "Can't locate revision a1b2c3d4e5f6"
```bash
# Check if file exists
ls alembic/versions/

# If missing, restore from git:
git checkout HEAD -- alembic/versions/a1b2c3d4e5f6_fix_enum_values.py
```

### "Database has migration XXX but code doesn't"
```bash
# Mark current schema as up-to-date
alembic stamp head
```

### "Enum value mismatch"
This means data was inserted with lowercase values. You'll need to update the data:
```sql
UPDATE users SET role = UPPER(role);
UPDATE users SET status = UPPER(status);
-- etc for other tables
```

---

## Success Criteria

✅ `alembic current` shows: `a1b2c3d4e5f6 (head)`  
✅ `alembic history` shows linear chain with no errors  
✅ App starts without running migrations  
✅ Render deployment succeeds  
✅ API returns UPPERCASE enum values  
✅ Frontend correctly handles UPPERCASE enum values  
✅ Users can register, login, and use the app  

---

## Questions?

See:
- `ALEMBIC_GUIDE.md` for detailed Alembic documentation
- `DEPLOYMENT_CHECKLIST.md` for deployment procedures
- FastAPI + Alembic docs: https://alembic.sqlalchemy.org/
