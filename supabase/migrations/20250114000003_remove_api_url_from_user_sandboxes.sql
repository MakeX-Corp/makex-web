-- Remove api_url column from user_sandboxes table
ALTER TABLE public.user_sandboxes DROP COLUMN IF EXISTS api_url; 