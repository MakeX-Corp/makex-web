-- Migration to drop content column from app_chat_history table
-- This removes the content column as it may no longer be needed

-- Drop the content column from app_chat_history table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_chat_history' AND column_name = 'content' AND table_schema = 'public') THEN
    ALTER TABLE public.app_chat_history DROP COLUMN content;
  END IF;
END $$;
