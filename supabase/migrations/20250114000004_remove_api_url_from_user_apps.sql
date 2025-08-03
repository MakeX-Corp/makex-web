-- Remove api_url column from user_apps table
ALTER TABLE public.user_apps DROP COLUMN IF EXISTS api_url; 