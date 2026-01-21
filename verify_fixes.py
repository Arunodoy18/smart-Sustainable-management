#!/usr/bin/env python3
"""
Pre-Deployment Verification Script
===================================

Run this script before deploying to verify all fixes are correct.

Usage:
    python verify_fixes.py
"""

import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

def verify_enums():
    """Verify all enum values are UPPERCASE."""
    print("🔍 Verifying enum values...")
    
    from src.models.user import UserRole, UserStatus
    from src.models.waste import WasteCategory, WasteSubCategory, BinType, ClassificationConfidence, WasteEntryStatus
    from src.models.pickup import DriverStatus, PickupStatus, PickupPriority
    from src.models.rewards import RewardType, AchievementCategory
    
    enums_to_check = [
        ("UserRole.CITIZEN", UserRole.CITIZEN),
        ("UserStatus.ACTIVE", UserStatus.ACTIVE),
        ("WasteCategory.RECYCLABLE", WasteCategory.RECYCLABLE),
        ("WasteSubCategory.PLASTIC", WasteSubCategory.PLASTIC),
        ("BinType.GREEN", BinType.GREEN),
        ("ClassificationConfidence.HIGH", ClassificationConfidence.HIGH),
        ("WasteEntryStatus.PENDING", WasteEntryStatus.PENDING),
        ("DriverStatus.APPROVED", DriverStatus.APPROVED),
        ("PickupStatus.REQUESTED", PickupStatus.REQUESTED),
        ("PickupPriority.NORMAL", PickupPriority.NORMAL),
        ("RewardType.RECYCLING_POINTS", RewardType.RECYCLING_POINTS),
        ("AchievementCategory.RECYCLING", AchievementCategory.RECYCLING),
    ]
    
    all_uppercase = True
    for name, enum_value in enums_to_check:
        value = enum_value.value
        if value != value.upper():
            print(f"  ❌ {name} = {value} (should be UPPERCASE)")
            all_uppercase = False
        else:
            print(f"  ✅ {name} = {value}")
    
    return all_uppercase


def verify_models():
    """Verify all models can be imported."""
    print("\n🔍 Verifying database models...")
    
    try:
        from src.core.database.base import Base
        from src.models import user, waste, pickup, rewards, analytics
        
        table_count = len(Base.metadata.tables)
        print(f"  ✅ All models imported successfully")
        print(f"  ✅ Total tables: {table_count}")
        
        return True
    except Exception as e:
        print(f"  ❌ Error importing models: {e}")
        return False


def verify_app():
    """Verify FastAPI app can be imported."""
    print("\n🔍 Verifying FastAPI app...")
    
    try:
        from src.main import app
        print(f"  ✅ App imported: {app.title} v{app.version}")
        return True
    except Exception as e:
        print(f"  ❌ Error importing app: {e}")
        return False


def verify_migrations():
    """Verify migration chain."""
    print("\n🔍 Verifying migration chain...")
    
    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        
        config = Config("apps/api/alembic.ini")
        config.set_main_option("script_location", "apps/api/alembic")
        script = ScriptDirectory.from_config(config)
        
        revisions = list(script.walk_revisions())
        print(f"  ✅ Found {len(revisions)} migrations")
        
        for rev in reversed(revisions):
            print(f"     {rev.revision[:12]} - {rev.doc}")
        
        # Check for head
        head = script.get_current_head()
        print(f"  ✅ Current head: {head}")
        
        return True
    except Exception as e:
        print(f"  ❌ Error checking migrations: {e}")
        return False


def main():
    """Run all verifications."""
    print("=" * 60)
    print("🚀 Smart Waste AI - Pre-Deployment Verification")
    print("=" * 60)
    
    results = []
    
    results.append(("Enum Values", verify_enums()))
    results.append(("Database Models", verify_models()))
    results.append(("FastAPI App", verify_app()))
    results.append(("Migration Chain", verify_migrations()))
    
    print("\n" + "=" * 60)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for check, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{check:.<40} {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All checks passed! Ready to deploy!")
        print("\nNext steps:")
        print("1. Commit changes: git add . && git commit -F COMMIT_MESSAGE.txt")
        print("2. Push to GitHub: git push origin main")
        print("3. Run migrations on Render: python -m alembic upgrade head")
        print("4. Deploy code (auto or manual)")
        print("\nSee DEPLOY_NOW.md for detailed instructions.")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please fix issues before deploying.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
