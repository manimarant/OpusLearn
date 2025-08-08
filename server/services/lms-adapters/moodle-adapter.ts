import { BaseLMSAdapter, LMSConfig, LMSCourseData, PublishResult } from './base-adapter';

export class MoodleAdapter extends BaseLMSAdapter {
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
      // Test connection by fetching site info
      await this.makeRequest('/webservice/rest/server.php', 'GET', null, {
        'wstoken': this.config.apiKey,
        'wsfunction': 'core_webservice_get_site_info',
        'moodlewsrestformat': 'json',
      });
      return true;
    } catch (error) {
      console.error('Moodle config validation failed:', error);
      return false;
    }
  }

  async publishCourse(courseData: LMSCourseData, externalCourseId?: string): Promise<PublishResult> {
    try {
      let moodleCourseId = externalCourseId;

      // Create or update course
      if (!moodleCourseId) {
        moodleCourseId = await this.createCourse(courseData);
      } else {
        await this.updateCourseInfo(courseData, moodleCourseId);
      }

      // Create course content
      await this.createCourseContent(courseData, moodleCourseId);

      return {
        success: true,
        externalCourseId: moodleCourseId,
        message: 'Course published successfully to Moodle',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish course to Moodle',
        errors: [error.message],
      };
    }
  }

  async updateCourse(courseData: LMSCourseData, externalCourseId: string): Promise<PublishResult> {
    return this.publishCourse(courseData, externalCourseId);
  }

  async deleteCourse(externalCourseId: string): Promise<PublishResult> {
    try {
      await this.makeRequest('/webservice/rest/server.php', 'POST', {
        wstoken: this.config.apiKey,
        wsfunction: 'core_course_delete_courses',
        moodlewsrestformat: 'json',
        courseids: [parseInt(externalCourseId)],
      });

      return {
        success: true,
        message: 'Course deleted successfully from Moodle',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to delete course from Moodle',
        errors: [error.message],
      };
    }
  }

  private async createCourse(courseData: LMSCourseData): Promise<string> {
    const response = await this.makeRequest('/webservice/rest/server.php', 'POST', {
      wstoken: this.config.apiKey,
      wsfunction: 'core_course_create_courses',
      moodlewsrestformat: 'json',
      courses: [{
        fullname: courseData.course.title,
        shortname: this.generateCourseShortName(courseData.course.title),
        summary: courseData.course.description || '',
        categoryid: 1, // Default category
        visible: 1,
        format: 'topics',
      }],
    });

    if (response && response[0] && response[0].id) {
      return response[0].id.toString();
    }
    throw new Error('Failed to create course in Moodle');
  }

  private async updateCourseInfo(courseData: LMSCourseData, courseId: string): Promise<void> {
    await this.makeRequest('/webservice/rest/server.php', 'POST', {
      wstoken: this.config.apiKey,
      wsfunction: 'core_course_update_courses',
      moodlewsrestformat: 'json',
      courses: [{
        id: parseInt(courseId),
        fullname: courseData.course.title,
        summary: courseData.course.description || '',
      }],
    });
  }

  private async createCourseContent(courseData: LMSCourseData, courseId: string): Promise<void> {
    // Create course sections for modules
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      
      // Create section for module
      const sectionResponse = await this.makeRequest('/webservice/rest/server.php', 'POST', {
        wstoken: this.config.apiKey,
        wsfunction: 'core_course_edit_section',
        moodlewsrestformat: 'json',
        action: 'create',
        courseid: parseInt(courseId),
        section: i + 1,
        sectionname: module.title,
        summary: module.description || '',
      });

      // Add chapters as resources/activities
      for (const chapter of module.chapters) {
        await this.createChapterResource(courseId, i + 1, chapter);
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

    // Create discussion forums
    for (const discussion of courseData.discussions) {
      await this.createDiscussion(courseId, discussion);
    }
  }

  private async createChapterResource(courseId: string, sectionId: number, chapter: any): Promise<void> {
    try {
      await this.makeRequest('/webservice/rest/server.php', 'POST', {
        wstoken: this.config.apiKey,
        wsfunction: 'mod_page_add_page',
        moodlewsrestformat: 'json',
        courseid: parseInt(courseId),
        section: sectionId,
        name: chapter.title,
        content: this.formatContentForLMS(chapter.content || ''),
        visible: 1,
      });
    } catch (error) {
      console.warn(`Failed to create chapter resource: ${chapter.title}`, error);
    }
  }

  private async createAssignment(courseId: string, assignment: any): Promise<void> {
    try {
      await this.makeRequest('/webservice/rest/server.php', 'POST', {
        wstoken: this.config.apiKey,
        wsfunction: 'mod_assign_add_assignment',
        moodlewsrestformat: 'json',
        courseid: parseInt(courseId),
        name: assignment.title,
        intro: assignment.description || '',
        introformat: 1,
        duedate: assignment.dueDate ? new Date(assignment.dueDate).getTime() / 1000 : 0,
        grade: assignment.maxPoints || 100,
      });
    } catch (error) {
      console.warn(`Failed to create assignment: ${assignment.title}`, error);
    }
  }

  private async createQuiz(courseId: string, quiz: any): Promise<void> {
    try {
      const quizResponse = await this.makeRequest('/webservice/rest/server.php', 'POST', {
        wstoken: this.config.apiKey,
        wsfunction: 'mod_quiz_add_quiz',
        moodlewsrestformat: 'json',
        courseid: parseInt(courseId),
        name: quiz.title,
        intro: quiz.description || '',
        timeopen: 0,
        timeclose: 0,
        timelimit: quiz.timeLimit ? quiz.timeLimit * 60 : 0, // Convert minutes to seconds
        attempts: quiz.attempts || 0,
        gradepass: quiz.passingScore || 70,
      });

      // Add questions to quiz
      if (quizResponse && quiz.questions) {
        await this.createQuizQuestions(quizResponse.id, quiz.questions);
      }
    } catch (error) {
      console.warn(`Failed to create quiz: ${quiz.title}`, error);
    }
  }

  private async createQuizQuestions(quizId: string, questions: any[]): Promise<void> {
    for (const question of questions) {
      try {
        await this.makeRequest('/webservice/rest/server.php', 'POST', {
          wstoken: this.config.apiKey,
          wsfunction: 'mod_quiz_add_question',
          moodlewsrestformat: 'json',
          quizid: parseInt(quizId),
          questiontext: question.question,
          qtype: this.convertQuestionType(question.type),
          answers: question.options || [],
          correctanswer: question.correctAnswer,
          defaultmark: question.points || 1,
        });
      } catch (error) {
        console.warn(`Failed to create quiz question: ${question.question}`, error);
      }
    }
  }

  private async createDiscussion(courseId: string, discussion: any): Promise<void> {
    try {
      await this.makeRequest('/webservice/rest/server.php', 'POST', {
        wstoken: this.config.apiKey,
        wsfunction: 'mod_forum_add_forum',
        moodlewsrestformat: 'json',
        courseid: parseInt(courseId),
        name: discussion.title,
        intro: discussion.content || '',
        type: 'general',
      });
    } catch (error) {
      console.warn(`Failed to create discussion: ${discussion.title}`, error);
    }
  }

  private generateCourseShortName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + '_' + this.generateUniqueId().substring(0, 8);
  }

  private convertQuestionType(type: string): string {
    switch (type.toLowerCase()) {
      case 'multiple_choice':
        return 'multichoice';
      case 'true_false':
        return 'truefalse';
      case 'short_answer':
        return 'shortanswer';
      default:
        return 'multichoice';
    }
  }
}
