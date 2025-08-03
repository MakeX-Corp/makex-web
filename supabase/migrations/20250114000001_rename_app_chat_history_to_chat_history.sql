-- Remove content column from chat_history table (after rename)
ALTER TABLE public.chat_history DROP COLUMN IF EXISTS content; 