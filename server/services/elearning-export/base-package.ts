import { Course, CourseModule, Chapter, Assignment, Quiz, Discussion } from "@shared/schema";
import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';

export interface ExportCourseData {
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

export interface PackageOptions {
  title?: string;
  version?: string;
  organization?: string;
  includeTracking?: boolean;
  language?: string;
}

export interface PackageResult {
  success: boolean;
  packagePath?: string;
  filename?: string;
  size?: number;
  message?: string;
  errors?: string[];
}

export abstract class BasePackageExporter {
  protected tempDir: string;
  protected packageDir: string;
  
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'exports');
    this.packageDir = '';
  }

  abstract createPackage(courseData: ExportCourseData, options: PackageOptions): Promise<PackageResult>;
  
  protected async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      this.packageDir = path.join(this.tempDir, `package_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await fs.mkdir(this.packageDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directories: ${error}`);
    }
  }

  protected async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.packageDir, filePath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  protected async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const fullDestPath = path.join(this.packageDir, destPath);
    const dir = path.dirname(fullDestPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.copyFile(sourcePath, fullDestPath);
  }

  protected async createZipPackage(filename: string): Promise<string> {
    const zip = new AdmZip();
    
    async function addDirectory(dirPath: string, zipPath: string = '') {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const zipEntryPath = zipPath ? path.join(zipPath, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          await addDirectory(fullPath, zipEntryPath);
        } else {
          const content = await fs.readFile(fullPath);
          zip.addFile(zipEntryPath, content);
        }
      }
    }
    
    await addDirectory(this.packageDir);
    
    const outputPath = path.join(this.tempDir, filename);
    zip.writeZip(outputPath);
    
    return outputPath;
  }

  protected async cleanup(): Promise<void> {
    try {
      if (this.packageDir) {
        await fs.rm(this.packageDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary directory:', error);
    }
  }

  protected sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  protected formatContent(content: string): string {
    // Basic HTML sanitization and formatting for e-learning packages
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
      .replace(/style\s*=\s*"[^"]*"/gi, '') // Remove inline styles
      .replace(/class\s*=\s*"[^"]*"/gi, ''); // Remove classes that might not exist
  }

  protected generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  protected async getPackageSize(packagePath: string): Promise<number> {
    try {
      const stats = await fs.stat(packagePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}
