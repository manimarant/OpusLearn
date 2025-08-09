import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://manimarant@localhost:5432/opuslearn';

async function addVideoColumns() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Adding video-related columns to chapters table...');
    
    // Add video-related columns to chapters table
    await pool.query(`
      ALTER TABLE chapters 
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
      ADD COLUMN IF NOT EXISTS video_job_id TEXT,
      ADD COLUMN IF NOT EXISTS video_status VARCHAR(50) DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS video_provider VARCHAR(50);
    `);
    
    console.log('Video columns added successfully!');
    
    // Create an index on video_job_id for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chapters_video_job_id 
      ON chapters (video_job_id) 
      WHERE video_job_id IS NOT NULL;
    `);
    
    console.log('Video job index created successfully!');
    
    // Create an index on video_status for filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chapters_video_status 
      ON chapters (video_status) 
      WHERE video_status != 'none';
    `);
    
    console.log('Video status index created successfully!');
    
  } catch (error) {
    console.error('Error adding video columns:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration if this script is executed directly
addVideoColumns()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

export { addVideoColumns };
