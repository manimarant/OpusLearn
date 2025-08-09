-- Add video-related columns to chapters table
ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_job_id TEXT,
ADD COLUMN IF NOT EXISTS video_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS video_provider VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chapters_video_job_id 
ON chapters (video_job_id) 
WHERE video_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_video_status 
ON chapters (video_status) 
WHERE video_status != 'none';
