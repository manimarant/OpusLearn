// Test script to check quiz question creation
import fetch from 'node-fetch';

async function testQuizQuestionCreation() {
  try {
    console.log('Testing quiz question creation...');
    
    // First, let's check if we can get quizzes
    const quizzesResponse = await fetch('http://localhost:3000/api/quizzes');
    console.log('Quizzes response status:', quizzesResponse.status);
    
    if (quizzesResponse.ok) {
      const quizzes = await quizzesResponse.json();
      console.log('Available quizzes:', quizzes.length);
      
      if (quizzes.length > 0) {
        const quizId = quizzes[0].id;
        console.log('Testing with quiz ID:', quizId);
        
        // Try to get questions for this quiz
        const questionsResponse = await fetch(`http://localhost:3000/api/quizzes/${quizId}/questions`);
        console.log('Questions response status:', questionsResponse.status);
        
        if (questionsResponse.ok) {
          const questions = await questionsResponse.json();
          console.log('Current questions:', questions.length);
        } else {
          console.log('Error getting questions:', await questionsResponse.text());
        }
        
        // Try to create a new question
        const newQuestion = {
          question: "Test question?",
          type: "multiple_choice",
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          correctAnswer: "Option 1",
          points: 10,
          orderIndex: 1
        };
        
        console.log('Creating question with data:', newQuestion);
        
        const createResponse = await fetch(`http://localhost:3000/api/quizzes/${quizId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newQuestion)
        });
        
        console.log('Create question response status:', createResponse.status);
        
        if (createResponse.ok) {
          const result = await createResponse.json();
          console.log('Question created successfully:', result);
        } else {
          const errorText = await createResponse.text();
          console.log('Error creating question:', errorText);
        }
      }
    } else {
      console.log('Error getting quizzes:', await quizzesResponse.text());
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testQuizQuestionCreation();
