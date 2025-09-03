export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'instructional-designer';
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
  instructorId: number;
  updatedAt: string;
  instructor?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export interface NewCourse {
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AICourseData {
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
    discussions?: Array<{
      title: string;
      prompt?: string;
    }>;
    quizzes?: Array<{
      title: string;
      description: string;
      timeLimit?: number;
      questions: Array<{
        question: string;
        type: string;
        options: string[];
        correctAnswer: string;
        points: number;
      }>;
    }>;
  }>;
}
