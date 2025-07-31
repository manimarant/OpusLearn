import { storage } from '../server/storage';
import { db } from '../server/db';

async function main() {
  // Get all courses
  const courses = await storage.getCourses();

  // Module templates for different course types
  const moduleTemplates = {
    'Programming': [
      {
        title: 'Getting Started',
        description: 'Introduction to basic concepts and setup',
        chapters: [
          { title: 'Introduction to Programming', content: 'Welcome to programming! In this lesson, we will cover the fundamental concepts.', duration: 30 },
          { title: 'Setting Up Your Environment', content: 'Learn how to set up your development environment.', duration: 45 },
          { title: 'Writing Your First Program', content: 'Create and run your first program.', duration: 60 }
        ]
      },
      {
        title: 'Core Concepts',
        description: 'Essential programming concepts and practices',
        chapters: [
          { title: 'Variables and Data Types', content: 'Understanding different types of data and how to store them.', duration: 45 },
          { title: 'Control Flow', content: 'Learn about if statements, loops, and program flow.', duration: 60 },
          { title: 'Functions and Methods', content: 'Writing reusable code with functions.', duration: 60 }
        ]
      },
      {
        title: 'Advanced Topics',
        description: 'Advanced programming concepts and best practices',
        chapters: [
          { title: 'Object-Oriented Programming', content: 'Introduction to classes and objects.', duration: 90 },
          { title: 'Error Handling', content: 'Dealing with errors and exceptions.', duration: 45 },
          { title: 'Best Practices', content: 'Writing clean and maintainable code.', duration: 60 }
        ]
      }
    ],
    'Web Development': [
      {
        title: 'HTML Fundamentals',
        description: 'Learn the basics of HTML markup',
        chapters: [
          { title: 'HTML Basics', content: 'Introduction to HTML tags and structure.', duration: 45 },
          { title: 'Forms and Input', content: 'Creating interactive forms.', duration: 60 },
          { title: 'Semantic HTML', content: 'Using semantic elements for better structure.', duration: 45 }
        ]
      },
      {
        title: 'CSS Styling',
        description: 'Style your web pages with CSS',
        chapters: [
          { title: 'CSS Basics', content: 'Introduction to CSS selectors and properties.', duration: 60 },
          { title: 'Layout and Positioning', content: 'Understanding CSS layout models.', duration: 75 },
          { title: 'Responsive Design', content: 'Making websites work on all devices.', duration: 90 }
        ]
      },
      {
        title: 'JavaScript Essentials',
        description: 'Add interactivity with JavaScript',
        chapters: [
          { title: 'JavaScript Fundamentals', content: 'Basic JavaScript concepts and syntax.', duration: 60 },
          { title: 'DOM Manipulation', content: 'Working with the Document Object Model.', duration: 75 },
          { title: 'Events and Handlers', content: 'Handling user interactions.', duration: 60 }
        ]
      }
    ],
    'Data Science': [
      {
        title: 'Data Analysis Basics',
        description: 'Introduction to data analysis',
        chapters: [
          { title: 'Introduction to Data Science', content: 'Overview of data science concepts.', duration: 45 },
          { title: 'Data Collection', content: 'Methods for gathering data.', duration: 60 },
          { title: 'Data Cleaning', content: 'Preparing data for analysis.', duration: 75 }
        ]
      },
      {
        title: 'Statistical Analysis',
        description: 'Learn statistical methods for data analysis',
        chapters: [
          { title: 'Descriptive Statistics', content: 'Understanding data through statistics.', duration: 60 },
          { title: 'Probability Theory', content: 'Basic probability concepts.', duration: 75 },
          { title: 'Statistical Testing', content: 'Hypothesis testing and inference.', duration: 90 }
        ]
      },
      {
        title: 'Machine Learning',
        description: 'Introduction to machine learning concepts',
        chapters: [
          { title: 'ML Fundamentals', content: 'Basic machine learning concepts.', duration: 90 },
          { title: 'Supervised Learning', content: 'Classification and regression.', duration: 90 },
          { title: 'Model Evaluation', content: 'Assessing model performance.', duration: 60 }
        ]
      }
    ],
    'Mobile Development': [
      {
        title: 'Mobile Development Basics',
        description: 'Introduction to mobile app development',
        chapters: [
          { title: 'Mobile Development Overview', content: 'Introduction to mobile platforms.', duration: 45 },
          { title: 'UI Design Principles', content: 'Designing for mobile devices.', duration: 60 },
          { title: 'App Architecture', content: 'Understanding app structure.', duration: 75 }
        ]
      },
      {
        title: 'React Native Fundamentals',
        description: 'Building cross-platform mobile apps',
        chapters: [
          { title: 'React Native Basics', content: 'Getting started with React Native.', duration: 60 },
          { title: 'Components and Props', content: 'Building reusable components.', duration: 75 },
          { title: 'Navigation', content: 'Implementing app navigation.', duration: 60 }
        ]
      },
      {
        title: 'Advanced Features',
        description: 'Advanced mobile development topics',
        chapters: [
          { title: 'State Management', content: 'Managing app state effectively.', duration: 90 },
          { title: 'Native Modules', content: 'Working with platform-specific code.', duration: 75 },
          { title: 'App Deployment', content: 'Publishing your app to stores.', duration: 60 }
        ]
      }
    ],
    'Databases': [
      {
        title: 'Database Fundamentals',
        description: 'Introduction to database concepts',
        chapters: [
          { title: 'Database Basics', content: 'Introduction to database systems.', duration: 45 },
          { title: 'Data Models', content: 'Understanding different data models.', duration: 60 },
          { title: 'SQL Fundamentals', content: 'Basic SQL queries and operations.', duration: 75 }
        ]
      },
      {
        title: 'Database Design',
        description: 'Learn to design efficient databases',
        chapters: [
          { title: 'Schema Design', content: 'Designing database schemas.', duration: 90 },
          { title: 'Normalization', content: 'Database normalization principles.', duration: 75 },
          { title: 'Indexing', content: 'Optimizing database performance.', duration: 60 }
        ]
      },
      {
        title: 'Advanced Database Topics',
        description: 'Advanced database concepts and practices',
        chapters: [
          { title: 'Transactions', content: 'Managing database transactions.', duration: 75 },
          { title: 'Security', content: 'Database security best practices.', duration: 60 },
          { title: 'Backup and Recovery', content: 'Data backup and disaster recovery.', duration: 45 }
        ]
      }
    ]
  };

  // Add modules and chapters to each course
  for (const course of courses) {
    console.log(`Adding chapters to course: ${course.title}`);
    
    // Get the appropriate template based on course category
    const templates = moduleTemplates[course.category as keyof typeof moduleTemplates] || moduleTemplates['Programming'];
    
    // Create modules and chapters
    for (let i = 0; i < templates.length; i++) {
      const moduleTemplate = templates[i];
      
      // Create module
      const module = await storage.createModule({
        courseId: course.id,
        title: moduleTemplate.title,
        description: moduleTemplate.description,
        orderIndex: i + 1
      });
      
      console.log(`Created module: ${module.title}`);

      // Create chapters for the module
      for (let j = 0; j < moduleTemplate.chapters.length; j++) {
        const chapterTemplate = moduleTemplate.chapters[j];
        
        const chapter = await storage.createChapter({
          moduleId: module.id,
          title: chapterTemplate.title,
          content: chapterTemplate.content,
          contentType: 'text',
          duration: chapterTemplate.duration,
          orderIndex: j + 1
        });
        
        console.log(`Created chapter: ${chapter.title}`);
      }
    }
  }

  console.log('Successfully added chapters and chapters to all courses!');
  if (db.pool) await db.pool.end();
}

main().catch((err) => {
  console.error('Error seeding chapters and chapters:', err);
  process.exit(1);
}); 