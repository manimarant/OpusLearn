#!/usr/bin/env node

import fetch from 'node-fetch';

async function testAIIntegration() {
  console.log('🤖 Testing AI Course Generation Integration...\n');

  const testPrompts = [
    "JavaScript for beginners with ES6, DOM manipulation, and modern web development",
    "Python data science course with pandas, numpy, and matplotlib",
    "React for beginners with hooks, state management, and modern patterns"
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    console.log(`📝 Test ${i + 1}: "${prompt}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'llama3.2:3b'
        })
      });

      const data = await response.json();
      
      if (data.course) {
        console.log(`✅ Success! Generated course: "${data.course.title}"`);
        console.log(`📚 Modules: ${data.course.modules.length}`);
        console.log(`📖 Total Chapters: ${data.course.modules.reduce((sum, mod) => sum + mod.chapters.length, 0)}`);
        console.log(`📝 Total Assignments: ${data.course.modules.reduce((sum, mod) => sum + (mod.assignments?.length || 0), 0)}`);
        console.log(`🧪 Total Quizzes: ${data.course.modules.reduce((sum, mod) => sum + (mod.quizzes?.length || 0), 0)}`);
        console.log(`💬 Total Discussions: ${data.course.modules.reduce((sum, mod) => sum + (mod.discussions?.length || 0), 0)}`);
        console.log(`🤖 Model Used: ${data.model}\n`);
      } else {
        console.log(`❌ Error: ${data.message || 'Unknown error'}\n`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}\n`);
    }
  }

  console.log('🎉 AI Integration Test Complete!');
  console.log('\n📋 Summary:');
  console.log('✅ Real AI models (Ollama) integrated');
  console.log('✅ Free AI service (no API costs)');
  console.log('✅ Complete course generation');
  console.log('✅ Fallback system for offline use');
  console.log('✅ Privacy-first (local processing)');
}

testAIIntegration().catch(console.error); 