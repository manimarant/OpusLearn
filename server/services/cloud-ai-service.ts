export interface CloudAIConfig {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model?: string;
}

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

export class CloudAIService {
  private config: CloudAIConfig;

  constructor(config: CloudAIConfig) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test API connection based on provider
      switch (this.config.provider) {
        case 'openai':
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
            },
          });
          return response.ok;
        
        case 'anthropic':
          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.config.apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }],
            }),
          });
          return claudeResponse.status !== 401; // Not unauthorized
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Cloud AI availability check failed:', error);
      return false;
    }
  }

  async generateCourse(request: CourseGenerationRequest): Promise<GeneratedCourse> {
    const systemPrompt = `You are an expert course designer. Create a comprehensive course structure based on the user's request. 

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Course Title",
  "description": "Course description",
  "category": "Programming|Business|Design|Science|Other",
  "difficulty": "Beginner|Intermediate|Advanced",
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "chapters": [
        {
          "title": "Chapter Title",
          "content": "Detailed chapter content (minimum 200 words)"
        }
      ],
      "assignments": [
        {
          "title": "Assignment Title",
          "description": "Assignment description",
          "dueDate": "2024-01-15",
          "points": 100
        }
      ],
      "quizzes": [
        {
          "title": "Quiz Title",
          "description": "Quiz description",
          "timeLimit": 30,
          "questions": [
            {
              "question": "Question text",
              "type": "multiple-choice",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": "Option 1",
              "points": 10
            }
          ]
        }
      ],
      "discussions": [
        {
          "title": "Discussion Title",
          "prompt": "Discussion prompt"
        }
      ]
    }
  ]
}

Create 2-3 modules, each with 2-3 chapters. Make content practical and engaging.`;

    try {
      let aiResponse: string;

      switch (this.config.provider) {
        case 'openai':
          aiResponse = await this.generateWithOpenAI(systemPrompt, request.prompt);
          break;
        
        case 'anthropic':
          aiResponse = await this.generateWithAnthropic(systemPrompt, request.prompt);
          break;
        
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }

      // Parse and validate the JSON response
      const courseData = JSON.parse(aiResponse.trim());
      
      // Validate required fields
      if (!courseData.title || !courseData.modules || !Array.isArray(courseData.modules)) {
        throw new Error('Invalid course structure returned from AI');
      }

      return courseData as GeneratedCourse;

    } catch (error) {
      console.error('Cloud AI generation failed:', error);
      throw error;
    }
  }

  private async generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async generateWithAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [
          { 
            role: 'user', 
            content: `${systemPrompt}\n\nUser request: ${userPrompt}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}
