import { storage } from '../server/storage';
import { db } from '../server/db';

async function main() {
  // Get all courses
  const courses = await storage.getCourses();

  // Quiz templates for different course types
  const quizTemplates = {
    'Programming': [
      {
        title: 'Python Basics Quiz',
        description: 'Test your understanding of basic Python concepts.',
        timeLimit: 30,
        attempts: 2,
        passingScore: 70,
        questions: [
          {
            question: 'What is the output of print(type(5))?',
            type: 'multiple_choice',
            options: ['<class \'int\'>', '<class \'str\'>', '<class \'float\'>', '<class \'bool\'>'],
            correctAnswer: '<class \'int\'>',
            points: 10,
            orderIndex: 1,
          },
          {
            question: 'Is Python case sensitive?',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            points: 10,
            orderIndex: 2,
          },
        ],
      },
      {
        title: 'Functions and Methods',
        description: 'Test your knowledge of Python functions and methods.',
        timeLimit: 45,
        attempts: 2,
        passingScore: 75,
        questions: [
          {
            question: 'What keyword is used to define a function in Python?',
            type: 'short_answer',
            options: [],
            correctAnswer: 'def',
            points: 15,
            orderIndex: 1,
          },
          {
            question: 'Which of the following is a valid function name?',
            type: 'multiple_choice',
            options: ['2function', '_function', 'function-name', 'function space'],
            correctAnswer: '_function',
            points: 15,
            orderIndex: 2,
          },
        ],
      },
    ],
    'Web Development': [
      {
        title: 'HTML Fundamentals Quiz',
        description: 'Test your knowledge of HTML basics.',
        timeLimit: 20,
        attempts: 3,
        passingScore: 65,
        questions: [
          {
            question: 'What does HTML stand for?',
            type: 'multiple_choice',
            options: [
              'Hyper Text Markup Language',
              'High Tech Modern Language',
              'Hyper Transfer Markup Language',
              'Home Tool Markup Language'
            ],
            correctAnswer: 'Hyper Text Markup Language',
            points: 10,
            orderIndex: 1,
          },
          {
            question: 'Is <br> a self-closing tag?',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            points: 10,
            orderIndex: 2,
          },
        ],
      },
    ],
    'Data Science': [
      {
        title: 'Statistics Basics',
        description: 'Test your understanding of basic statistical concepts.',
        timeLimit: 40,
        attempts: 2,
        passingScore: 80,
        questions: [
          {
            question: 'What is the measure of central tendency that is most affected by outliers?',
            type: 'multiple_choice',
            options: ['Mean', 'Median', 'Mode', 'Range'],
            correctAnswer: 'Mean',
            points: 20,
            orderIndex: 1,
          },
          {
            question: 'Standard deviation is always positive.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            points: 20,
            orderIndex: 2,
          },
        ],
      },
    ],
    'Mobile Development': [
      {
        title: 'React Native Basics',
        description: 'Test your knowledge of React Native fundamentals.',
        timeLimit: 35,
        attempts: 2,
        passingScore: 70,
        questions: [
          {
            question: 'Which component is used to create a scrollable list in React Native?',
            type: 'multiple_choice',
            options: ['ScrollView', 'ListView', 'FlatList', 'All of the above'],
            correctAnswer: 'FlatList',
            points: 15,
            orderIndex: 1,
          },
          {
            question: 'React Native uses the same DOM as React for web.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'False',
            points: 15,
            orderIndex: 2,
          },
        ],
      },
    ],
    'Databases': [
      {
        title: 'SQL Fundamentals',
        description: 'Test your knowledge of basic SQL commands.',
        timeLimit: 30,
        attempts: 2,
        passingScore: 75,
        questions: [
          {
            question: 'Which SQL command is used to retrieve data from a database?',
            type: 'multiple_choice',
            options: ['GET', 'RETRIEVE', 'SELECT', 'FETCH'],
            correctAnswer: 'SELECT',
            points: 15,
            orderIndex: 1,
          },
          {
            question: 'SQL is case sensitive.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'False',
            points: 15,
            orderIndex: 2,
          },
        ],
      },
    ],
  };

  // Add quizzes and questions to each course
  for (const course of courses) {
    console.log(`Adding quizzes to course: ${course.title}`);
    
    // Get the appropriate template based on course category
    const templates = quizTemplates[course.category as keyof typeof quizTemplates] || quizTemplates['Programming'];
    
    // Create quizzes and questions
    for (const template of templates) {
      // Create quiz
      const quiz = await storage.createQuiz({
        courseId: course.id,
        title: template.title,
        description: template.description,
        timeLimit: template.timeLimit,
        attempts: template.attempts,
        passingScore: template.passingScore,
      });
      
      console.log(`Created quiz: ${quiz.title}`);

      // Create questions for the quiz
      for (const questionTemplate of template.questions) {
        const question = await storage.createQuizQuestion({
          quizId: quiz.id,
          question: questionTemplate.question,
          type: questionTemplate.type,
          options: questionTemplate.options,
          correctAnswer: questionTemplate.correctAnswer,
          points: questionTemplate.points,
          orderIndex: questionTemplate.orderIndex,
        });
        
        console.log(`Created question: ${question.question}`);
      }
    }
  }

  console.log('Successfully added quizzes and questions to all courses!');
  if (db.pool) await db.pool.end();
}

main().catch((err) => {
  console.error('Error seeding quizzes:', err);
  process.exit(1);
}); 