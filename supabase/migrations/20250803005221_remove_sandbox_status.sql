-- Migration: Remove sandbox_status columns and ENUM type
-- This migration removes:
-- 1. sandbox_status column from user_apps table (TEXT type)

-- Drop sandbox_status column from user_apps table (TEXT type)
ALTER TABLE "public"."user_apps" 
DROP COLUMN IF EXISTS "sandbox_status";
