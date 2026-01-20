-- Smart Waste Database Initialization
-- ====================================
-- This script runs on first database creation
-- Note: Tables are created by SQLAlchemy/Alembic migrations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seed data will be inserted by the application on first startup
-- or via Alembic migrations after tables are created

-- Grant permissions if needed (uncomment for production)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartwaste;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smartwaste;
