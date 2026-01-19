-- Migration script to add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);

-- Update any existing records to have a placeholder (they'll need to reset password)
UPDATE profiles 
SET hashed_password = '$2b$12$placeholder'
WHERE hashed_password IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE profiles 
ALTER COLUMN hashed_password SET NOT NULL;
