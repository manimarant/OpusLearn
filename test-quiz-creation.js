import fetch from 'node-fetch';

async function testQuizCreation() {
  try {
    console.log('Testing quiz question creation...');
    
    // First, let's create a test quiz
    const quizResponse = await fetch('http://localhost:3000/api/courses/1/quizzes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Quiz',
        description: 'A test quiz for debugging',
        timeLimit: 30,
        attempts: 1,
        passingScore: 70
      })
    });
    
    if (!quizResponse.ok) {
      throw new Error(`Failed to create quiz: ${quizResponse.statusText}`);
    }
    
    const quiz = await quizResponse.json();
    console.log('Created quiz:', quiz);
    
    // Now let's create a test question
    const questionResponse = await fetch(`http://localhost:3000/api/quizzes/${quiz.id}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What is 2 + 2?',
        type: 'multiple_choice',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        points: 10,
        orderIndex: 1
      })
    });
    
    if (!questionResponse.ok) {
      const errorText = await questionResponse.text();
      throw new Error(`Failed to create question: ${questionResponse.statusText} - ${errorText}`);
    }
    
    const question = await questionResponse.json();
    console.log('Created question:', question);
    
    // Let's fetch the questions to verify they were saved
    const questionsResponse = await fetch(`http://localhost:3000/api/quizzes/${quiz.id}/questions`);
    if (!questionsResponse.ok) {
      throw new Error(`Failed to fetch questions: ${questionsResponse.statusText}`);
    }
    
    const questions = await questionsResponse.json();
    console.log('Fetched questions:', questions);
    
    console.log('✅ Quiz question creation test passed!');
    
  } catch (error) {
    console.error('❌ Quiz question creation test failed:', error);
  }
}

testQuizCreation();
