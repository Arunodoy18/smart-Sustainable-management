# 🚀 Alembic Quick Reference - Smart Waste AI

## ⚡ Most Common Commands

```bash
# Check current migration
alembic current

# Apply all migrations
alembic upgrade head

# View migration history
alembic history

# Generate new migration
alembic revision --autogenerate -m "add user preferences"
```

## 🔥 Production Deployment

**ALWAYS run migrations BEFORE deploying code:**

```bash
# 1. On Render, open Shell
render shell

# 2. Run migration
alembic upgrade head

# 3. Verify
alembic current

# 4. Exit and deploy code
```

## ⛔ Critical Rules

| ❌ NEVER DO THIS | ✅ DO THIS INSTEAD |
|------------------|-------------------|
| Rename migration files | Leave filenames unchanged |
| Delete migration files | Create new migration to reverse |
| Modify applied migrations | Create new migration for changes |
| Change enum values | They're immutable - create new ones |
| Auto-run migrations on startup | Run manually before deployment |

## 🐛 Quick Troubleshooting

### Problem: "Can't locate revision XXX"
```bash
# Check if file exists
ls alembic/versions/
# If missing, restore from git or create as no-op
```

### Problem: "Target database is not up to date"
```bash
alembic upgrade head
```

### Problem: Migration chain broken
```bash
alembic history  # Check for errors
alembic current  # See current state
# If desperate: alembic stamp head (⚠️ use carefully!)
```

## 📋 Enum Values Reference

**IMPORTANT**: All enum values are UPPERCASE in both database and Python.

### User Enums
- **UserRole**: `CITIZEN`, `DRIVER`, `ADMIN`
- **UserStatus**: `PENDING`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`

### Waste Enums
- **WasteCategory**: `ORGANIC`, `RECYCLABLE`, `HAZARDOUS`, `ELECTRONIC`, `GENERAL`, `MEDICAL`
- **BinType**: `GREEN`, `BLUE`, `RED`, `BLACK`, `YELLOW`, `SPECIAL`

### Pickup Enums
- **PickupStatus**: `REQUESTED`, `ASSIGNED`, `EN_ROUTE`, `ARRIVED`, `COLLECTED`, `CANCELLED`, `FAILED`
- **PickupPriority**: `LOW`, `NORMAL`, `HIGH`, `URGENT`

## 📚 More Info

- Full guide: [ALEMBIC_GUIDE.md](./ALEMBIC_GUIDE.md)
- Deployment: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- All fixes: [ALEMBIC_FIXES_SUMMARY.md](./ALEMBIC_FIXES_SUMMARY.md)

## 🆘 Emergency

If production is broken:

1. Check Render logs
2. Run `alembic current` in Render shell
3. Check this repo's issues for similar problems
4. Don't panic - migrations can be fixed!

**Most common fix**: Just run `alembic upgrade head` before deploying code.
