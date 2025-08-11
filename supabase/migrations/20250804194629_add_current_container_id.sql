-- Add current_sandbox_id field to user_apps table
ALTER TABLE public.user_apps ADD COLUMN current_sandbox_id UUID;

-- Add foreign key constraint to reference user_sandboxes
ALTER TABLE public.user_apps 
ADD CONSTRAINT user_apps_current_sandbox_id_fkey 
FOREIGN KEY (current_sandbox_id) 
REFERENCES public.user_sandboxes(id) 
ON DELETE SET NULL;
