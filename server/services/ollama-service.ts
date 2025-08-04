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
  private defaultModel = 'llama3.2:1b';

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

    console.log('Generating course with AI for prompt:', request.prompt);
    
    // Clear system prompt for JSON generation
    const systemPrompt = "Generate valid JSON only.";
    
    // Short, focused user prompt
    const userPrompt = `Create a course about "${request.prompt}" with ${numModules} modules and ${numChapters} chapters each. Generate complete JSON with modules array.`;

    console.log('Using model:', model);

    // Retry configuration
    const maxRetries = 3;
    const baseTimeout = 180000; // 3 minutes base timeout
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} - Generating course...`);
        
        // Increase timeout for each retry
        const timeout = baseTimeout * attempt;
        console.log(`Using timeout: ${timeout}ms (${timeout / 1000}s)`);

        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            prompt: userPrompt,
            system: systemPrompt,
            stream: false,
            format: "json",
            options: {
              num_predict: 1024,
              temperature: 0.3,
              top_p: 0.9,
              repeat_penalty: 1.1
            }
          }),
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Raw Ollama response:", data);
        
        let responseText = data.response;
        console.log('Raw AI response:', responseText);
        
        // Try to extract JSON from the response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // Try to find JSON in markdown code blocks
          const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            jsonMatch = codeBlockMatch;
          } else {
            throw new Error('Invalid JSON response from AI - no JSON object found');
          }
        }
        
        const jsonString = jsonMatch[0];
        console.log('Extracted JSON string:', jsonString.substring(0, 200) + '...');
        
        let courseData: any;
        try {
          courseData = JSON.parse(jsonString);
        } catch (parseError) {
          console.log('Failed to parse extracted JSON:', parseError);
          
          // Try to fix common JSON issues
          let fixedJsonString = jsonString
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/,\s*,/g, ',') // Remove double commas
            .replace(/\[\s*,/g, '[') // Remove leading commas
            .replace(/{\s*,/g, '{') // Remove leading commas in objects
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove Unicode escape sequences
            .replace(/[^\x20-\x7E]/g, ''); // Remove non-printable characters
          
          try {
            courseData = JSON.parse(fixedJsonString);
            console.log('Successfully fixed and parsed JSON');
          } catch (secondParseError) {
            console.log('JSON parsing failed even after fixes, creating fallback structure');
            // Create a basic fallback structure
            courseData = {
              title: `${request.prompt} Course`,
              description: `Learn ${request.prompt} with this comprehensive course.`,
              category: "Programming",
              difficulty: "beginner",
              modules: []
            };
          }
        }
        
        console.log("Parsed course data:", JSON.stringify(courseData, null, 2));
        
        // Validate and fix course structure
        if (!courseData.title || typeof courseData.title !== 'string') {
          courseData.title = `${request.prompt} Course`;
        }
        
        if (!courseData.description || typeof courseData.description !== 'string') {
          courseData.description = `Learn ${request.prompt} with this comprehensive course.`;
        }
        
        if (!courseData.category) {
          courseData.category = "Programming";
        }
        
        if (!courseData.difficulty) {
          courseData.difficulty = "beginner";
        }
        
        // Always ensure modules exist and have complete structure
        if (!courseData.modules || !Array.isArray(courseData.modules) || courseData.modules.length === 0) {
          console.log('Creating complete module structure with assignments and quizzes');
          courseData.modules = [];
          
          for (let i = 0; i < numModules; i++) {
            const module = {
              title: `Module ${i + 1}: ${request.prompt} Fundamentals`,
              description: `Learn the fundamentals of ${request.prompt} in this module.`,
              chapters: [],
              assignments: [],
              discussions: [],
              quizzes: []
            };

            // Generate chapters
            for (let j = 0; j < numChapters; j++) {
              module.chapters.push({
                title: `Chapter ${j + 1}: ${request.prompt} Basics`,
                content: `This chapter covers the basics of ${request.prompt}.`
              });
            }

            // Always add assignments
            module.assignments.push({
              title: `Assignment ${i + 1}: ${request.prompt} Project`,
              description: `Complete a project demonstrating your understanding of ${request.prompt}.`,
              dueDate: "2024-12-31",
              points: 50
            });

            // Always add discussions
            module.discussions.push({
              title: `Discussion ${i + 1}: ${request.prompt} Discussion`,
              prompt: `Share your thoughts and experiences with ${request.prompt}.`
            });

            // Always add quiz
            module.quizzes.push({
              title: `Quiz ${i + 1}: ${request.prompt} Assessment`,
              description: `Test your knowledge of ${request.prompt}.`,
              timeLimit: 30,
              questions: [
                {
                  question: `What is the main concept in ${request.prompt}?`,
                  type: "multiple-choice",
                  options: ["Concept A", "Concept B", "Concept C", "Concept D"],
                  correctAnswer: "Concept A",
                  points: 10
                },
                {
                  question: `How would you apply ${request.prompt}?`,
                  type: "multiple-choice",
                  options: ["Method A", "Method B", "Method C", "Method D"],
                  correctAnswer: "Method A",
                  points: 10
                },
                {
                  question: `Explain a key learning from ${request.prompt}`,
                  type: "short-answer",
                  prompt: "Describe one important concept you learned",
                  points: 15
                }
              ]
            });

            courseData.modules.push(module);
          }
        } else {
          // Validate and fix existing modules to ensure they have assignments and quizzes
          courseData.modules = courseData.modules.map((module: any, index: number) => {
            if (!module.title || typeof module.title !== 'string') {
              module.title = `Module ${index + 1}: ${request.prompt} Fundamentals`;
            }
            
            if (!module.description || typeof module.description !== 'string') {
              module.description = `Learn the fundamentals of ${request.prompt} in this module.`;
            }
            
            if (!module.chapters || !Array.isArray(module.chapters)) {
              module.chapters = [];
            }
            
            // Always ensure assignments exist
            if (!module.assignments || !Array.isArray(module.assignments) || module.assignments.length === 0) {
              module.assignments = [{
                title: `Assignment ${index + 1}: ${request.prompt} Project`,
                description: `Complete a project demonstrating your understanding of ${request.prompt}.`,
                dueDate: "2024-12-31",
                points: 50
              }];
            }
            
            // Always ensure discussions exist
            if (!module.discussions || !Array.isArray(module.discussions) || module.discussions.length === 0) {
              module.discussions = [{
                title: `Discussion ${index + 1}: ${request.prompt} Discussion`,
                prompt: `Share your thoughts and experiences with ${request.prompt}.`
              }];
            }
            
            // Always ensure quizzes exist
            if (!module.quizzes || !Array.isArray(module.quizzes) || module.quizzes.length === 0) {
              module.quizzes = [{
                title: `Quiz ${index + 1}: ${request.prompt} Assessment`,
                description: `Test your knowledge of ${request.prompt}.`,
                timeLimit: 30,
                questions: [
                  {
                    question: `What is the main concept in ${request.prompt}?`,
                    type: "multiple-choice",
                    options: ["Concept A", "Concept B", "Concept C", "Concept D"],
                    correctAnswer: "Concept A",
                    points: 10
                  },
                  {
                    question: `How would you apply ${request.prompt}?`,
                    type: "multiple-choice",
                    options: ["Method A", "Method B", "Method C", "Method D"],
                    correctAnswer: "Method A",
                    points: 10
                  },
                  {
                    question: `Explain a key learning from ${request.prompt}`,
                    type: "short-answer",
                    prompt: "Describe one important concept you learned",
                    points: 15
                  }
                ]
              }];
            }
            
            return module;
          });
        }
        
        console.log('AI generation successful!');
        return courseData;
        
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * attempt, 5000); // Exponential backoff, max 5s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    console.log(`All ${maxRetries} attempts failed. Last error:`, lastError);
    throw new Error(`AI service failed after ${maxRetries} attempts. Please ensure Ollama is running and try again. Last error: ${lastError?.message}`);
  }
}