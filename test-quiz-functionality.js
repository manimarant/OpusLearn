// Test script to verify quiz creation and question addition functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testQuizCreation() {
  console.log('Testing quiz creation...');
  
  try {
    // First, get courses to find a course ID
    const coursesResponse = await fetch(`${BASE_URL}/api/courses`, {
      credentials: 'include',
      headers: {
        'Cookie': 'dev-user=dev-user-123' // Development mode cookie
      }
    });
    
    if (!coursesResponse.ok) {
      throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
    }
    
    const courses = await coursesResponse.json();
    console.log('Available courses:', courses.length);
    
    if (courses.length === 0) {
      console.log('No courses available for testing');
      return;
    }
    
    const courseId = courses[0].id;
    console.log(`Using course ID: ${courseId}`);
    
    // Test quiz creation
    const quizData = {
      title: 'Test Quiz',
      description: 'A test quiz to verify functionality',
      timeLimit: 30,
      attempts: 1,
      passingScore: 70
    };
    
    const quizResponse = await fetch(`${BASE_URL}/api/courses/${courseId}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'dev-user=dev-user-123'
      },
      body: JSON.stringify(quizData)
    });
    
    if (!quizResponse.ok) {
      const errorText = await quizResponse.text();
      throw new Error(`Failed to create quiz: ${quizResponse.status} - ${errorText}`);
    }
    
    const quiz = await quizResponse.json();
    console.log('Quiz created successfully:', quiz);
    
    // Test question addition
    const questionData = {
      question: 'What is 2 + 2?',
      type: 'multiple_choice',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 10,
      orderIndex: 1
    };
    
    const questionResponse = await fetch(`${BASE_URL}/api/quizzes/${quiz.id}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'dev-user=dev-user-123'
      },
      body: JSON.stringify(questionData)
    });
    
    if (!questionResponse.ok) {
      const errorText = await questionResponse.text();
      throw new Error(`Failed to create question: ${questionResponse.status} - ${errorText}`);
    }
    
    const question = await questionResponse.json();
    console.log('Question created successfully:', question);
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQuizCreation();
