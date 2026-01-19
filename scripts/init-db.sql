-- Smart Waste Database Initialization
-- ====================================
-- This script runs on first database creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial admin user (password: admin123)
-- In production, change this password immediately
INSERT INTO users (id, email, hashed_password, first_name, last_name, role, status, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'admin@smartwaste.com',
    '$argon2id$v=19$m=65536,t=3,p=4$salt$hash', -- Replace with actual hash
    'Admin',
    'User',
    'admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create demo citizen user (password: demo123)
INSERT INTO users (id, email, hashed_password, first_name, last_name, role, status, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'demo@smartwaste.com',
    '$argon2id$v=19$m=65536,t=3,p=4$salt$hash', -- Replace with actual hash
    'Demo',
    'User',
    'citizen',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create demo driver user (password: driver123)
INSERT INTO users (id, email, hashed_password, first_name, last_name, role, status, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'driver@smartwaste.com',
    '$argon2id$v=19$m=65536,t=3,p=4$salt$hash', -- Replace with actual hash
    'Demo',
    'Driver',
    'driver',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartwaste;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smartwaste;
