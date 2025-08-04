import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Starbucks%239@localhost:5432/opuslearn';

async function fixDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Fixing database schema...');
    
    // Create chapters table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES course_modules(id),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        content_type VARCHAR(50) DEFAULT 'text',
        duration INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create chapter_progress table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapter_progress (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        chapter_id INTEGER REFERENCES chapters(id),
        completed BOOLEAN DEFAULT false,
        time_spent INTEGER DEFAULT 0,
        completed_at TIMESTAMP
      );
    `);
    
    // Add chapter_id column to quizzes table if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE quizzes 
        ADD COLUMN IF NOT EXISTS chapter_id INTEGER REFERENCES chapters(id)
      `);
    } catch (error) {
      console.log('chapter_id column might already exist in quizzes table');
    }
    
    // Rename lesson_progress to chapter_progress if lesson_progress exists
    try {
      await pool.query(`
        ALTER TABLE lesson_progress 
        RENAME TO chapter_progress_temp
      `);
      
      await pool.query(`
        ALTER TABLE chapter_progress_temp 
        RENAME COLUMN lesson_id TO chapter_id
      `);
      
      await pool.query(`
        ALTER TABLE chapter_progress_temp 
        RENAME TO chapter_progress
      `);
      
      console.log('Successfully renamed lesson_progress to chapter_progress');
    } catch (error) {
      console.log('lesson_progress table might not exist or already renamed');
    }
    
    // Rename lessons to chapters if lessons exists
    try {
      await pool.query(`
        ALTER TABLE lessons 
        RENAME TO chapters_temp
      `);
      
      await pool.query(`
        ALTER TABLE chapters_temp 
        RENAME COLUMN lesson_id TO chapter_id
      `);
      
      await pool.query(`
        ALTER TABLE chapters_temp 
        RENAME TO chapters
      `);
      
      console.log('Successfully renamed lessons to chapters');
    } catch (error) {
      console.log('lessons table might not exist or already renamed');
    }
    
    console.log('Database schema fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await pool.end();
  }
}

fixDatabase().then(() => {
  console.log('Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 