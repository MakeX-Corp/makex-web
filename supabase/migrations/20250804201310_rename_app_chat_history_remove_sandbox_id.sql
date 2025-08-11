-- Rename app_chat_history table to chat_history
ALTER TABLE app_chat_history RENAME TO chat_history;

-- Remove sandbox_id column from user_apps table
ALTER TABLE user_apps DROP COLUMN IF EXISTS sandbox_id;
