-- Remove app_status column from user_sandboxes table
ALTER TABLE user_sandboxes DROP COLUMN IF EXISTS app_status;

-- Add coding_status column to user_apps table
ALTER TABLE user_apps ADD COLUMN coding_status TEXT;
