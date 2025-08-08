import { BasePackageExporter, ExportCourseData, PackageOptions, PackageResult } from './base-package';
import * as path from 'path';

export interface SCORMOptions extends PackageOptions {
  scormVersion?: '1.2' | '2004';
  masteryScore?: number;
  maxTimeAllowed?: string;
  timeLimitAction?: 'exit,message' | 'continue,no message' | 'exit,no message';
}

export class SCORMExporter extends BasePackageExporter {
  async createPackage(courseData: ExportCourseData, options: SCORMOptions): Promise<PackageResult> {
    try {
      await this.ensureDirectories();
      
      const scormVersion = options.scormVersion || '1.2';
      const packageId = this.generateUniqueId();
      
      // Create package structure
      await this.createManifest(courseData, options, packageId, scormVersion);
      await this.createLaunchFile(courseData, options);
      await this.createContentFiles(courseData, options);
      await this.createAssessmentFiles(courseData, options);
      
      // Package as ZIP
      const filename = `${this.sanitizeFilename(courseData.course.title)}_SCORM_${scormVersion}.zip`;
      const packagePath = await this.createZipPackage(filename);
      const size = await this.getPackageSize(packagePath);
      
      // Cleanup temporary files
      await this.cleanup();
      
      return {
        success: true,
        packagePath,
        filename,
        size,
        message: `SCORM ${scormVersion} package created successfully`,
      };
    } catch (error: any) {
      await this.cleanup();
      return {
        success: false,
        message: 'Failed to create SCORM package',
        errors: [error.message],
      };
    }
  }

  private async createManifest(
    courseData: ExportCourseData,
    options: SCORMOptions,
    packageId: string,
    scormVersion: string
  ): Promise<void> {
    const manifestContent = scormVersion === '1.2' 
      ? this.generateSCORM12Manifest(courseData, options, packageId)
      : this.generateSCORM2004Manifest(courseData, options, packageId);
    
    await this.writeFile('imsmanifest.xml', manifestContent);
  }

  private generateSCORM12Manifest(
    courseData: ExportCourseData,
    options: SCORMOptions,
    packageId: string
  ): string {
    const resources = courseData.modules.map((module, index) => {
      const moduleId = `module_${index + 1}`;
      return `
    <resource identifier="${moduleId}" type="webcontent" adlcp:scormtype="sco" href="content/${moduleId}/index.html">
      <file href="content/${moduleId}/index.html" />
      <file href="content/${moduleId}/style.css" />
      <dependency identifierref="common_files" />
    </resource>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${packageId}" version="1" 
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                     http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <adlcp:location>metadata.xml</adlcp:location>
  </metadata>

  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${this.escapeXml(courseData.course.title)}</title>
      ${courseData.modules.map((module, index) => `
      <item identifier="item_${index + 1}" identifierref="module_${index + 1}">
        <title>${this.escapeXml(module.title)}</title>
        <adlcp:masteryscore>${options.masteryScore || 80}</adlcp:masteryscore>
        <adlcp:maxtimeallowed>${options.maxTimeAllowed || 'PT2H'}</adlcp:maxtimeallowed>
        <adlcp:timelimitaction>${options.timeLimitAction || 'continue,no message'}</adlcp:timelimitaction>
        ${module.chapters.map((chapter, chapterIndex) => `
        <item identifier="item_${index + 1}_${chapterIndex + 1}">
          <title>${this.escapeXml(chapter.title)}</title>
        </item>`).join('')}
      </item>`).join('')}
    </organization>
  </organizations>

  <resources>
    <resource identifier="common_files" type="webcontent">
      <file href="shared/scorm_api.js" />
      <file href="shared/scorm_wrapper.js" />
      <file href="shared/common.css" />
    </resource>
    ${resources}
  </resources>
</manifest>`;
  }

  private generateSCORM2004Manifest(
    courseData: ExportCourseData,
    options: SCORMOptions,
    packageId: string
  ): string {
    const resources = courseData.modules.map((module, index) => {
      const moduleId = `module_${index + 1}`;
      return `
    <resource identifier="${moduleId}" type="webcontent" adlcp:scormType="sco" href="content/${moduleId}/index.html">
      <file href="content/${moduleId}/index.html" />
      <file href="content/${moduleId}/style.css" />
      <dependency identifierref="common_files" />
    </resource>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${packageId}" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                     http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                     http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                     http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                     http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 3rd Edition</schemaversion>
    <adlcp:location>metadata.xml</adlcp:location>
  </metadata>

  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${this.escapeXml(courseData.course.title)}</title>
      <imsss:sequencing>
        <imsss:controlMode choice="true" flow="true" />
      </imsss:sequencing>
      ${courseData.modules.map((module, index) => `
      <item identifier="item_${index + 1}" identifierref="module_${index + 1}">
        <title>${this.escapeXml(module.title)}</title>
        <imsss:sequencing>
          <imsss:controlMode choice="true" flow="true" />
        </imsss:sequencing>
      </item>`).join('')}
    </organization>
  </organizations>

  <resources>
    <resource identifier="common_files" type="webcontent">
      <file href="shared/scorm_api.js" />
      <file href="shared/scorm_wrapper.js" />
      <file href="shared/common.css" />
    </resource>
    ${resources}
  </resources>
</manifest>`;
  }

  private async createLaunchFile(courseData: ExportCourseData, options: SCORMOptions): Promise<void> {
    const launchContent = `<!DOCTYPE html>
<html lang="${options.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(courseData.course.title)}</title>
    <link rel="stylesheet" href="../shared/common.css">
    <link rel="stylesheet" href="style.css">
    <script src="../shared/scorm_api.js"></script>
    <script src="../shared/scorm_wrapper.js"></script>
</head>
<body>
    <div class="course-container">
        <header class="course-header">
            <h1>${this.escapeHtml(courseData.course.title)}</h1>
            <p class="course-description">${this.escapeHtml(courseData.course.description || '')}</p>
        </header>
        
        <nav class="course-navigation">
            <ul>
                ${courseData.modules.map((module, index) => `
                <li>
                    <a href="../module_${index + 1}/index.html">${this.escapeHtml(module.title)}</a>
                </li>`).join('')}
            </ul>
        </nav>
        
        <div class="course-info">
            <p><strong>Category:</strong> ${this.escapeHtml(courseData.course.category || 'General')}</p>
            <p><strong>Difficulty:</strong> ${this.escapeHtml(courseData.course.difficulty || 'Intermediate')}</p>
            <p><strong>Modules:</strong> ${courseData.modules.length}</p>
            <p><strong>Assignments:</strong> ${courseData.assignments.length}</p>
            <p><strong>Quizzes:</strong> ${courseData.quizzes.length}</p>
        </div>
    </div>
    
    <script>
        // Initialize SCORM communication
        window.onload = function() {
            scormWrapper.initialize();
            scormWrapper.setValue('cmi.core.lesson_status', 'incomplete');
            scormWrapper.setValue('cmi.core.entry', 'ab-initio');
            scormWrapper.commit();
        };
        
        window.onbeforeunload = function() {
            scormWrapper.setValue('cmi.core.lesson_status', 'completed');
            scormWrapper.commit();
            scormWrapper.terminate();
        };
    </script>
</body>
</html>`;

    await this.writeFile('content/index.html', launchContent);
  }

  private async createContentFiles(courseData: ExportCourseData, options: SCORMOptions): Promise<void> {
    // Create shared files
    await this.createSharedFiles();
    
    // Create module content files
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      const moduleId = `module_${i + 1}`;
      
      await this.createModuleContent(module, moduleId, i, courseData);
    }
  }

  private async createSharedFiles(): Promise<void> {
    // SCORM API wrapper
    const scormApiJs = `
// SCORM API Wrapper for ${new Date().getFullYear()}
var scormWrapper = {
    apiHandle: null,
    isInitialized: false,
    
    initialize: function() {
        this.apiHandle = this.getAPIHandle();
        if (this.apiHandle) {
            this.isInitialized = this.apiHandle.LMSInitialize('');
        }
        return this.isInitialized;
    },
    
    terminate: function() {
        if (this.apiHandle && this.isInitialized) {
            return this.apiHandle.LMSFinish('');
        }
        return false;
    },
    
    getValue: function(element) {
        if (this.apiHandle && this.isInitialized) {
            return this.apiHandle.LMSGetValue(element);
        }
        return '';
    },
    
    setValue: function(element, value) {
        if (this.apiHandle && this.isInitialized) {
            return this.apiHandle.LMSSetValue(element, value);
        }
        return false;
    },
    
    commit: function() {
        if (this.apiHandle && this.isInitialized) {
            return this.apiHandle.LMSCommit('');
        }
        return false;
    },
    
    getAPIHandle: function() {
        var theAPI = this.findAPI(window);
        if (!theAPI && window.parent && window.parent != window) {
            theAPI = this.findAPI(window.parent);
        }
        if (!theAPI && window.top && window.top.parent != window) {
            theAPI = this.findAPI(window.top);
        }
        return theAPI;
    },
    
    findAPI: function(win) {
        var findAttempts = 0;
        while ((!win.API) && (win.parent) && (win.parent != win) && (findAttempts <= 500)) {
            findAttempts++;
            win = win.parent;
        }
        return win.API;
    }
};`;

    await this.writeFile('shared/scorm_api.js', scormApiJs);

    // Common CSS
    const commonCss = `
/* SCORM Package Common Styles */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
    color: #333;
}

.course-container, .module-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.course-header, .module-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
}

h1 { color: #2c3e50; margin-bottom: 10px; }
h2 { color: #34495e; margin-top: 25px; }
h3 { color: #7f8c8d; }

.course-navigation ul {
    list-style: none;
    padding: 0;
}

.course-navigation li {
    margin: 10px 0;
    padding: 10px;
    background: #ecf0f1;
    border-radius: 5px;
}

.course-navigation a {
    text-decoration: none;
    color: #2980b9;
    font-weight: bold;
}

.course-navigation a:hover {
    color: #3498db;
}

.chapter-content {
    margin: 20px 0;
    padding: 15px;
    border-left: 4px solid #3498db;
    background: #f8f9fa;
}

.quiz-container {
    background: #fff3cd;
    padding: 20px;
    border-radius: 5px;
    margin: 20px 0;
}

.question {
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

.navigation-buttons {
    text-align: center;
    margin: 30px 0;
}

.btn {
    padding: 10px 20px;
    margin: 0 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.progress-indicator {
    width: 100%;
    height: 20px;
    background: #ecf0f1;
    border-radius: 10px;
    margin: 20px 0;
}

.progress-bar {
    height: 100%;
    background: #27ae60;
    border-radius: 10px;
    transition: width 0.3s ease;
}
`;

    await this.writeFile('shared/common.css', commonCss);
  }

  private async createModuleContent(
    module: any,
    moduleId: string,
    moduleIndex: number,
    courseData: ExportCourseData
  ): Promise<void> {
    const moduleContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(module.title)}</title>
    <link rel="stylesheet" href="../../shared/common.css">
    <link rel="stylesheet" href="style.css">
    <script src="../../shared/scorm_api.js"></script>
    <script src="../../shared/scorm_wrapper.js"></script>
</head>
<body>
    <div class="module-container">
        <header class="module-header">
            <h1>${this.escapeHtml(module.title)}</h1>
            <p>${this.escapeHtml(module.description || '')}</p>
        </header>
        
        <div class="module-content">
            ${module.chapters.map((chapter: any, index: number) => `
            <section class="chapter-content" id="chapter-${index + 1}">
                <h2>${this.escapeHtml(chapter.title)}</h2>
                <div class="chapter-body">
                    ${this.formatContent(chapter.content || '')}
                </div>
            </section>`).join('')}
        </div>
        
        <div class="navigation-buttons">
            ${moduleIndex > 0 ? `<button class="btn btn-secondary" onclick="navigateToModule(${moduleIndex - 1})">Previous Module</button>` : ''}
            ${moduleIndex < courseData.modules.length - 1 ? `<button class="btn btn-primary" onclick="navigateToModule(${moduleIndex + 1})">Next Module</button>` : ''}
        </div>
    </div>
    
    <script>
        window.onload = function() {
            scormWrapper.initialize();
            scormWrapper.setValue('cmi.core.lesson_location', '${moduleId}');
            scormWrapper.commit();
        };
        
        function navigateToModule(index) {
            scormWrapper.setValue('cmi.core.lesson_status', 'completed');
            scormWrapper.commit();
            window.location.href = '../module_' + (index + 1) + '/index.html';
        }
        
        window.onbeforeunload = function() {
            scormWrapper.setValue('cmi.core.lesson_status', 'completed');
            scormWrapper.commit();
        };
    </script>
</body>
</html>`;

    await this.writeFile(`content/${moduleId}/index.html`, moduleContent);

    // Module-specific CSS
    const moduleCSS = `
.module-container {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.chapter-content {
    margin-bottom: 30px;
}

.chapter-body img {
    max-width: 100%;
    height: auto;
    border-radius: 5px;
    margin: 10px 0;
}

.chapter-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
}

.chapter-body th,
.chapter-body td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.chapter-body th {
    background-color: #f2f2f2;
    font-weight: bold;
}
`;

    await this.writeFile(`content/${moduleId}/style.css`, moduleCSS);
  }

  private async createAssessmentFiles(courseData: ExportCourseData, options: SCORMOptions): Promise<void> {
    // Create assessment content for quizzes
    for (const quiz of courseData.quizzes) {
      await this.createQuizContent(quiz);
    }
  }

  private async createQuizContent(quiz: any): Promise<void> {
    // This would create interactive quiz content
    // For now, we'll create a simple HTML-based quiz
    const quizContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(quiz.title)}</title>
    <link rel="stylesheet" href="../../shared/common.css">
    <script src="../../shared/scorm_api.js"></script>
    <script src="../../shared/scorm_wrapper.js"></script>
</head>
<body>
    <div class="quiz-container">
        <h1>${this.escapeHtml(quiz.title)}</h1>
        <p>${this.escapeHtml(quiz.description || '')}</p>
        
        <div id="quiz-questions">
            ${quiz.questions?.map((question: any, index: number) => `
            <div class="question" data-question="${index}">
                <h3>Question ${index + 1}</h3>
                <p>${this.escapeHtml(question.question)}</p>
                ${this.generateQuestionOptions(question, index)}
            </div>`).join('') || ''}
        </div>
        
        <button class="btn btn-primary" onclick="submitQuiz()">Submit Quiz</button>
    </div>
    
    <script>
        // Quiz functionality would be implemented here
        function submitQuiz() {
            // Calculate score and report to SCORM
            scormWrapper.setValue('cmi.core.score.raw', '85');
            scormWrapper.setValue('cmi.core.lesson_status', 'completed');
            scormWrapper.commit();
            alert('Quiz submitted successfully!');
        }
    </script>
</body>
</html>`;

    await this.writeFile(`assessments/quiz_${quiz.id}/index.html`, quizContent);
  }

  private generateQuestionOptions(question: any, questionIndex: number): string {
    if (question.type === 'multiple_choice' && question.options) {
      return question.options.map((option: string, optionIndex: number) => `
        <label>
          <input type="radio" name="question_${questionIndex}" value="${optionIndex}">
          ${this.escapeHtml(option)}
        </label><br>`).join('');
    } else if (question.type === 'true_false') {
      return `
        <label><input type="radio" name="question_${questionIndex}" value="true"> True</label><br>
        <label><input type="radio" name="question_${questionIndex}" value="false"> False</label><br>`;
    } else {
      return `<input type="text" name="question_${questionIndex}" placeholder="Enter your answer">`;
    }
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
