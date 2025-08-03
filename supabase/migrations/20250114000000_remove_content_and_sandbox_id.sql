-- Rename app_chat_history table to chat_history (if it exists and hasn't been renamed yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_chat_history' AND table_schema = 'public') THEN
    ALTER TABLE public.app_chat_history RENAME TO chat_history;
  END IF;
END $$;

-- Remove sandbox_id column from user_apps table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_apps' AND table_schema = 'public') THEN
    ALTER TABLE public.user_apps DROP COLUMN IF EXISTS sandbox_id;
  END IF;
END $$; 