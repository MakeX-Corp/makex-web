-- Remove api_url column from user_apps table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_apps' AND table_schema = 'public') THEN
    ALTER TABLE public.user_apps DROP COLUMN IF EXISTS api_url;
  END IF;
END $$; 