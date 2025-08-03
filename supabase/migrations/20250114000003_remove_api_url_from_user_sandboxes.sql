-- Remove api_url column from user_sandboxes table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sandboxes' AND table_schema = 'public') THEN
    ALTER TABLE public.user_sandboxes DROP COLUMN IF EXISTS api_url;
  END IF;
END $$; 