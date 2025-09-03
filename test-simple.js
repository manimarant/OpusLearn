import fetch from 'node-fetch';

async function testServer() {
  try {
    console.log('Testing server connection...');
    
    const response = await fetch('http://localhost:3000/api/courses');
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Server is running, courses:', data.length);
    } else {
      console.log('Server responded with error:', response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
  }
}

testServer();
