import { ExportCourseData, PackageOptions, PackageResult } from './base-package';
import { SCORMExporter, SCORMOptions } from './scorm-exporter';
import { xAPIExporter, xAPIOptions } from './xapi-exporter';

export type ExportFormat = 'scorm12' | 'scorm2004' | 'xapi';

export interface ExportRequest {
  format: ExportFormat;
  options: PackageOptions & SCORMOptions & xAPIOptions;
}

export class ELearningExportService {
  private scormExporter: SCORMExporter;
  private xapiExporter: xAPIExporter;

  constructor() {
    this.scormExporter = new SCORMExporter();
    this.xapiExporter = new xAPIExporter();
  }

  async exportCourse(courseData: ExportCourseData, request: ExportRequest): Promise<PackageResult> {
    try {
      // Validate course data
      const validationErrors = this.validateCourseData(courseData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Course data validation failed',
          errors: validationErrors,
        };
      }

      // Validate export request
      const requestErrors = this.validateExportRequest(request);
      if (requestErrors.length > 0) {
        return {
          success: false,
          message: 'Export request validation failed',
          errors: requestErrors,
        };
      }

      // Export based on format
      switch (request.format) {
        case 'scorm12':
          return await this.scormExporter.createPackage(courseData, {
            ...request.options,
            scormVersion: '1.2',
          });

        case 'scorm2004':
          return await this.scormExporter.createPackage(courseData, {
            ...request.options,
            scormVersion: '2004',
          });

        case 'xapi':
          return await this.xapiExporter.createPackage(courseData, request.options);

        default:
          return {
            success: false,
            message: `Unsupported export format: ${request.format}`,
            errors: ['Invalid export format'],
          };
      }
    } catch (error: any) {
      console.error('Export service error:', error);
      return {
        success: false,
        message: 'Failed to export course',
        errors: [error.message],
      };
    }
  }

  private validateCourseData(courseData: ExportCourseData): string[] {
    const errors: string[] = [];

    // Validate course
    if (!courseData.course) {
      errors.push('Course data is required');
      return errors;
    }

    if (!courseData.course.title?.trim()) {
      errors.push('Course title is required');
    }

    if (!courseData.course.instructorId?.trim()) {
      errors.push('Course instructor is required');
    }

    // Validate modules and chapters
    if (!courseData.modules || courseData.modules.length === 0) {
      errors.push('At least one module is required');
    } else {
      courseData.modules.forEach((module, index) => {
        if (!module.title?.trim()) {
          errors.push(`Module ${index + 1} title is required`);
        }

        if (!module.chapters || module.chapters.length === 0) {
          errors.push(`Module ${index + 1} must have at least one chapter`);
        } else {
          module.chapters.forEach((chapter, chapterIndex) => {
            if (!chapter.title?.trim()) {
              errors.push(`Module ${index + 1}, Chapter ${chapterIndex + 1} title is required`);
            }
          });
        }
      });
    }

    // Validate quizzes if present
    if (courseData.quizzes && courseData.quizzes.length > 0) {
      courseData.quizzes.forEach((quiz, index) => {
        if (!quiz.title?.trim()) {
          errors.push(`Quiz ${index + 1} title is required`);
        }

        if (quiz.questions && quiz.questions.length > 0) {
          quiz.questions.forEach((question, questionIndex) => {
            if (!question.question?.trim()) {
              errors.push(`Quiz ${index + 1}, Question ${questionIndex + 1} text is required`);
            }
          });
        }
      });
    }

    return errors;
  }

  private validateExportRequest(request: ExportRequest): string[] {
    const errors: string[] = [];

    if (!request.format) {
      errors.push('Export format is required');
    } else if (!['scorm12', 'scorm2004', 'xapi'].includes(request.format)) {
      errors.push('Invalid export format. Must be scorm12, scorm2004, or xapi');
    }

    // Validate SCORM-specific options
    if (request.format.startsWith('scorm')) {
      if (request.options.masteryScore && (request.options.masteryScore < 0 || request.options.masteryScore > 100)) {
        errors.push('Mastery score must be between 0 and 100');
      }
    }

    // Validate xAPI-specific options
    if (request.format === 'xapi') {
      if (request.options.activityId && !this.isValidUrl(request.options.activityId)) {
        errors.push('Activity ID must be a valid URL');
      }

      if (request.options.endpoint && !this.isValidUrl(request.options.endpoint)) {
        errors.push('xAPI endpoint must be a valid URL');
      }
    }

    return errors;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getSupportedFormats(): Array<{
    id: ExportFormat;
    name: string;
    description: string;
    features: string[];
  }> {
    return [
      {
        id: 'scorm12',
        name: 'SCORM 1.2',
        description: 'Industry standard for e-learning content packages',
        features: [
          'Compatible with most LMS platforms',
          'Basic tracking and scoring',
          'Offline capable',
          'Wide support',
        ],
      },
      {
        id: 'scorm2004',
        name: 'SCORM 2004',
        description: 'Enhanced SCORM standard with advanced sequencing',
        features: [
          'Advanced navigation control',
          'Better content organization',
          'Enhanced tracking',
          'Modern standard',
        ],
      },
      {
        id: 'xapi',
        name: 'xAPI (Tin Can API)',
        description: 'Modern standard for tracking detailed learning analytics',
        features: [
          'Rich interaction tracking',
          'Detailed analytics',
          'Mobile learning support',
          'Offline synchronization',
        ],
      },
    ];
  }

  getFormatInfo(format: ExportFormat): any {
    const formats = this.getSupportedFormats();
    return formats.find(f => f.id === format) || null;
  }
}

// Singleton instance
export const exportService = new ELearningExportService();
