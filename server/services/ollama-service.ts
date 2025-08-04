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
  private defaultModel = 'deepseek-coder:6.7b';

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('Ollama not available:', error);
      return false;
    }
  }

  async generateCourse(request: CourseGenerationRequest): Promise<GeneratedCourse> {
    const model = request.model || this.defaultModel;
    
    // Extract numbers from the prompt for AI guidance
    const moduleMatch = request.prompt.match(/(\d+)\s*modules?/i);
    const chapterMatch = request.prompt.match(/(\d+)\s*chapters?/i);
    
    const numModules = moduleMatch ? parseInt(moduleMatch[1]) : 2;
    const numChapters = chapterMatch ? parseInt(chapterMatch[1]) : 2;

    // Always use AI generation - no hardcoded templates
    console.log('Generating course with AI for prompt:', request.prompt);
    
    // Use the model specified in the request, or fallback to default
    const aiModel = model || this.defaultModel;
    
    // Check if Ollama is available first
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      throw new Error('AI service is not available. Please ensure Ollama is running and try again.');
    }
    
    // Strict system prompt for JSON-only output
    const systemPrompt = "You are a JSON generator. Always respond with valid, complete JSON only. Never include markdown, explanations, or any other text outside the JSON object. Ensure all arrays and objects are properly closed with brackets and braces. For quizzes, always include 3 questions per quiz with 2 multiple-choice questions and 1 short-answer question to provide comprehensive assessment.";
    
    // Enhanced user prompt that incorporates the user's specific request
    const userPrompt = `Based on this user request: "${request.prompt}"

Generate a course with exactly ${numModules} modules and ${numChapters} chapters per module. Include assignments, discussions, and quizzes. IMPORTANT: Each quiz MUST have exactly 3 questions - 2 multiple-choice questions and 1 short-answer question. Return ONLY valid JSON with this exact structure:

{
  "title": "Course Title",
  "description": "Course description",
  "category": "Programming",
  "difficulty": "beginner",
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "chapters": [
        {
          "title": "Chapter Title",
          "content": "Chapter content"
        }
      ],
      "assignments": [
        {
          "title": "Assignment Title",
          "description": "Assignment description",
          "dueDate": "2024-12-31",
          "points": 50
        }
      ],
      "discussions": [
        {
          "title": "Discussion Title",
          "prompt": "Discussion prompt"
        }
      ],
      "quizzes": [
        {
          "title": "Quiz Title",
          "description": "Quiz description",
          "timeLimit": 30,
          "questions": [
            {
              "question": "Question 1 text?",
              "type": "multiple-choice",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Option A",
              "points": 10
            },
            {
              "question": "Question 2 text?",
              "type": "multiple-choice",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Option B",
              "points": 10
            },
            {
              "question": "Question 3 text?",
              "type": "short-answer",
              "prompt": "Explain the concept briefly",
              "points": 15
            }
          ]
        }
      ]
    }
  ]
}`;

    console.log('Using model:', aiModel);
    console.log('User prompt:', request.prompt);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiModel,
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
          options: {
            num_predict: 2048, // Increased for more detailed responses and complete JSON
            temperature: 0.3, // Slightly higher for more creative content
            top_p: 0.9,
            repeat_penalty: 1.1
          }
        }),
        signal: AbortSignal.timeout(60000), // 60 second timeout for AI generation
      });

      if (!response.ok) {
        console.log("Ollama request failed:", response.status, response.statusText);
        throw new Error(`Ollama request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw Ollama response:", data);
      
      let courseData: any;
      try {
        let responseText = data.response;
        console.log('Raw AI response:', responseText);
        
        // Try to extract JSON from the response - handle markdown code blocks
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log('No JSON object found in response, trying to extract from markdown');
          // Try to find JSON in markdown code blocks
          const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            jsonMatch = codeBlockMatch;
          }
        }
        
        if (!jsonMatch) {
          console.log('Failed to extract JSON from AI response');
          console.log('Response text:', responseText);
          throw new Error('Invalid JSON response from AI - no JSON object found');
        }
        
        const jsonString = jsonMatch[0];
        console.log('Extracted JSON string:', jsonString.substring(0, 200) + '...');
        
        try {
          courseData = JSON.parse(jsonString);
        } catch (parseError) {
          console.log('Failed to parse extracted JSON:', parseError);
          console.log('JSON string that failed to parse:', jsonString);
          
          // Try to fix common JSON issues
          let fixedJsonString = jsonString;
          
          // Find the first { and last } to extract just the JSON object
          const firstBraceIndex = fixedJsonString.indexOf('{');
          const lastBraceIndex = fixedJsonString.lastIndexOf('}');
          
          if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
            fixedJsonString = fixedJsonString.substring(firstBraceIndex, lastBraceIndex + 1);
          }
          
          // Try to fix missing closing brackets
          const openBraces = (fixedJsonString.match(/\{/g) || []).length;
          const closeBraces = (fixedJsonString.match(/\}/g) || []).length;
          const openBrackets = (fixedJsonString.match(/\[/g) || []).length;
          const closeBrackets = (fixedJsonString.match(/\]/g) || []).length;
          
          // Add missing closing braces
          for (let i = closeBraces; i < openBraces; i++) {
            fixedJsonString += '}';
          }
          
          // Add missing closing brackets
          for (let i = closeBrackets; i < openBrackets; i++) {
            fixedJsonString += ']';
          }
          
          try {
            courseData = JSON.parse(fixedJsonString);
            console.log('Successfully fixed and parsed JSON');
          } catch (secondParseError) {
            console.log('Failed to fix JSON:', secondParseError);
            console.log('Fixed JSON string:', fixedJsonString);
            
            // Try one more approach - find the largest valid JSON object
            try {
              // Find all possible JSON objects and try to parse the largest one
              const jsonMatches = fixedJsonString.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
              if (jsonMatches && jsonMatches.length > 0) {
                // Sort by length and try the largest one
                jsonMatches.sort((a, b) => b.length - a.length);
                for (const match of jsonMatches) {
                  try {
                    courseData = JSON.parse(match);
                    console.log('Successfully parsed JSON from match');
                    break;
                  } catch (e) {
                    continue;
                  }
                }
              }
            } catch (finalError) {
              console.error('All JSON parsing attempts failed:', finalError);
              throw new Error('Invalid JSON response from AI - parsing failed even after fixes');
            }
          }
        }
        
        console.log("Parsed course data:", JSON.stringify(courseData, null, 2));
        
        // Post-process the course data to ensure proper structure
        if (courseData.modules) {
          courseData.modules.forEach((module: any, moduleIndex: number) => {
            // Ensure discussions array exists
            if (!module.discussions || module.discussions.length === 0) {
              console.log(`Adding default discussion for module ${moduleIndex + 1}: ${module.title}`);
              module.discussions = [{
                title: `Discussion: ${module.title}`,
                prompt: `Share your thoughts and experiences with ${module.title}. What did you learn and what challenges did you face?`
              }];
            }

            // Ensure assignments array exists
            if (!module.assignments || module.assignments.length === 0) {
              console.log(`Adding default assignment for module ${moduleIndex + 1}: ${module.title}`);
              module.assignments = [{
                title: `Assignment: ${module.title}`,
                description: `Complete a project that demonstrates your understanding of ${module.title}`,
                dueDate: "2024-12-31",
                points: 50
              }];
            }

            // Ensure quizzes array exists and has exactly 3 questions
            if (!module.quizzes || module.quizzes.length === 0) {
              console.log(`Adding default quiz for module ${moduleIndex + 1}: ${module.title}`);
              module.quizzes = [{
                title: `Quiz: ${module.title}`,
                description: `Test your understanding of ${module.title}`,
                timeLimit: 30,
                questions: [
                  {
                    question: `What is the main concept covered in ${module.title}?`,
                    type: "multiple-choice",
                    options: ["Concept A", "Concept B", "Concept C", "Concept D"],
                    correctAnswer: "Concept A",
                    points: 10
                  },
                  {
                    question: `How would you apply the knowledge from ${module.title}?`,
                    type: "multiple-choice",
                    options: ["Method A", "Method B", "Method C", "Method D"],
                    correctAnswer: "Method A",
                    points: 10
                  },
                  {
                    question: `Explain a key learning from ${module.title}`,
                    type: "short-answer",
                    prompt: "Describe one important concept you learned",
                    points: 15
                  }
                ]
              }];
            } else {
              // Fix existing quizzes to ensure they have exactly 3 questions
              module.quizzes.forEach((quiz: any) => {
                if (quiz.questions) {
                  // Ensure exactly 3 questions
                  while (quiz.questions.length < 3) {
                    console.log(`Adding question ${quiz.questions.length + 1} to quiz: ${quiz.title}`);
                    
                    // If this is the 3rd question, make it a short-answer question
                    if (quiz.questions.length === 2) {
                      quiz.questions.push({
                        question: `Explain a key concept from ${quiz.title}`,
                        type: "short-answer",
                        prompt: "Describe one important concept you learned",
                        points: 15
                      });
                    } else {
                      // For questions 1 and 2, make them multiple-choice
                      quiz.questions.push({
                        question: `Additional question ${quiz.questions.length + 1} for ${quiz.title}?`,
                        type: "multiple-choice",
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correctAnswer: "Option A",
                        points: 10
                      });
                    }
                  }
                  
                  // If more than 3 questions, keep only the first 3
                  if (quiz.questions.length > 3) {
                    console.log(`Truncating quiz ${quiz.title} to 3 questions`);
                    quiz.questions = quiz.questions.slice(0, 3);
                  }
                  
                  // Fix each question structure
                  quiz.questions.forEach((question: any, questionIndex: number) => {
                    // Ensure question has proper structure
                    if (question.type === "multiple-choice" || !question.type) {
                      question.type = "multiple-choice";
                      
                      // Ensure options array exists with exactly 4 options
                      if (!question.options || question.options.length !== 4) {
                        // If options exist but not 4, pad or truncate to 4
                        if (question.options && question.options.length > 0) {
                          while (question.options.length < 4) {
                            question.options.push(`Option ${String.fromCharCode(68 + question.options.length)}`);
                          }
                          if (question.options.length > 4) {
                            question.options = question.options.slice(0, 4);
                          }
                        } else {
                          question.options = [
                            "Option A",
                            "Option B", 
                            "Option C",
                            "Option D"
                          ];
                        }
                      }
                      
                      // Ensure correctAnswer exists and is one of the options
                      if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
                        question.correctAnswer = question.options[0];
                      }
                      
                      // Ensure points exist
                      if (!question.points) {
                        question.points = 10;
                      }
                      
                      // Ensure question text exists
                      if (!question.question) {
                        question.question = `Question ${questionIndex + 1} for ${quiz.title}`;
                      }
                    } else if (question.type === "short-answer") {
                      // Ensure short-answer questions have proper structure
                      if (!question.prompt) {
                        question.prompt = "Explain your answer briefly";
                      }
                      if (!question.points) {
                        question.points = 15;
                      }
                    }
                  });
                }
              });
            }
          });
        }
        console.log("Post-processed course data:", JSON.stringify(courseData, null, 2));
        
        return courseData;
        
      } catch (parseError) {
        console.log("Failed to parse AI response as JSON:", parseError);
        throw new Error("Invalid JSON response from AI");
      }
      
    } catch (error) {
      console.log("AI generation failed:", error);
      
      // Try with a smaller model as fallback
      if (aiModel !== 'llama3.2:1b') {
        console.log('Trying fallback with llama3.2:1b model...');
        try {
          const fallbackResponse = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3.2:1b',
              prompt: userPrompt,
              system: systemPrompt,
              stream: false,
              options: {
                num_predict: 1024,
                temperature: 0.3,
                top_p: 0.9,
                repeat_penalty: 1.1
              }
            }),
            signal: AbortSignal.timeout(30000), // 30 second timeout for fallback
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log("Fallback model response received");
            // Process fallback response similar to main response
            // For now, just throw an error to indicate fallback was attempted
            throw new Error('Fallback model attempted but processing failed - please try again later');
          }
        } catch (fallbackError) {
          console.log('Fallback model also failed:', fallbackError);
        }
      }
      
      throw new Error("AI service is not available. Please ensure Ollama is running and try again.");
    }
  }
}