-- Remove content column from chat_history table (or app_chat_history if rename didn't work)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history' AND table_schema = 'public') THEN
    ALTER TABLE public.chat_history DROP COLUMN IF EXISTS content;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_chat_history' AND table_schema = 'public') THEN
    ALTER TABLE public.app_chat_history DROP COLUMN IF EXISTS content;
  END IF;
END $$; 