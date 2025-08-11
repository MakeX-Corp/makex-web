-- Drop api_url column from user_sandboxes table
ALTER TABLE user_sandboxes DROP COLUMN IF EXISTS api_url;

-- Drop api_url column from user_apps table  
ALTER TABLE user_apps DROP COLUMN IF EXISTS api_url;
