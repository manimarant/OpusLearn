import { BaseLMSAdapter, LMSConfig, LMSCourseData, PublishResult } from './base-adapter';

export class CanvasAdapter extends BaseLMSAdapter {
  constructor(config: LMSConfig) {
    super(config);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test connection by fetching user profile
      await this.makeRequest('/api/v1/users/self');
      return true;
    } catch (error) {
      console.error('Canvas config validation failed:', error);
      return false;
    }
  }

  async publishCourse(courseData: LMSCourseData, externalCourseId?: string): Promise<PublishResult> {
    try {
      let canvasCourseId = externalCourseId;

      // Create or update course
      if (!canvasCourseId) {
        canvasCourseId = await this.createCourse(courseData);
      } else {
        await this.updateCourseInfo(courseData, canvasCourseId);
      }

      // Create course content
      await this.createCourseContent(courseData, canvasCourseId);

      return {
        success: true,
        externalCourseId: canvasCourseId,
        message: 'Course published successfully to Canvas',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish course to Canvas',
        errors: [error.message],
      };
    }
  }

  async updateCourse(courseData: LMSCourseData, externalCourseId: string): Promise<PublishResult> {
    return this.publishCourse(courseData, externalCourseId);
  }

  async deleteCourse(externalCourseId: string): Promise<PublishResult> {
    try {
      await this.makeRequest(`/api/v1/courses/${externalCourseId}`, 'DELETE');

      return {
        success: true,
        message: 'Course deleted successfully from Canvas',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to delete course from Canvas',
        errors: [error.message],
      };
    }
  }

  private async createCourse(courseData: LMSCourseData): Promise<string> {
    const courseData_canvas = {
      course: {
        name: courseData.course.title,
        course_code: this.generateCourseCode(courseData.course.title),
        description: courseData.course.description || '',
        is_public: false,
        workflow_state: 'unpublished',
      },
    };

    const response = await this.makeRequest('/api/v1/accounts/self/courses', 'POST', courseData_canvas);
    
    if (response && response.id) {
      return response.id.toString();
    }
    throw new Error('Failed to create course in Canvas');
  }

  private async updateCourseInfo(courseData: LMSCourseData, courseId: string): Promise<void> {
    const updateData = {
      course: {
        name: courseData.course.title,
        description: courseData.course.description || '',
      },
    };

    await this.makeRequest(`/api/v1/courses/${courseId}`, 'PUT', updateData);
  }

  private async createCourseContent(courseData: LMSCourseData, courseId: string): Promise<void> {
    // Create modules for course organization
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      
      const moduleResponse = await this.createModule(courseId, module, i + 1);
      const moduleId = moduleResponse.id;

      // Add chapters as pages within modules
      for (const chapter of module.chapters) {
        await this.createChapterPage(courseId, moduleId, chapter);
      }
    }

    // Create assignments
    for (const assignment of courseData.assignments) {
      await this.createAssignment(courseId, assignment);
    }

    // Create quizzes
    for (const quiz of courseData.quizzes) {
      await this.createQuiz(courseId, quiz);
    }

    // Create discussion topics
    for (const discussion of courseData.discussions) {
      await this.createDiscussion(courseId, discussion);
    }
  }

  private async createModule(courseId: string, module: any, position: number): Promise<any> {
    const moduleData = {
      module: {
        name: module.title,
        position: position,
        workflow_state: 'active',
      },
    };

    return await this.makeRequest(`/api/v1/courses/${courseId}/modules`, 'POST', moduleData);
  }

  private async createChapterPage(courseId: string, moduleId: string, chapter: any): Promise<void> {
    try {
      // Create page
      const pageData = {
        wiki_page: {
          title: chapter.title,
          body: this.formatContentForLMS(chapter.content || ''),
          published: true,
        },
      };

      const pageResponse = await this.makeRequest(`/api/v1/courses/${courseId}/pages`, 'POST', pageData);

      // Add page to module
      if (pageResponse && pageResponse.url) {
        const moduleItemData = {
          module_item: {
            title: chapter.title,
            type: 'Page',
            page_url: pageResponse.url,
          },
        };

        await this.makeRequest(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, 'POST', moduleItemData);
      }
    } catch (error) {
      console.warn(`Failed to create chapter page: ${chapter.title}`, error);
    }
  }

  private async createAssignment(courseId: string, assignment: any): Promise<void> {
    try {
      const assignmentData = {
        assignment: {
          name: assignment.title,
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          due_at: assignment.dueDate ? new Date(assignment.dueDate).toISOString() : null,
          points_possible: assignment.maxPoints || 100,
          submission_types: ['online_text_entry', 'online_upload'],
          published: true,
        },
      };

      await this.makeRequest(`/api/v1/courses/${courseId}/assignments`, 'POST', assignmentData);
    } catch (error) {
      console.warn(`Failed to create assignment: ${assignment.title}`, error);
    }
  }

  private async createQuiz(courseId: string, quiz: any): Promise<void> {
    try {
      const quizData = {
        quiz: {
          title: quiz.title,
          description: quiz.description || '',
          time_limit: quiz.timeLimit || null,
          allowed_attempts: quiz.attempts || -1, // -1 for unlimited
          scoring_policy: 'keep_highest',
          published: true,
        },
      };

      const quizResponse = await this.makeRequest(`/api/v1/courses/${courseId}/quizzes`, 'POST', quizData);

      // Add questions to quiz
      if (quizResponse && quiz.questions) {
        await this.createQuizQuestions(courseId, quizResponse.id, quiz.questions);
      }
    } catch (error) {
      console.warn(`Failed to create quiz: ${quiz.title}`, error);
    }
  }

  private async createQuizQuestions(courseId: string, quizId: string, questions: any[]): Promise<void> {
    for (const question of questions) {
      try {
        const questionData = {
          question: {
            question_name: question.question.substring(0, 50) + '...',
            question_text: question.question,
            question_type: this.convertQuestionType(question.type),
            points_possible: question.points || 1,
            answers: this.formatAnswers(question),
          },
        };

        await this.makeRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, 'POST', questionData);
      } catch (error) {
        console.warn(`Failed to create quiz question: ${question.question}`, error);
      }
    }
  }

  private async createDiscussion(courseId: string, discussion: any): Promise<void> {
    try {
      const discussionData = {
        discussion_topic: {
          title: discussion.title,
          message: discussion.content || '',
          discussion_type: 'threaded',
          published: true,
        },
      };

      await this.makeRequest(`/api/v1/courses/${courseId}/discussion_topics`, 'POST', discussionData);
    } catch (error) {
      console.warn(`Failed to create discussion: ${discussion.title}`, error);
    }
  }

  private generateCourseCode(title: string): string {
    return title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) + '_' + this.generateUniqueId().substring(0, 6);
  }

  private convertQuestionType(type: string): string {
    switch (type.toLowerCase()) {
      case 'multiple_choice':
        return 'multiple_choice_question';
      case 'true_false':
        return 'true_false_question';
      case 'short_answer':
        return 'short_answer_question';
      default:
        return 'multiple_choice_question';
    }
  }

  private formatAnswers(question: any): any[] {
    if (!question.options) return [];

    return question.options.map((option: string, index: number) => ({
      answer_text: option,
      answer_weight: option === question.correctAnswer ? 100 : 0,
    }));
  }
}
