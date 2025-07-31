import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://manimarant@localhost:5432/opuslearn';

async function createChaptersTable() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Creating chapters table...');
    
    // Create chapters table
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
    
    console.log('Chapters table created successfully!');
    
    // Get existing modules
    const modulesResult = await pool.query('SELECT id FROM course_modules ORDER BY id');
    const modules = modulesResult.rows;
    
    console.log(`Found ${modules.length} modules to populate with chapters`);
    
    // Sample chapter data for each module
    const sampleChapters = [
      {
        title: 'Introduction to Programming Concepts',
        content: 'In this chapter, we will explore the fundamental concepts of programming including variables, data types, and basic syntax.',
        contentType: 'text',
        duration: 30,
        orderIndex: 1
      },
      {
        title: 'Variables and Data Types',
        content: 'Learn about different variable types, how to declare them, and when to use each type effectively.',
        contentType: 'text',
        duration: 45,
        orderIndex: 2
      },
      {
        title: 'Control Structures',
        content: 'Master if statements, loops, and other control structures that form the backbone of programming logic.',
        contentType: 'text',
        duration: 60,
        orderIndex: 3
      },
      {
        title: 'Functions and Methods',
        content: 'Discover how to create reusable code blocks and organize your programs with functions.',
        contentType: 'text',
        duration: 50,
        orderIndex: 4
      },
      {
        title: 'Object-Oriented Programming Basics',
        content: 'Introduction to classes, objects, and the principles of object-oriented programming.',
        contentType: 'text',
        duration: 75,
        orderIndex: 5
      }
    ];
    
    // Insert chapters for each module
    for (const module of modules) {
      console.log(`Adding chapters to module ${module.id}...`);
      
      for (let i = 0; i < sampleChapters.length; i++) {
        const chapter = sampleChapters[i];
        await pool.query(`
          INSERT INTO chapters (module_id, title, content, content_type, duration, order_index)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          module.id,
          chapter.title,
          chapter.content,
          chapter.contentType,
          chapter.duration,
          chapter.orderIndex
        ]);
      }
    }
    
    console.log('Sample chapters added successfully!');
    
    // Update quizzes table to use chapter_id instead of lesson_id
    console.log('Updating quizzes table...');
    try {
      await pool.query(`
        ALTER TABLE quizzes 
        ADD COLUMN IF NOT EXISTS chapter_id INTEGER REFERENCES chapters(id)
      `);
      console.log('Quizzes table updated successfully!');
    } catch (error) {
      console.log('Quizzes table update skipped (column might already exist)');
    }
    
  } catch (error) {
    console.error('Error creating chapters table:', error);
  } finally {
    await pool.end();
  }
}

createChaptersTable().then(() => {
  console.log('Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 