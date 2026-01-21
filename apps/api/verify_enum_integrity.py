#!/usr/bin/env python3
"""
Enum Integrity Verification
============================

CRITICAL: This script verifies that Python enum values EXACTLY match
PostgreSQL enum values defined in Alembic migrations.

This prevents HTTP 500 errors caused by enum mismatches.

Run this before every deployment:
    python verify_enum_integrity.py

Exit codes:
    0: All enums match exactly
    1: Mismatch detected - MUST FIX before deploying
"""

import enum
import re
import sys
from pathlib import Path
from typing import Dict, List, Set

# Import all enum classes
from src.models.user import UserRole, UserStatus
from src.models.waste import (
    WasteCategory,
    WasteSubCategory,
    BinType,
    ClassificationConfidence,
    WasteEntryStatus,
)
from src.models.pickup import DriverStatus, PickupStatus, PickupPriority
from src.models.rewards import RewardType, AchievementCategory


def extract_enum_from_migration(migration_path: Path) -> Dict[str, Set[str]]:
    """Extract enum definitions from migration file."""
    content = migration_path.read_text()
    enums = {}
    
    # Pattern: sa.Enum('VALUE1', 'VALUE2', ..., name='enum_name')
    pattern = r"sa\.Enum\((.*?),\s*name=['\"](\w+)['\"]"
    
    for match in re.finditer(pattern, content, re.DOTALL):
        values_str = match.group(1)
        enum_name = match.group(2)
        
        # Extract individual values
        values = set()
        for value_match in re.finditer(r"['\"]([A-Z_]+)['\"]", values_str):
            values.add(value_match.group(1))
        
        if values:
            enums[enum_name] = values
    
    return enums


def get_python_enum_values(enum_class: type[enum.Enum]) -> Set[str]:
    """Get all values from Python enum class."""
    return {member.value for member in enum_class}


def verify_enum_match(
    python_name: str,
    python_enum: type[enum.Enum],
    db_name: str,
    db_values: Set[str],
) -> bool:
    """Verify Python enum matches database enum."""
    python_values = get_python_enum_values(python_enum)
    
    if python_values != db_values:
        print(f"\n❌ MISMATCH: {python_name} ({db_name})")
        print(f"   Python has: {sorted(python_values)}")
        print(f"   Database has: {sorted(db_values)}")
        
        missing_in_python = db_values - python_values
        if missing_in_python:
            print(f"   Missing in Python: {sorted(missing_in_python)}")
        
        extra_in_python = python_values - db_values
        if extra_in_python:
            print(f"   Extra in Python: {sorted(extra_in_python)}")
        
        return False
    
    print(f"✅ {python_name} ({db_name}): {len(python_values)} values match")
    return True


def main() -> int:
    """Main verification routine."""
    print("=" * 80)
    print("🔍 ENUM INTEGRITY VERIFICATION")
    print("=" * 80)
    print()
    
    # Find initial schema migration
    migrations_dir = Path(__file__).parent / "alembic" / "versions"
    initial_migration = migrations_dir / "3b11939b5277_initial_schema.py"
    
    if not initial_migration.exists():
        print("❌ ERROR: Initial migration not found")
        print(f"   Expected: {initial_migration}")
        return 1
    
    print(f"📄 Reading: {initial_migration.name}\n")
    
    # Extract database enums
    db_enums = extract_enum_from_migration(initial_migration)
    
    if not db_enums:
        print("❌ ERROR: No enums found in migration file")
        return 1
    
    print(f"Found {len(db_enums)} database enums\n")
    
    # Map Python enums to database enums
    enum_mappings = [
        ("UserRole", UserRole, "user_role"),
        ("UserStatus", UserStatus, "user_status"),
        ("WasteCategory", WasteCategory, "waste_category"),
        ("WasteSubCategory", WasteSubCategory, "waste_sub_category"),
        ("BinType", BinType, "bin_type"),
        ("ClassificationConfidence", ClassificationConfidence, "classification_confidence"),
        ("WasteEntryStatus", WasteEntryStatus, "waste_entry_status"),
        ("DriverStatus", DriverStatus, "driver_status"),
        ("PickupStatus", PickupStatus, "pickup_status"),
        ("PickupPriority", PickupPriority, "pickup_priority"),
        ("RewardType", RewardType, "reward_type"),
        ("AchievementCategory", AchievementCategory, "achievement_category"),
    ]
    
    all_match = True
    
    for python_name, python_enum, db_name in enum_mappings:
        if db_name not in db_enums:
            print(f"⚠️  WARNING: {db_name} not found in migration")
            continue
        
        if not verify_enum_match(python_name, python_enum, db_name, db_enums[db_name]):
            all_match = False
    
    print()
    print("=" * 80)
    
    if all_match:
        print("✅ ALL ENUMS MATCH - Safe to deploy")
        print("=" * 80)
        return 0
    else:
        print("❌ ENUM MISMATCH DETECTED - DO NOT DEPLOY")
        print("=" * 80)
        print()
        print("CRITICAL: Python enum values do not match PostgreSQL enums.")
        print("This WILL cause HTTP 500 errors in production.")
        print()
        print("To fix:")
        print("1. Update Python enum classes in src/models/*.py")
        print("2. OR create new Alembic migration to update database enums")
        print("3. Re-run this script to verify")
        return 1


if __name__ == "__main__":
    # Change to API directory
    api_dir = Path(__file__).parent
    import os
    os.chdir(api_dir)
    
    # Add src to path
    sys.path.insert(0, str(api_dir))
    
    sys.exit(main())
