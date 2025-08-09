import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function addVideoColumns() {
  // Use the same connection approach as the main app
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

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

// Run the migration
addVideoColumns()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
