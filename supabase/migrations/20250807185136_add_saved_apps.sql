-- Create the saved_app_data table
CREATE TABLE user_saved_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  app_listing_info_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  FOREIGN KEY (app_listing_info_id) REFERENCES app_listing_info(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add columns to app_listing_info
ALTER TABLE app_listing_info
ADD COLUMN category TEXT,
ADD COLUMN tags TEXT[],
ADD COLUMN author TEXT;

ALTER TABLE app_listing_info
DROP CONSTRAINT IF EXISTS url_mappings_app_id_fkey;

-- Add new foreign key with renamed constraint
ALTER TABLE app_listing_info
ADD CONSTRAINT fk_app_listing_info_app_id
FOREIGN KEY (app_id)
REFERENCES user_apps(id)
ON DELETE CASCADE;
