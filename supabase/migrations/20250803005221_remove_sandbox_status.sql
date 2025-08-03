-- Migration: Remove sandbox_status columns and ENUM type
-- This migration removes:
-- 1. sandbox_status column from user_apps table (TEXT type)

-- Drop sandbox_status column from user_apps table (TEXT type)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_apps' AND table_schema = 'public') THEN
    ALTER TABLE "public"."user_apps" DROP COLUMN IF EXISTS "sandbox_status";
  END IF;
END $$;
