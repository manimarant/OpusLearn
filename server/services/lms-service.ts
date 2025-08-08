import { BaseLMSAdapter, LMSConfig, LMSCourseData, PublishResult } from './lms-adapters/base-adapter';
import { MoodleAdapter } from './lms-adapters/moodle-adapter';
import { CanvasAdapter } from './lms-adapters/canvas-adapter';
import { BlackboardAdapter } from './lms-adapters/blackboard-adapter';

export type LMSPlatform = 'moodle' | 'canvas' | 'blackboard';

export interface LMSPublishRequest {
  platform: LMSPlatform;
  apiUrl: string;
  apiKey: string;
  externalCourseId?: string;
}

export class LMSService {
  private adapters: Map<LMSPlatform, typeof BaseLMSAdapter> = new Map();

  constructor() {
    this.adapters.set('moodle', MoodleAdapter);
    this.adapters.set('canvas', CanvasAdapter);
    this.adapters.set('blackboard', BlackboardAdapter);
  }

  private createAdapter(platform: LMSPlatform, config: LMSConfig): BaseLMSAdapter {
    const AdapterClass = this.adapters.get(platform);
    if (!AdapterClass) {
      throw new Error(`Unsupported LMS platform: ${platform}`);
    }
    return new AdapterClass(config);
  }

  async validateConnection(platform: LMSPlatform, config: LMSConfig): Promise<boolean> {
    try {
      const adapter = this.createAdapter(platform, config);
      return await adapter.validateConfig();
    } catch (error) {
      console.error(`Failed to validate ${platform} connection:`, error);
      return false;
    }
  }

  async publishCourse(
    courseData: LMSCourseData,
    publishRequest: LMSPublishRequest
  ): Promise<PublishResult> {
    try {
      // Validate input data
      const validationErrors = this.validatePublishRequest(courseData, publishRequest);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        };
      }

      const config: LMSConfig = {
        apiUrl: publishRequest.apiUrl.trim(),
        apiKey: publishRequest.apiKey.trim(),
      };

      const adapter = this.createAdapter(publishRequest.platform, config);

      // Validate connection first
      const isValid = await adapter.validateConfig();
      if (!isValid) {
        return {
          success: false,
          message: `Failed to connect to ${publishRequest.platform}. Please check your API credentials.`,
          errors: ['Invalid API configuration'],
        };
      }

      // Publish or update course
      if (publishRequest.externalCourseId) {
        return await adapter.updateCourse(courseData, publishRequest.externalCourseId.trim());
      } else {
        return await adapter.publishCourse(courseData);
      }
    } catch (error: any) {
      console.error('LMS publish error:', error);
      return {
        success: false,
        message: `Failed to publish course to ${publishRequest.platform}`,
        errors: [error.message],
      };
    }
  }

  private validatePublishRequest(courseData: LMSCourseData, publishRequest: LMSPublishRequest): string[] {
    const errors: string[] = [];

    // Validate course data
    if (!courseData.course) {
      errors.push('Course data is required');
    } else {
      if (!courseData.course.title?.trim()) {
        errors.push('Course title is required');
      }
      if (!courseData.course.instructorId?.trim()) {
        errors.push('Course instructor is required');
      }
    }

    // Validate publish request
    if (!publishRequest.platform?.trim()) {
      errors.push('LMS platform is required');
    } else if (!this.adapters.has(publishRequest.platform as LMSPlatform)) {
      errors.push(`Unsupported LMS platform: ${publishRequest.platform}`);
    }

    if (!publishRequest.apiUrl?.trim()) {
      errors.push('API URL is required');
    } else {
      try {
        new URL(publishRequest.apiUrl);
      } catch {
        errors.push('Invalid API URL format');
      }
    }

    if (!publishRequest.apiKey?.trim()) {
      errors.push('API key is required');
    }

    return errors;
  }

  async updateCourse(
    courseData: LMSCourseData,
    publishRequest: LMSPublishRequest & { externalCourseId: string }
  ): Promise<PublishResult> {
    return this.publishCourse(courseData, publishRequest);
  }

  async deleteCourse(
    platform: LMSPlatform,
    config: LMSConfig,
    externalCourseId: string
  ): Promise<PublishResult> {
    try {
      const adapter = this.createAdapter(platform, config);
      return await adapter.deleteCourse(externalCourseId);
    } catch (error: any) {
      console.error('LMS delete error:', error);
      return {
        success: false,
        message: `Failed to delete course from ${platform}`,
        errors: [error.message],
      };
    }
  }

  getSupportedPlatforms(): LMSPlatform[] {
    return Array.from(this.adapters.keys());
  }

  getPlatformInfo(platform: LMSPlatform): any {
    const platformInfo = {
      moodle: {
        name: 'Moodle',
        description: 'Open-source learning management system',
        apiDocUrl: 'https://docs.moodle.org/dev/Web_services',
        requiredFields: ['API URL', 'Web Service Token'],
        example: {
          apiUrl: 'https://your-moodle-site.com',
          apiKey: 'your-webservice-token',
        },
      },
      canvas: {
        name: 'Canvas LMS',
        description: 'Instructure Canvas learning management system',
        apiDocUrl: 'https://canvas.instructure.com/doc/api/',
        requiredFields: ['API URL', 'Access Token'],
        example: {
          apiUrl: 'https://your-canvas-instance.instructure.com',
          apiKey: 'your-access-token',
        },
      },
      blackboard: {
        name: 'Blackboard Learn',
        description: 'Blackboard Learn learning management system',
        apiDocUrl: 'https://developer.blackboard.com/portal/displayApi',
        requiredFields: ['API URL', 'Application Key'],
        example: {
          apiUrl: 'https://your-blackboard-instance.com',
          apiKey: 'your-application-key',
        },
      },
    };

    return platformInfo[platform] || null;
  }
}

// Singleton instance
export const lmsService = new LMSService();
