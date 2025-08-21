-- Remove video-related columns from chapters table
-- This script removes all video generation functionality

-- Drop indexes first
DROP INDEX IF EXISTS idx_chapters_video_job_id;
DROP INDEX IF EXISTS idx_chapters_video_status;

-- Remove video-related columns from chapters table
ALTER TABLE chapters DROP COLUMN IF EXISTS video_url;
ALTER TABLE chapters DROP COLUMN IF EXISTS video_thumbnail_url;
ALTER TABLE chapters DROP COLUMN IF EXISTS video_job_id;
ALTER TABLE chapters DROP COLUMN IF EXISTS video_status;
ALTER TABLE chapters DROP COLUMN IF EXISTS video_provider;

-- Verify the columns were removed
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'chapters' AND column_name LIKE 'video_%'
ORDER BY column_name;
