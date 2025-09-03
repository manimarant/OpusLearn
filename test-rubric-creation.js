import fetch from 'node-fetch';

async function testRubricCreation() {
  try {
    console.log('Testing rubric creation...');
    
    // First, let's create a test rubric
    const rubricResponse = await fetch('http://localhost:3000/api/rubrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Rubric',
        description: 'A test rubric for debugging',
        type: 'quiz',
        quizId: 1,
        maxPoints: 100
      })
    });
    
    if (!rubricResponse.ok) {
      const errorText = await rubricResponse.text();
      throw new Error(`Failed to create rubric: ${rubricResponse.statusText} - ${errorText}`);
    }
    
    const rubric = await rubricResponse.json();
    console.log('Created rubric:', rubric);
    
    // Now let's create criteria
    const criteriaResponse = await fetch(`http://localhost:3000/api/rubrics/${rubric.id}/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Content Quality',
        description: 'Accuracy and depth of content',
        maxPoints: 40,
        orderIndex: 1
      })
    });
    
    if (!criteriaResponse.ok) {
      const errorText = await criteriaResponse.text();
      throw new Error(`Failed to create criteria: ${criteriaResponse.statusText} - ${errorText}`);
    }
    
    const criteria = await criteriaResponse.json();
    console.log('Created criteria:', criteria);
    
    // Now let's create levels
    const levelResponse = await fetch(`http://localhost:3000/api/rubrics/${rubric.id}/levels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Excellent',
        description: 'Outstanding work that exceeds expectations',
        points: 100,
        color: '#10B981',
        orderIndex: 1
      })
    });
    
    if (!levelResponse.ok) {
      const errorText = await levelResponse.text();
      throw new Error(`Failed to create level: ${levelResponse.statusText} - ${errorText}`);
    }
    
    const level = await levelResponse.json();
    console.log('Created level:', level);
    
    // Let's fetch the rubric with details to verify everything was saved
    const rubricDetailResponse = await fetch(`http://localhost:3000/api/rubrics/${rubric.id}`);
    if (!rubricDetailResponse.ok) {
      throw new Error(`Failed to fetch rubric details: ${rubricDetailResponse.statusText}`);
    }
    
    const rubricDetails = await rubricDetailResponse.json();
    console.log('Fetched rubric with details:', JSON.stringify(rubricDetails, null, 2));
    
    console.log('✅ Rubric creation test passed!');
    
  } catch (error) {
    console.error('❌ Rubric creation test failed:', error);
  }
}

testRubricCreation();
