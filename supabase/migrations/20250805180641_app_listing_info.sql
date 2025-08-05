-- Rename url_mappings table to app_listing_info
ALTER TABLE url_mappings RENAME TO app_listing_info;

-- Add new columns to app_listing_info
ALTER TABLE public.app_listing_info
ADD COLUMN image TEXT,                            -- for the image URL
ADD COLUMN description TEXT,                      -- for the app description
ADD COLUMN rating NUMERIC(2,1),                   -- allows values like 4.5, can be NULL
ADD COLUMN downloads INTEGER DEFAULT 0;          -- for number of downloads