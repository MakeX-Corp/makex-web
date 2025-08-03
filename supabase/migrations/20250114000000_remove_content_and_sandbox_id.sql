-- Remove content column from app_chat_history table
ALTER TABLE public.app_chat_history DROP COLUMN IF EXISTS content;

-- Remove sandbox_id column from user_apps table  
ALTER TABLE public.user_apps DROP COLUMN IF EXISTS sandbox_id; 