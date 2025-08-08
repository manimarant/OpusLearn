import { BaseLMSAdapter, LMSConfig, LMSCourseData, PublishResult } from './base-adapter';

export class BlackboardAdapter extends BaseLMSAdapter {
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
      // Test connection by fetching API version
      await this.makeRequest('/learn/api/public/v1/system/version');
      return true;
    } catch (error) {
      console.error('Blackboard config validation failed:', error);
      return false;
    }
  }

  async publishCourse(courseData: LMSCourseData, externalCourseId?: string): Promise<PublishResult> {
    try {
      let blackboardCourseId = externalCourseId;

      // Create or update course
      if (!blackboardCourseId) {
        blackboardCourseId = await this.createCourse(courseData);
      } else {
        await this.updateCourseInfo(courseData, blackboardCourseId);
      }

      // Create course content
      await this.createCourseContent(courseData, blackboardCourseId);

      return {
        success: true,
        externalCourseId: blackboardCourseId,
        message: 'Course published successfully to Blackboard',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish course to Blackboard',
        errors: [error.message],
      };
    }
  }

  async updateCourse(courseData: LMSCourseData, externalCourseId: string): Promise<PublishResult> {
    return this.publishCourse(courseData, externalCourseId);
  }

  async deleteCourse(externalCourseId: string): Promise<PublishResult> {
    try {
      await this.makeRequest(`/learn/api/public/v1/courses/${externalCourseId}`, 'DELETE');

      return {
        success: true,
        message: 'Course deleted successfully from Blackboard',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to delete course from Blackboard',
        errors: [error.message],
      };
    }
  }

  private async createCourse(courseData: LMSCourseData): Promise<string> {
    const coursePayload = {
      courseId: this.generateCourseId(courseData.course.title),
      name: courseData.course.title,
      description: courseData.course.description || '',
      allowGuests: false,
      readOnly: false,
      termId: 'DEFAULT_TERM', // This would need to be configured per institution
      availability: {
        available: 'Yes',
        duration: {
          type: 'Continuous'
        }
      }
    };

    const response = await this.makeRequest('/learn/api/public/v1/courses', 'POST', coursePayload);
    
    if (response && response.id) {
      return response.id;
    }
    throw new Error('Failed to create course in Blackboard');
  }

  private async updateCourseInfo(courseData: LMSCourseData, courseId: string): Promise<void> {
    const updateData = {
      name: courseData.course.title,
      description: courseData.course.description || '',
    };

    await this.makeRequest(`/learn/api/public/v1/courses/${courseId}`, 'PATCH', updateData);
  }

  private async createCourseContent(courseData: LMSCourseData, courseId: string): Promise<void> {
    // Create content areas for modules
    for (const module of courseData.modules) {
      const contentAreaId = await this.createContentArea(courseId, module);
      
      // Add chapters as content items
      for (const chapter of module.chapters) {
        await this.createContentItem(courseId, contentAreaId, chapter);
      }
    }

    // Create assignments
    for (const assignment of courseData.assignments) {
      await this.createAssignment(courseId, assignment);
    }

    // Create tests (quizzes)
    for (const quiz of courseData.quizzes) {
      await this.createTest(courseId, quiz);
    }

    // Create discussion boards
    for (const discussion of courseData.discussions) {
      await this.createDiscussionBoard(courseId, discussion);
    }
  }

  private async createContentArea(courseId: string, module: any): Promise<string> {
    const contentAreaData = {
      title: module.title,
      description: module.description || '',
      position: 1,
      availability: {
        available: 'Yes'
      }
    };

    const response = await this.makeRequest(`/learn/api/public/v1/courses/${courseId}/contents`, 'POST', contentAreaData);
    return response.id;
  }

  private async createContentItem(courseId: string, parentId: string, chapter: any): Promise<void> {
    try {
      const contentData = {
        title: chapter.title,
        body: this.formatContentForLMS(chapter.content || ''),
        contentHandler: {
          id: 'resource/x-bb-document'
        },
        availability: {
          available: 'Yes'
        }
      };

      await this.makeRequest(`/learn/api/public/v1/courses/${courseId}/contents/${parentId}/children`, 'POST', contentData);
    } catch (error) {
      console.warn(`Failed to create content item: ${chapter.title}`, error);
    }
  }

  private async createAssignment(courseId: string, assignment: any): Promise<void> {
    try {
      const assignmentData = {
        name: assignment.title,
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString() : null,
        score: {
          possible: assignment.maxPoints || 100
        },
        availability: {
          available: 'Yes'
        }
      };

      await this.makeRequest(`/learn/api/public/v1/courses/${courseId}/gradebook/columns`, 'POST', assignmentData);
    } catch (error) {
      console.warn(`Failed to create assignment: ${assignment.title}`, error);
    }
  }

  private async createTest(courseId: string, quiz: any): Promise<void> {
    try {
      const testData = {
        name: quiz.title,
        description: quiz.description || '',
        instructions: 'Please complete this assessment.',
        dueDate: null,
        score: {
          possible: this.calculateQuizPoints(quiz.questions)
        },
        availability: {
          available: 'Yes'
        },
        multipleAttempts: quiz.attempts !== 1,
        limitedTime: quiz.timeLimit ? true : false,
        timedAssessment: {
          limit: quiz.timeLimit || 0
        }
      };

      const testResponse = await this.makeRequest(`/learn/api/public/v1/courses/${courseId}/gradebook/columns`, 'POST', testData);

      // Note: Blackboard API for creating test questions is more complex
      // This would require additional API calls to create the actual test questions
      // For now, we'll create the test container
    } catch (error) {
      console.warn(`Failed to create test: ${quiz.title}`, error);
    }
  }

  private async createDiscussionBoard(courseId: string, discussion: any): Promise<void> {
    try {
      const discussionData = {
        title: discussion.title,
        description: discussion.content || '',
        availability: {
          available: 'Yes'
        }
      };

      await this.makeRequest(`/learn/api/public/v1/courses/${courseId}/discussions`, 'POST', discussionData);
    } catch (error) {
      console.warn(`Failed to create discussion board: ${discussion.title}`, error);
    }
  }

  private generateCourseId(title: string): string {
    return title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 15) + '_' + this.generateUniqueId().substring(0, 8);
  }

  private calculateQuizPoints(questions: any[]): number {
    return questions?.reduce((total, question) => total + (question.points || 1), 0) || 100;
  }
}
