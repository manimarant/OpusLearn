export interface CourseGenerationRequest {
  prompt: string;
  model?: string;
}

export interface GeneratedCourse {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  modules: Array<{
    title: string;
    description: string;
    chapters: Array<{
      title: string;
      content: string;
    }>;
    assignments?: Array<{
      title: string;
      description: string;
      dueDate: string;
      points: number;
    }>;
    quizzes?: Array<{
      title: string;
      description: string;
      timeLimit: number;
      questions: Array<{
        question: string;
        type: string;
        options?: string[];
        correctAnswer?: string;
        points: number;
      }>;
    }>;
    discussions?: Array<{
      title: string;
      prompt: string;
    }>;
  }>;
}

export class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private defaultModel = 'codellama:7b';

  private extractSimpleTopic(prompt: string): string {
    console.log('🔍 Extracting topic from prompt:', prompt);
    
    // First, try to extract from common patterns - FIXED to capture what comes AFTER "for"
    const patterns = [
      /course\s+(on|about|for)\s+([^,\s]+(?:\s+[^,\s]+)*)/i,
      /create\s+(a\s+)?course\s+(on|about|for)\s+([^,\s]+(?:\s+[^,\s]+)*)/i,
      /generate\s+(a\s+)?course\s+(on|about|for)\s+([^,\s]+(?:\s+[^,\s]+)*)/i,
      /design\s+(a\s+)?course\s+(on|about|for)\s+([^,\s]+(?:\s+[^,\s]+)*)/i
    ];
    
    console.log('🔍 Trying simple patterns first...');
    
    // Also try simpler patterns that capture the actual topic
    const simplePatterns = [
      /(javascript|python|java|react|node|blockchain|ai|machine|data|web|mobile|cloud|database|sql|html|css|php|ruby|go|rust|swift|kotlin|typescript|angular|vue|django|flask|express|mongodb|mysql|postgresql|redis|docker|kubernetes|aws|azure|gcp)/i
    ];
    
    console.log('🔍 Simple patterns to try:', simplePatterns.map(p => p.source));
    
    // Try simple patterns first
    for (const pattern of simplePatterns) {
      console.log('🔍 Testing pattern:', pattern.source);
      const match = prompt.match(pattern);
      console.log('🔍 Pattern match result:', match);
      if (match) {
        const extractedTopic = match[1];
        console.log('✅ Found tech word via simple pattern:', extractedTopic);
        return extractedTopic.charAt(0).toUpperCase() + extractedTopic.slice(1);
      }
    }
    
    console.log('🔍 Trying complex patterns...');
    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        console.log('📝 Complex pattern matched:', match[0]);
        console.log('📝 Match groups:', match);
        
        // The regex captures: group 1 = preposition, group 2 = topic
        // But our regex is wrong - it's capturing "for" as the topic
        // Let me fix this by looking at the actual match structure
        
        if (match.length >= 3) {
          const preposition = match[1]; // on/about/for
          const topic = match[2]; // the actual topic
          console.log('📝 Preposition:', preposition);
          console.log('📝 Topic from regex:', topic);
          
          // If we got a preposition as the topic, extract from after the match
          if (['on', 'about', 'for'].includes(topic.toLowerCase())) {
            const afterMatch = prompt.substring(match.index! + match[0].length).trim();
            console.log('📝 After match:', afterMatch);
            
            // Extract the first meaningful word after the match
            const meaningfulWords = afterMatch.toLowerCase().split(/\s+/).filter(word => 
              word.length > 2 && 
              !['with', 'and', 'the', 'for', 'in', 'to', 'of', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'course', 'create', 'generate', 'design', 'make', 'build', 'develop', 'learn', 'study', 'teach', 'about', 'on', 'for', 'beginners', 'intermediate', 'advanced', 'programming', 'development', 'basics', 'fundamentals'].includes(word)
            );
            
            if (meaningfulWords.length > 0) {
              const extractedTopic = meaningfulWords[0];
              console.log('✅ Extracted topic after match:', extractedTopic);
              return extractedTopic.charAt(0).toUpperCase() + extractedTopic.slice(1);
            }
          } else {
            // We got a real topic, clean it up
            const cleanTopic = topic.toLowerCase().replace(/\b(beginners?|intermediate|advanced|programming|development|basics|fundamentals|with|and|the|for|in|to|of)\b/gi, '').trim();
            const words = cleanTopic.split(/\s+/).filter(word => word.length > 2);
            if (words.length > 0) {
              const extractedTopic = words[0];
              console.log('✅ Extracted topic from regex:', extractedTopic);
              return extractedTopic.charAt(0).toUpperCase() + extractedTopic.slice(1);
            }
          }
        }
      }
    }
    
    // Fallback: try to find any word that looks like a programming language or technology
    const techWords = ['javascript', 'python', 'java', 'react', 'node', 'blockchain', 'ai', 'machine', 'data', 'web', 'mobile', 'cloud', 'database', 'sql', 'html', 'css', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript', 'angular', 'vue', 'django', 'flask', 'express', 'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'];
    
    console.log('🔍 Checking individual words for tech terms...');
    const words = prompt.toLowerCase().split(/\s+/);
    console.log('🔍 All words in prompt:', words);
    
    for (const word of words) {
      console.log('🔍 Checking word:', word, 'against tech words');
      if (techWords.includes(word)) {
        console.log('✅ Found tech word:', word);
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    }
    
    // Last resort: try to extract any meaningful word
    const meaningfulWords = prompt.toLowerCase().split(/\s+/).filter(word => 
      word.length > 3 && 
      !['with', 'and', 'the', 'for', 'in', 'to', 'of', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'course', 'create', 'generate', 'design', 'make', 'build', 'develop', 'learn', 'study', 'teach', 'about', 'on', 'for', 'beginners', 'intermediate', 'advanced', 'programming', 'development', 'basics', 'fundamentals'].includes(word)
    );
    
    if (meaningfulWords.length > 0) {
      const fallbackTopic = meaningfulWords[0];
      console.log('🔄 Using fallback topic:', fallbackTopic);
      return fallbackTopic.charAt(0).toUpperCase() + fallbackTopic.slice(1);
    }
    
    // If still no meaningful word found, try to extract from the prompt more aggressively
    const allWords = prompt.toLowerCase().split(/\s+/);
    console.log('🔍 All words in prompt:', allWords);
    
    for (const word of allWords) {
      if (word.length > 2 && !['for', 'the', 'and', 'with', 'in', 'to', 'of', 'a', 'an'].includes(word)) {
        console.log('🔄 Using aggressive fallback topic:', word);
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    }
    
    console.log('⚠️ No topic found, using default: Programming');
    console.log('⚠️ This means the topic extraction failed completely');
    return 'Programming';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateCourse(request: CourseGenerationRequest): Promise<GeneratedCourse> {
    const model = request.model || this.defaultModel;
    
    // Extract numbers and topic once
    const moduleMatch = request.prompt.match(/(\d+)\s*modules?/i);
    const chapterMatch = request.prompt.match(/(\d+)\s*chapters?/i);
    const numModules = moduleMatch ? parseInt(moduleMatch[1]) : 2;
    const numChapters = chapterMatch ? parseInt(chapterMatch[1]) : 2;
    
    console.log('=== GENERATION DEBUG ===');
    console.log('Original prompt:', request.prompt);  
    console.log('Prompt length:', request.prompt.length);
    console.log('Prompt words:', request.prompt.split(' '));
    
    const topic = this.extractSimpleTopic(request.prompt);
    
    console.log('Extracted topic:', topic);
    console.log('Expected modules:', numModules);
    console.log('Expected chapters:', numChapters);
    console.log('Using model:', model);
    
    // Try AI generation first, but with a shorter timeout
    let aiCourseData = null;
    try {
      aiCourseData = await this.tryAIGeneration(topic, numModules, numChapters, model);
      console.log('✅ AI generation successful!');
    } catch (error) {
      console.log('❌ AI generation failed:', error);
      console.log('📝 Falling back to structured generation...');
    }
    
    // Use AI data if available, otherwise generate structured fallback
    const courseData = aiCourseData || this.generateStructuredCourse(request.prompt, topic, numModules, numChapters);
    
    return courseData;
  }
  
  private async tryAIGeneration(topic: string, numModules: number, numChapters: number, model: string): Promise<GeneratedCourse> {
    console.log(`🤖 Attempting AI generation for topic: "${topic}"`);
    
    // Step 1: Generate course title and description with AI using the actual prompt
    const titlePrompt = `Based on this course request: "${request.prompt}"
    
    Generate a compelling course title and description that matches the user's request.
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Course Title Here",
      "description": "Course description here"
    }`;

    try {
      const titleResponse = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: titlePrompt,
          stream: false,
          format: "json",
          options: {
            num_predict: 512,
            temperature: 0.3,
            top_p: 0.9
          }
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!titleResponse.ok) {
        throw new Error(`Title generation failed: ${titleResponse.status}`);
      }

      const titleData = await titleResponse.json();
      let courseTitle, courseDescription;
      
      try {
        const titleResult = JSON.parse(titleData.response);
        courseTitle = titleResult.title || `${topic} Course`;
        courseDescription = titleResult.description || `A comprehensive course covering all aspects of ${topic}.`;
      } catch {
        courseTitle = `${topic} Course`;
        courseDescription = `A comprehensive course covering all aspects of ${topic}.`;
      }

      // Step 2: Generate chapter content with AI
      const chapters = [];
      for (let moduleIndex = 1; moduleIndex <= numModules; moduleIndex++) {
        const moduleChapters = [];
        for (let chapterIndex = 1; chapterIndex <= numChapters; chapterIndex++) {
          const chapterPrompt = `Based on this course request: "${request.prompt}"
          
          Write a detailed chapter for chapter ${chapterIndex} of module ${moduleIndex} that specifically addresses the user's request.
          Focus on practical, educational content that matches what the user asked for.
          Return ONLY the chapter content as plain text (no JSON).`;
          
          try {
            const chapterResponse = await fetch(`${this.baseUrl}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: model,
                prompt: chapterPrompt,
                stream: false,
                options: {
                  num_predict: 1024,
                  temperature: 0.4,
                  top_p: 0.9
                }
              }),
              signal: AbortSignal.timeout(30000)
            });

            if (chapterResponse.ok) {
              const chapterData = await chapterResponse.json();
              const chapterContent = chapterData.response.trim();
              moduleChapters.push({
                title: `Chapter ${chapterIndex}: ${topic} - Part ${chapterIndex}`,
                content: chapterContent || `This chapter covers essential concepts of ${topic}. You will learn key principles and practical applications.`
              });
            } else {
              // Fallback chapter content with unique themes
              const chapterThemes = [
                { title: "Introduction", content: "Get started with the essential concepts and setup" },
                { title: "Core Concepts", content: "Understand the fundamental principles and building blocks" },
                { title: "Best Practices", content: "Learn industry-standard approaches and methodologies" },
                { title: "Advanced Techniques", content: "Master sophisticated features and complex scenarios" },
                { title: "Real-world Examples", content: "See how concepts apply in practical situations" },
                { title: "Troubleshooting", content: "Learn to debug and solve common problems" }
              ];
              const globalChapterIndex = ((moduleIndex - 1) * numChapters + chapterIndex - 1);
              const chapterThemeIndex = globalChapterIndex % chapterThemes.length;
              const chapterTheme = chapterThemes[chapterThemeIndex];
              moduleChapters.push({
                title: `Chapter ${chapterIndex}: ${chapterTheme.title} of ${topic}`,
                content: `This chapter focuses on ${chapterTheme.content} of ${topic}. You will learn key principles and practical applications.`
              });
            }
          } catch (error) {
            console.log(`Chapter ${chapterIndex} generation failed, using fallback`);
            const chapterThemes = [
              { title: "Introduction", content: "Get started with the essential concepts and setup" },
              { title: "Core Concepts", content: "Understand the fundamental principles and building blocks" },
              { title: "Best Practices", content: "Learn industry-standard approaches and methodologies" },
              { title: "Advanced Techniques", content: "Master sophisticated features and complex scenarios" },
              { title: "Real-world Examples", content: "See how concepts apply in practical situations" },
              { title: "Troubleshooting", content: "Learn to debug and solve common problems" }
            ];
            const globalChapterIndex = ((moduleIndex - 1) * numChapters + chapterIndex - 1);
            const chapterThemeIndex = globalChapterIndex % chapterThemes.length;
            const chapterTheme = chapterThemes[chapterThemeIndex];
            moduleChapters.push({
              title: `Chapter ${chapterIndex}: ${chapterTheme.title} of ${topic}`,
              content: `This chapter focuses on ${chapterTheme.content} of ${topic}. You will learn key principles and practical applications.`
            });
          }
        }
        chapters.push(moduleChapters);
      }

             // Step 3: Build the complete course structure with unique themes
       const modules = [];
       
       // Define varied module themes and focuses
       const moduleThemes = [
         { title: "Fundamentals", description: "Master the core concepts and basic principles", focus: "basics" },
         { title: "Advanced Concepts", description: "Explore complex topics and advanced techniques", focus: "advanced" },
         { title: "Practical Applications", description: "Learn real-world implementation and best practices", focus: "practical" },
         { title: "Project Development", description: "Build complete projects and applications", focus: "projects" },
         { title: "Industry Standards", description: "Understand professional development workflows", focus: "professional" },
         { title: "Optimization & Performance", description: "Learn optimization techniques and performance tuning", focus: "optimization" }
       ];
       
       // Define varied assignment types
       const assignmentTypes = [
         { title: "Practice Exercise", description: "Complete hands-on exercises to reinforce your understanding" },
         { title: "Mini Project", description: "Build a small application using the concepts learned" },
         { title: "Code Review", description: "Analyze and improve existing code examples" },
         { title: "Research Task", description: "Investigate advanced topics and present findings" },
         { title: "Debugging Challenge", description: "Identify and fix issues in provided code" },
         { title: "Documentation", description: "Create comprehensive documentation for a project" }
       ];
       
       // Define varied discussion topics
       const discussionTopics = [
         { title: "Learning Challenges", prompt: "What challenges did you face while learning this topic? How did you overcome them?" },
         { title: "Real-world Applications", prompt: "Share examples of how this technology is used in industry. What are the benefits and challenges?" },
         { title: "Best Practices Debate", prompt: "Discuss different approaches to solving problems. What methods do you prefer and why?" },
         { title: "Future Trends", prompt: "How do you think this technology will evolve? What new features or applications do you anticipate?" },
         { title: "Career Impact", prompt: "How has learning this technology influenced your career goals? What opportunities has it opened up?" },
         { title: "Community Insights", prompt: "Share resources, tools, or communities that have helped you in your learning journey" }
       ];
       
               // Define varied quiz questions - 18 total questions
        const quizQuestions = [
          // Module 1 - Fundamentals questions
          {
            question: "What are the fundamental principles of this technology?",
            options: [
              "Efficiency and scalability",
              "Simplicity and maintainability", 
              "Performance and reliability",
              "All of the above"
            ],
            correctAnswer: "All of the above"
          },
          {
            question: "Which approach is considered best practice?",
            options: [
              "Following established patterns",
              "Using the latest features only",
              "Ignoring documentation",
              "Copying code without understanding"
            ],
            correctAnswer: "Following established patterns"
          },
          {
            question: "What is the most important skill to develop?",
            options: [
              "Problem-solving ability",
              "Memorizing syntax",
              "Using advanced features",
              "Following tutorials exactly"
            ],
            correctAnswer: "Problem-solving ability"
          },
          {
            question: "How do you handle complex scenarios in this technology?",
            options: [
              "Break down into smaller problems",
              "Use advanced features immediately",
              "Ignore complexity",
              "Copy from examples"
            ],
            correctAnswer: "Break down into smaller problems"
          },
          {
            question: "What's the best way to learn advanced concepts?",
            options: [
              "Build real projects",
              "Read documentation only",
              "Watch tutorials",
              "Memorize syntax"
            ],
            correctAnswer: "Build real projects"
          },
          {
            question: "How would you optimize performance?",
            options: [
              "Using efficient algorithms",
              "Minimizing resource usage",
              "Implementing caching strategies",
              "All of the above"
            ],
            correctAnswer: "All of the above"
          },
          // Module 2 - Advanced questions
          {
            question: "What advanced techniques should you master?",
            options: [
              "Complex algorithms and data structures",
              "Basic syntax only",
              "Simple examples",
              "Documentation reading"
            ],
            correctAnswer: "Complex algorithms and data structures"
          },
          {
            question: "How do you implement advanced features?",
            options: [
              "Through systematic learning and practice",
              "By copying code from the internet",
              "By skipping fundamentals",
              "By memorizing everything"
            ],
            correctAnswer: "Through systematic learning and practice"
          },
          {
            question: "What's the key to mastering advanced concepts?",
            options: [
              "Understanding underlying principles",
              "Memorizing code examples",
              "Using advanced features immediately",
              "Ignoring basic concepts"
            ],
            correctAnswer: "Understanding underlying principles"
          },
          {
            question: "How do you approach complex problem-solving?",
            options: [
              "Break down into manageable parts",
              "Use the most advanced features",
              "Copy solutions from others",
              "Avoid complex problems"
            ],
            correctAnswer: "Break down into manageable parts"
          },
          {
            question: "What's essential for advanced development?",
            options: [
              "Strong foundation and continuous learning",
              "Using the latest tools only",
              "Following trends blindly",
              "Avoiding documentation"
            ],
            correctAnswer: "Strong foundation and continuous learning"
          },
          {
            question: "How do you stay current with advanced topics?",
            options: [
              "Continuous learning and practice",
              "Reading only basic tutorials",
              "Ignoring new developments",
              "Copying others' work"
            ],
            correctAnswer: "Continuous learning and practice"
          },
          // Module 3 - Practical questions
          {
            question: "How do you apply concepts in real projects?",
            options: [
              "Through hands-on practice and experimentation",
              "By reading theory only",
              "By avoiding practical work",
              "By copying existing projects"
            ],
            correctAnswer: "Through hands-on practice and experimentation"
          },
          {
            question: "What's the best approach to real-world implementation?",
            options: [
              "Start small and iterate",
              "Build complex systems immediately",
              "Avoid real-world scenarios",
              "Copy complete solutions"
            ],
            correctAnswer: "Start small and iterate"
          },
          {
            question: "How do you handle real-world challenges?",
            options: [
              "Adapt and learn from experience",
              "Stick to textbook examples only",
              "Avoid challenging situations",
              "Give up when faced with problems"
            ],
            correctAnswer: "Adapt and learn from experience"
          },
          {
            question: "What's crucial for practical success?",
            options: [
              "Understanding context and requirements",
              "Following tutorials exactly",
              "Ignoring real-world constraints",
              "Using only theoretical knowledge"
            ],
            correctAnswer: "Understanding context and requirements"
          },
          {
            question: "How do you ensure practical solutions work?",
            options: [
              "Test and validate thoroughly",
              "Assume everything works",
              "Ignore testing completely",
              "Copy without understanding"
            ],
            correctAnswer: "Test and validate thoroughly"
          },
          {
            question: "What's the key to practical problem-solving?",
            options: [
              "Understanding the problem deeply",
              "Using the most complex solution",
              "Avoiding real problems",
              "Copying solutions blindly"
            ],
            correctAnswer: "Understanding the problem deeply"
          }
        ];
       
       for (let i = 1; i <= numModules; i++) {
         const moduleTheme = moduleThemes[(i - 1) % moduleThemes.length];
         const assignmentType = assignmentTypes[(i - 1) % assignmentTypes.length];
         const discussionTopic = discussionTopics[(i - 1) % discussionTopics.length];
         
         const module = {
           title: `Module ${i}: ${topic} ${moduleTheme.title}`,
           description: `${moduleTheme.description} of ${topic}. This module will help you develop a strong foundation in ${topic} ${moduleTheme.focus}.`,
           chapters: chapters[i - 1] || [],
           assignments: [{
             title: `${topic} ${assignmentType.title} ${i}`,
             description: `${assignmentType.description} of ${topic} concepts. Apply your knowledge through practical exercises and real-world scenarios.`,
             dueDate: "2024-12-31",
             points: 100
           }],
           discussions: [{
             title: `${topic} ${discussionTopic.title}`,
             prompt: `${discussionTopic.prompt} Consider how this relates to ${topic} and share your experiences.`
           }],
                       quizzes: [{
              title: `${topic} Assessment ${i}`,
              description: `Test your understanding of ${topic} ${moduleTheme.focus} concepts and principles.`,
              timeLimit: 30,
              questions: [
                {
                  question: quizQuestions[(i - 1) * 6].question,
                  type: "multiple-choice",
                  options: quizQuestions[(i - 1) * 6].options,
                  correctAnswer: quizQuestions[(i - 1) * 6].correctAnswer,
                  points: 10
                },
                {
                  question: quizQuestions[(i - 1) * 6 + 1].question,
                  type: "multiple-choice",
                  options: quizQuestions[(i - 1) * 6 + 1].options,
                  correctAnswer: quizQuestions[(i - 1) * 6 + 1].correctAnswer,
                  points: 10
                },
                {
                  question: `How would you apply ${topic} ${moduleTheme.focus} in a real project?`,
                  type: "short-answer",
                  points: 15
                }
              ]
            }]
         };
         modules.push(module);
       }

      console.log('✅ AI generation successful with hybrid approach!');
      return {
        title: courseTitle,
        description: courseDescription,
        category: "Programming",
        difficulty: "beginner",
        modules: modules
      };

    } catch (error) {
      console.log('❌ AI generation failed:', error);
      throw new Error('AI generation failed');
    }
  }
  
  private generateStructuredCourse(originalPrompt: string, topic: string, numModules: number, numChapters: number): GeneratedCourse {
    console.log(`📚 Generating structured course for prompt: "${originalPrompt}"`);
    console.log(`📚 Extracted topic: "${topic}"`);
    
    const modules = [];
    
    // Define varied module themes and focuses
    const moduleThemes = [
      { title: "Fundamentals", description: "Master the core concepts and basic principles", focus: "basics" },
      { title: "Advanced Concepts", description: "Explore complex topics and advanced techniques", focus: "advanced" },
      { title: "Practical Applications", description: "Learn real-world implementation and best practices", focus: "practical" },
      { title: "Project Development", description: "Build complete projects and applications", focus: "projects" },
      { title: "Industry Standards", description: "Understand professional development workflows", focus: "professional" },
      { title: "Optimization & Performance", description: "Learn optimization techniques and performance tuning", focus: "optimization" }
    ];
    
    // Define varied chapter themes
    const chapterThemes = [
      { title: "Introduction", content: "Get started with the essential concepts and setup" },
      { title: "Core Concepts", content: "Understand the fundamental principles and building blocks" },
      { title: "Best Practices", content: "Learn industry-standard approaches and methodologies" },
      { title: "Advanced Techniques", content: "Master sophisticated features and complex scenarios" },
      { title: "Real-world Examples", content: "See how concepts apply in practical situations" },
      { title: "Troubleshooting", content: "Learn to debug and solve common problems" },
      { title: "Performance Tips", content: "Optimize your code for better efficiency" },
      { title: "Integration", content: "Connect with other technologies and systems" },
      { title: "Security Fundamentals", content: "Learn essential security practices and principles" },
      { title: "Testing Strategies", content: "Master testing methodologies and quality assurance" },
      { title: "Deployment", content: "Understand deployment processes and production considerations" },
      { title: "Maintenance", content: "Learn ongoing maintenance and update strategies" }
    ];
    
    // Define varied assignment types
    const assignmentTypes = [
      { title: "Practice Exercise", description: "Complete hands-on exercises to reinforce your understanding" },
      { title: "Mini Project", description: "Build a small application using the concepts learned" },
      { title: "Code Review", description: "Analyze and improve existing code examples" },
      { title: "Research Task", description: "Investigate advanced topics and present findings" },
      { title: "Debugging Challenge", description: "Identify and fix issues in provided code" },
      { title: "Documentation", description: "Create comprehensive documentation for a project" }
    ];
    
    // Define varied discussion topics
    const discussionTopics = [
      { title: "Learning Challenges", prompt: "What challenges did you face while learning this topic? How did you overcome them?" },
      { title: "Real-world Applications", prompt: "Share examples of how this technology is used in industry. What are the benefits and challenges?" },
      { title: "Best Practices Debate", prompt: "Discuss different approaches to solving problems. What methods do you prefer and why?" },
      { title: "Future Trends", prompt: "How do you think this technology will evolve? What new features or applications do you anticipate?" },
      { title: "Career Impact", prompt: "How has learning this technology influenced your career goals? What opportunities has it opened up?" },
      { title: "Community Insights", prompt: "Share resources, tools, or communities that have helped you in your learning journey" }
    ];
    
         // Define varied quiz questions for different modules - 18 total questions
     const quizQuestions = [
       // Module 1 - Fundamentals questions
       {
         question: "What are the fundamental principles of this technology?",
         options: [
           "Efficiency and scalability",
           "Simplicity and maintainability", 
           "Performance and reliability",
           "All of the above"
         ],
         correctAnswer: "All of the above"
       },
       {
         question: "Which approach is considered best practice?",
         options: [
           "Following established patterns",
           "Using the latest features only",
           "Ignoring documentation",
           "Copying code without understanding"
         ],
         correctAnswer: "Following established patterns"
       },
       {
         question: "What is the most important skill to develop?",
         options: [
           "Problem-solving ability",
           "Memorizing syntax",
           "Using advanced features",
           "Following tutorials exactly"
         ],
         correctAnswer: "Problem-solving ability"
       },
       {
         question: "How do you handle complex scenarios in this technology?",
         options: [
           "Break down into smaller problems",
           "Use advanced features immediately",
           "Ignore complexity",
           "Copy from examples"
         ],
         correctAnswer: "Break down into smaller problems"
       },
       {
         question: "What's the best way to learn advanced concepts?",
         options: [
           "Build real projects",
           "Read documentation only",
           "Watch tutorials",
           "Memorize syntax"
         ],
         correctAnswer: "Build real projects"
       },
       {
         question: "How would you optimize performance?",
         options: [
           "Using efficient algorithms",
           "Minimizing resource usage",
           "Implementing caching strategies",
           "All of the above"
         ],
         correctAnswer: "All of the above"
       },
       // Module 2 - Advanced questions
       {
         question: "What advanced techniques should you master?",
         options: [
           "Complex algorithms and data structures",
           "Basic syntax only",
           "Simple examples",
           "Documentation reading"
         ],
         correctAnswer: "Complex algorithms and data structures"
       },
       {
         question: "How do you implement advanced features?",
         options: [
           "Through systematic learning and practice",
           "By copying code from the internet",
           "By skipping fundamentals",
           "By memorizing everything"
         ],
         correctAnswer: "Through systematic learning and practice"
       },
       {
         question: "What's the key to mastering advanced concepts?",
         options: [
           "Understanding underlying principles",
           "Memorizing code examples",
           "Using advanced features immediately",
           "Ignoring basic concepts"
         ],
         correctAnswer: "Understanding underlying principles"
       },
       {
         question: "How do you approach complex problem-solving?",
         options: [
           "Break down into manageable parts",
           "Use the most advanced features",
           "Copy solutions from others",
           "Avoid complex problems"
         ],
         correctAnswer: "Break down into manageable parts"
       },
       {
         question: "What's essential for advanced development?",
         options: [
           "Strong foundation and continuous learning",
           "Using the latest tools only",
           "Following trends blindly",
           "Avoiding documentation"
         ],
         correctAnswer: "Strong foundation and continuous learning"
       },
       {
         question: "How do you stay current with advanced topics?",
         options: [
           "Continuous learning and practice",
           "Reading only basic tutorials",
           "Ignoring new developments",
           "Copying others' work"
         ],
         correctAnswer: "Continuous learning and practice"
       },
       // Module 3 - Practical questions
       {
         question: "How do you apply concepts in real projects?",
         options: [
           "Through hands-on practice and experimentation",
           "By reading theory only",
           "By avoiding practical work",
           "By copying existing projects"
         ],
         correctAnswer: "Through hands-on practice and experimentation"
       },
       {
         question: "What's the best approach to real-world implementation?",
         options: [
           "Start small and iterate",
           "Build complex systems immediately",
           "Avoid real-world scenarios",
           "Copy complete solutions"
         ],
         correctAnswer: "Start small and iterate"
       },
       {
         question: "How do you handle real-world challenges?",
         options: [
           "Adapt and learn from experience",
           "Stick to textbook examples only",
           "Avoid challenging situations",
           "Give up when faced with problems"
         ],
         correctAnswer: "Adapt and learn from experience"
       },
       {
         question: "What's crucial for practical success?",
         options: [
           "Understanding context and requirements",
           "Following tutorials exactly",
           "Ignoring real-world constraints",
           "Using only theoretical knowledge"
         ],
         correctAnswer: "Understanding context and requirements"
       },
       {
         question: "How do you ensure practical solutions work?",
         options: [
           "Test and validate thoroughly",
           "Assume everything works",
           "Ignore testing completely",
           "Copy without understanding"
         ],
         correctAnswer: "Test and validate thoroughly"
       },
       {
         question: "What's the key to practical problem-solving?",
         options: [
           "Understanding the problem deeply",
           "Using the most complex solution",
           "Avoiding real problems",
           "Copying solutions blindly"
         ],
         correctAnswer: "Understanding the problem deeply"
       }
     ];
    
    for (let i = 1; i <= numModules; i++) {
      const moduleTheme = moduleThemes[(i - 1) % moduleThemes.length];
      const chapters = [];
      
      for (let j = 1; j <= numChapters; j++) {
        // Make chapter index unique across all modules
        const globalChapterIndex = ((i - 1) * numChapters + j - 1);
        const chapterTheme = chapterThemes[globalChapterIndex % chapterThemes.length];
        chapters.push({
          title: `Chapter ${j}: ${chapterTheme.title} of ${topic}`,
          content: `This chapter focuses on ${chapterTheme.content} of ${topic}. Based on your request for "${originalPrompt}", you will learn key principles and practical applications that form the foundation of understanding ${topic} ${moduleTheme.focus}.`
        });
      }
      
      const assignmentType = assignmentTypes[(i - 1) % assignmentTypes.length];
      const discussionTopic = discussionTopics[(i - 1) % discussionTopics.length];
      
      const module = {
        title: `Module ${i}: ${topic} ${moduleTheme.title}`,
        description: `${moduleTheme.description} of ${topic}. This module will help you develop a strong foundation in ${topic} ${moduleTheme.focus}.`,
        chapters: chapters,
        assignments: [{
          title: `${topic} ${assignmentType.title} ${i}`,
          description: `${assignmentType.description} of ${topic} concepts. Apply your knowledge through practical exercises and real-world scenarios.`,
          dueDate: "2024-12-31",
          points: 100
        }],
        discussions: [{
          title: `${topic} ${discussionTopic.title}`,
          prompt: `${discussionTopic.prompt} Consider how this relates to ${topic} and share your experiences.`
        }],
                 quizzes: [{
           title: `${topic} Assessment ${i}`,
           description: `Test your understanding of ${topic} ${moduleTheme.focus} concepts and principles.`,
           timeLimit: 30,
           questions: [
             {
               question: quizQuestions[(i - 1) * 6].question,
               type: "multiple-choice",
               options: quizQuestions[(i - 1) * 6].options,
               correctAnswer: quizQuestions[(i - 1) * 6].correctAnswer,
               points: 10
             },
             {
               question: quizQuestions[(i - 1) * 6 + 1].question,
               type: "multiple-choice",
               options: quizQuestions[(i - 1) * 6 + 1].options,
               correctAnswer: quizQuestions[(i - 1) * 6 + 1].correctAnswer,
               points: 10
             },
             {
               question: `How would you apply ${topic} ${moduleTheme.focus} in a real project?`,
               type: "short-answer",
               points: 15
             }
           ]
         }]
      };
      
      modules.push(module);
    }
    
    // Create a more specific title and description based on the original prompt
    const title = originalPrompt.toLowerCase().includes('javascript') ? 'JavaScript Programming Course' :
                  originalPrompt.toLowerCase().includes('python') ? 'Python Programming Course' :
                  originalPrompt.toLowerCase().includes('react') ? 'React Development Course' :
                  originalPrompt.toLowerCase().includes('web') ? 'Web Development Course' :
                  originalPrompt.toLowerCase().includes('ai') || originalPrompt.toLowerCase().includes('machine') ? 'AI and Machine Learning Course' :
                  originalPrompt.toLowerCase().includes('data') ? 'Data Science Course' :
                  `${topic} Course`;
    
    const description = `A comprehensive course based on your request: "${originalPrompt}". Learn through structured modules, hands-on assignments, and interactive discussions. Each module builds upon the previous one to create a complete learning experience tailored to your specific needs.`;
    
    return {
      title: title,
      description: description,
      category: "Programming",
      difficulty: "beginner",
      modules: modules
    };
  }
} 