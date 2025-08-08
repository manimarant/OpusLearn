import { Course, CourseModule, Chapter, Assignment, Quiz, Discussion } from "@shared/schema";

export interface LMSConfig {
  apiUrl: string;
  apiKey: string;
  version?: string;
}

export interface LMSCourseData {
  course: Course & {
    instructor?: {
      id: string;
      name: string;
      email: string;
    };
  };
  modules: (CourseModule & {
    chapters: Chapter[];
  })[];
  assignments: Assignment[];
  quizzes: (Quiz & {
    questions: Array<{
      question: string;
      type: string;
      options?: any;
      correctAnswer?: string;
      points: number;
    }>;
  })[];
  discussions: (Discussion & {
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  })[];
}

export interface PublishResult {
  success: boolean;
  externalCourseId?: string;
  message: string;
  errors?: string[];
}

export abstract class BaseLMSAdapter {
  protected config: LMSConfig;

  constructor(config: LMSConfig) {
    this.config = config;
  }

  abstract validateConfig(): Promise<boolean>;
  abstract publishCourse(courseData: LMSCourseData, externalCourseId?: string): Promise<PublishResult>;
  abstract updateCourse(courseData: LMSCourseData, externalCourseId: string): Promise<PublishResult>;
  abstract deleteCourse(externalCourseId: string): Promise<PublishResult>;

  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...this.getAuthHeaders(),
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error response, use the status text
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the LMS API. Please check the API URL and your internet connection.');
      }
      throw error;
    }
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  protected formatContentForLMS(content: string): string {
    // Basic HTML sanitization and formatting
    // This can be extended based on specific LMS requirements
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes for security
      .replace(/style\s*=\s*"[^"]*"/gi, ''); // Remove inline styles
  }

  protected generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
