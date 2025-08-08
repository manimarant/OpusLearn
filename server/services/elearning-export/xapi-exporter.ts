import { BasePackageExporter, ExportCourseData, PackageOptions, PackageResult } from './base-package';

export interface xAPIOptions extends PackageOptions {
  endpoint?: string;
  authToken?: string;
  activityId?: string;
  actor?: {
    name: string;
    email: string;
  };
}

export class xAPIExporter extends BasePackageExporter {
  async createPackage(courseData: ExportCourseData, options: xAPIOptions): Promise<PackageResult> {
    try {
      await this.ensureDirectories();
      
      const packageId = this.generateUniqueId();
      const activityId = options.activityId || `http://course.example.com/${packageId}`;
      
      // Create package structure
      await this.createTinCanXml(courseData, options, activityId);
      await this.createLaunchFile(courseData, options, activityId);
      await this.createContentFiles(courseData, options);
      await this.createxAPIStatements(courseData, options, activityId);
      
      // Package as ZIP
      const filename = `${this.sanitizeFilename(courseData.course.title)}_xAPI.zip`;
      const packagePath = await this.createZipPackage(filename);
      const size = await this.getPackageSize(packagePath);
      
      // Cleanup temporary files
      await this.cleanup();
      
      return {
        success: true,
        packagePath,
        filename,
        size,
        message: 'xAPI package created successfully',
      };
    } catch (error: any) {
      await this.cleanup();
      return {
        success: false,
        message: 'Failed to create xAPI package',
        errors: [error.message],
      };
    }
  }

  private async createTinCanXml(
    courseData: ExportCourseData,
    options: xAPIOptions,
    activityId: string
  ): Promise<void> {
    const tinCanXml = `<?xml version="1.0" encoding="UTF-8"?>
<tincan xmlns="http://projecttincan.com/tincan.xsd">
  <activities>
    <activity id="${activityId}" type="http://adlnet.gov/expapi/activities/course">
      <name lang="en-US">${this.escapeXml(courseData.course.title)}</name>
      <description lang="en-US">${this.escapeXml(courseData.course.description || '')}</description>
      <launch lang="en-US">index.html</launch>
    </activity>
    ${courseData.modules.map((module, index) => `
    <activity id="${activityId}/module/${index + 1}" type="http://adlnet.gov/expapi/activities/lesson">
      <name lang="en-US">${this.escapeXml(module.title)}</name>
      <description lang="en-US">${this.escapeXml(module.description || '')}</description>
      <launch lang="en-US">modules/module_${index + 1}/index.html</launch>
    </activity>`).join('')}
    ${courseData.quizzes.map((quiz, index) => `
    <activity id="${activityId}/quiz/${quiz.id}" type="http://adlnet.gov/expapi/activities/assessment">
      <name lang="en-US">${this.escapeXml(quiz.title)}</name>
      <description lang="en-US">${this.escapeXml(quiz.description || '')}</description>
      <launch lang="en-US">assessments/quiz_${quiz.id}/index.html</launch>
    </activity>`).join('')}
  </activities>
</tincan>`;

    await this.writeFile('tincan.xml', tinCanXml);
  }

  private async createLaunchFile(
    courseData: ExportCourseData,
    options: xAPIOptions,
    activityId: string
  ): Promise<void> {
    const launchContent = `<!DOCTYPE html>
<html lang="${options.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(courseData.course.title)}</title>
    <link rel="stylesheet" href="shared/common.css">
    <script src="shared/tincan-min.js"></script>
    <script src="shared/xapi-wrapper.js"></script>
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
                    <a href="modules/module_${index + 1}/index.html" 
                       onclick="trackNavigation('${activityId}/module/${index + 1}', '${this.escapeJs(module.title)}')">
                        ${this.escapeHtml(module.title)}
                    </a>
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
        
        <div class="progress-section">
            <h3>Your Progress</h3>
            <div class="progress-indicator">
                <div class="progress-bar" id="courseProgress" style="width: 0%"></div>
            </div>
            <p id="progressText">0% Complete</p>
        </div>
    </div>
    
    <script>
        // xAPI Configuration
        const courseConfig = {
            activityId: '${activityId}',
            courseName: '${this.escapeJs(courseData.course.title)}',
            totalModules: ${courseData.modules.length}
        };
        
        // Initialize xAPI
        window.onload = function() {
            xAPIWrapper.initialize(courseConfig);
            
            // Send course launched statement
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/launched",
                    display: { "en-US": "launched" }
                },
                object: {
                    id: courseConfig.activityId,
                    definition: {
                        name: { "en-US": courseConfig.courseName },
                        type: "http://adlnet.gov/expapi/activities/course"
                    }
                }
            });
            
            // Load progress
            loadProgress();
        };
        
        function trackNavigation(activityId, activityName) {
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/experienced",
                    display: { "en-US": "experienced" }
                },
                object: {
                    id: activityId,
                    definition: {
                        name: { "en-US": activityName },
                        type: "http://adlnet.gov/expapi/activities/lesson"
                    }
                }
            });
        }
        
        function loadProgress() {
            // This would typically load from xAPI statements
            const completedModules = parseInt(localStorage.getItem('completedModules') || '0');
            const progress = (completedModules / courseConfig.totalModules) * 100;
            updateProgress(progress);
        }
        
        function updateProgress(percentage) {
            document.getElementById('courseProgress').style.width = percentage + '%';
            document.getElementById('progressText').textContent = Math.round(percentage) + '% Complete';
        }
        
        window.onbeforeunload = function() {
            // Send course suspended statement
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/suspended",
                    display: { "en-US": "suspended" }
                },
                object: {
                    id: courseConfig.activityId,
                    definition: {
                        name: { "en-US": courseConfig.courseName },
                        type: "http://adlnet.gov/expapi/activities/course"
                    }
                }
            });
        };
    </script>
</body>
</html>`;

    await this.writeFile('index.html', launchContent);
  }

  private async createContentFiles(courseData: ExportCourseData, options: xAPIOptions): Promise<void> {
    // Create shared files
    await this.createSharedFiles();
    
    // Create module content files
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      await this.createModuleContent(module, i, courseData, options);
    }
    
    // Create assessment files
    for (const quiz of courseData.quizzes) {
      await this.createQuizContent(quiz, options);
    }
  }

  private async createSharedFiles(): Promise<void> {
    // TinCan JS library (simplified version)
    const tinCanJs = `
// Simplified TinCan.js for xAPI package
(function() {
    'use strict';
    
    window.TinCan = {
        LRS: function(options) {
            this.endpoint = options.endpoint;
            this.auth = options.auth;
        }
    };
    
    TinCan.LRS.prototype.sendStatement = function(statement, callback) {
        // This would send to actual LRS in production
        console.log('xAPI Statement:', statement);
        if (callback) callback(null, { response: 'success' });
    };
})();`;

    await this.writeFile('shared/tincan-min.js', tinCanJs);

    // xAPI Wrapper
    const xAPIWrapper = `
// xAPI Wrapper for course package
var xAPIWrapper = {
    lrs: null,
    actor: null,
    
    initialize: function(config) {
        this.actor = this.getActor();
        this.lrs = new TinCan.LRS({
            endpoint: config.endpoint || 'http://localhost:8080/xAPI/',
            auth: config.authToken || ''
        });
    },
    
    getActor: function() {
        // Try to get actor from URL parameters or use default
        const urlParams = new URLSearchParams(window.location.search);
        const actorEmail = urlParams.get('actor_email') || 'learner@example.com';
        const actorName = urlParams.get('actor_name') || 'Anonymous Learner';
        
        return {
            mbox: 'mailto:' + actorEmail,
            name: actorName
        };
    },
    
    sendStatement: function(statementData) {
        const statement = {
            actor: this.actor,
            verb: statementData.verb,
            object: statementData.object,
            timestamp: new Date().toISOString()
        };
        
        if (statementData.result) {
            statement.result = statementData.result;
        }
        
        if (statementData.context) {
            statement.context = statementData.context;
        }
        
        // Store locally and send to LRS if available
        this.storeStatement(statement);
        
        if (this.lrs) {
            this.lrs.sendStatement(statement, function(err, result) {
                if (err) {
                    console.warn('Failed to send xAPI statement:', err);
                } else {
                    console.log('xAPI statement sent successfully');
                }
            });
        }
    },
    
    storeStatement: function(statement) {
        // Store statements locally for offline capability
        const statements = JSON.parse(localStorage.getItem('xapi_statements') || '[]');
        statements.push(statement);
        localStorage.setItem('xapi_statements', JSON.stringify(statements));
    },
    
    getStoredStatements: function() {
        return JSON.parse(localStorage.getItem('xapi_statements') || '[]');
    }
};`;

    await this.writeFile('shared/xapi-wrapper.js', xAPIWrapper);

    // Common CSS (reuse from SCORM but with xAPI specific additions)
    const commonCss = `
/* xAPI Package Common Styles */
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
    transition: background-color 0.3s ease;
}

.course-navigation li:hover {
    background: #d5dbdb;
}

.course-navigation a {
    text-decoration: none;
    color: #2980b9;
    font-weight: bold;
}

.progress-section {
    margin: 30px 0;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
}

.progress-indicator {
    width: 100%;
    height: 25px;
    background: #ecf0f1;
    border-radius: 12px;
    margin: 15px 0;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(45deg, #27ae60, #2ecc71);
    border-radius: 12px;
    transition: width 0.5s ease;
    position: relative;
}

.progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.chapter-content {
    margin: 20px 0;
    padding: 15px;
    border-left: 4px solid #3498db;
    background: #f8f9fa;
}

.interaction-tracking {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 1000;
}

.btn {
    padding: 10px 20px;
    margin: 0 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover {
    background: #2980b9;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-secondary:hover {
    background: #7f8c8d;
}
`;

    await this.writeFile('shared/common.css', commonCss);
  }

  private async createModuleContent(
    module: any,
    moduleIndex: number,
    courseData: ExportCourseData,
    options: xAPIOptions
  ): Promise<void> {
    const activityId = options.activityId || 'http://course.example.com';
    const moduleActivityId = `${activityId}/module/${moduleIndex + 1}`;
    
    const moduleContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(module.title)}</title>
    <link rel="stylesheet" href="../../shared/common.css">
    <script src="../../shared/tincan-min.js"></script>
    <script src="../../shared/xapi-wrapper.js"></script>
</head>
<body>
    <div class="interaction-tracking" id="tracking">
        <div>Reading Time: <span id="readingTime">0</span>s</div>
        <div>Interactions: <span id="interactionCount">0</span></div>
    </div>
    
    <div class="module-container">
        <header class="module-header">
            <h1>${this.escapeHtml(module.title)}</h1>
            <p>${this.escapeHtml(module.description || '')}</p>
        </header>
        
        <div class="module-content">
            ${module.chapters.map((chapter: any, index: number) => `
            <section class="chapter-content" id="chapter-${index + 1}" 
                     onclick="trackInteraction('chapter-${index + 1}', '${this.escapeJs(chapter.title)}')">
                <h2>${this.escapeHtml(chapter.title)}</h2>
                <div class="chapter-body">
                    ${this.formatContent(chapter.content || '')}
                </div>
            </section>`).join('')}
        </div>
        
        <div class="navigation-buttons">
            ${moduleIndex > 0 ? `<button class="btn btn-secondary" onclick="navigateToModule(${moduleIndex - 1})">Previous Module</button>` : ''}
            <button class="btn btn-primary" onclick="completeModule()">Mark Complete</button>
            ${moduleIndex < courseData.modules.length - 1 ? `<button class="btn btn-primary" onclick="navigateToModule(${moduleIndex + 1})">Next Module</button>` : ''}
        </div>
    </div>
    
    <script>
        const moduleConfig = {
            activityId: '${moduleActivityId}',
            moduleName: '${this.escapeJs(module.title)}',
            moduleIndex: ${moduleIndex},
            totalModules: ${courseData.modules.length}
        };
        
        let startTime = Date.now();
        let interactionCount = 0;
        let readingTimer;
        
        window.onload = function() {
            xAPIWrapper.initialize({
                activityId: '${activityId}',
                endpoint: new URLSearchParams(window.location.search).get('endpoint'),
                authToken: new URLSearchParams(window.location.search).get('auth')
            });
            
            // Send module accessed statement
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/experienced",
                    display: { "en-US": "experienced" }
                },
                object: {
                    id: moduleConfig.activityId,
                    definition: {
                        name: { "en-US": moduleConfig.moduleName },
                        type: "http://adlnet.gov/expapi/activities/lesson"
                    }
                }
            });
            
            // Start reading timer
            startReadingTimer();
        };
        
        function startReadingTimer() {
            readingTimer = setInterval(function() {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('readingTime').textContent = elapsed;
            }, 1000);
        }
        
        function trackInteraction(elementId, elementName) {
            interactionCount++;
            document.getElementById('interactionCount').textContent = interactionCount;
            
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/interacted",
                    display: { "en-US": "interacted" }
                },
                object: {
                    id: moduleConfig.activityId + '/element/' + elementId,
                    definition: {
                        name: { "en-US": elementName },
                        type: "http://adlnet.gov/expapi/activities/interaction"
                    }
                }
            });
        }
        
        function completeModule() {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/completed",
                    display: { "en-US": "completed" }
                },
                object: {
                    id: moduleConfig.activityId,
                    definition: {
                        name: { "en-US": moduleConfig.moduleName },
                        type: "http://adlnet.gov/expapi/activities/lesson"
                    }
                },
                result: {
                    duration: 'PT' + duration + 'S',
                    completion: true,
                    extensions: {
                        'http://example.com/xapi/interactions': interactionCount
                    }
                }
            });
            
            // Update local progress
            const completedModules = Math.max(
                parseInt(localStorage.getItem('completedModules') || '0'),
                moduleConfig.moduleIndex + 1
            );
            localStorage.setItem('completedModules', completedModules.toString());
            
            alert('Module completed successfully!');
        }
        
        function navigateToModule(index) {
            clearInterval(readingTimer);
            window.location.href = '../module_' + (index + 1) + '/index.html';
        }
        
        window.onbeforeunload = function() {
            clearInterval(readingTimer);
            const duration = Math.floor((Date.now() - startTime) / 1000);
            
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/suspended",
                    display: { "en-US": "suspended" }
                },
                object: {
                    id: moduleConfig.activityId,
                    definition: {
                        name: { "en-US": moduleConfig.moduleName },
                        type: "http://adlnet.gov/expapi/activities/lesson"
                    }
                },
                result: {
                    duration: 'PT' + duration + 'S'
                }
            });
        };
    </script>
</body>
</html>`;

    await this.writeFile(`modules/module_${moduleIndex + 1}/index.html`, moduleContent);
  }

  private async createQuizContent(quiz: any, options: xAPIOptions): Promise<void> {
    const activityId = options.activityId || 'http://course.example.com';
    const quizActivityId = `${activityId}/quiz/${quiz.id}`;
    
    const quizContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(quiz.title)}</title>
    <link rel="stylesheet" href="../../shared/common.css">
    <script src="../../shared/tincan-min.js"></script>
    <script src="../../shared/xapi-wrapper.js"></script>
</head>
<body>
    <div class="quiz-container">
        <h1>${this.escapeHtml(quiz.title)}</h1>
        <p>${this.escapeHtml(quiz.description || '')}</p>
        
        <div class="quiz-info">
            ${quiz.timeLimit ? `<p><strong>Time Limit:</strong> ${quiz.timeLimit} minutes</p>` : ''}
            ${quiz.attempts ? `<p><strong>Attempts Allowed:</strong> ${quiz.attempts}</p>` : ''}
            ${quiz.passingScore ? `<p><strong>Passing Score:</strong> ${quiz.passingScore}%</p>` : ''}
        </div>
        
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
        const quizConfig = {
            activityId: '${quizActivityId}',
            quizName: '${this.escapeJs(quiz.title)}',
            questions: ${JSON.stringify(quiz.questions || [])},
            passingScore: ${quiz.passingScore || 70}
        };
        
        let startTime = Date.now();
        
        window.onload = function() {
            xAPIWrapper.initialize({
                activityId: '${activityId}',
                endpoint: new URLSearchParams(window.location.search).get('endpoint'),
                authToken: new URLSearchParams(window.location.search).get('auth')
            });
            
            // Send quiz attempted statement
            xAPIWrapper.sendStatement({
                verb: { 
                    id: "http://adlnet.gov/expapi/verbs/attempted",
                    display: { "en-US": "attempted" }
                },
                object: {
                    id: quizConfig.activityId,
                    definition: {
                        name: { "en-US": quizConfig.quizName },
                        type: "http://adlnet.gov/expapi/activities/assessment"
                    }
                }
            });
        };
        
        function submitQuiz() {
            const answers = collectAnswers();
            const score = calculateScore(answers);
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const passed = score >= quizConfig.passingScore;
            
            xAPIWrapper.sendStatement({
                verb: { 
                    id: passed ? "http://adlnet.gov/expapi/verbs/passed" : "http://adlnet.gov/expapi/verbs/failed",
                    display: { "en-US": passed ? "passed" : "failed" }
                },
                object: {
                    id: quizConfig.activityId,
                    definition: {
                        name: { "en-US": quizConfig.quizName },
                        type: "http://adlnet.gov/expapi/activities/assessment"
                    }
                },
                result: {
                    score: {
                        scaled: score / 100,
                        raw: score,
                        max: 100,
                        min: 0
                    },
                    duration: 'PT' + duration + 'S',
                    completion: true,
                    success: passed
                }
            });
            
            alert(\`Quiz submitted! Score: \${score}% (\${passed ? 'PASSED' : 'FAILED'})\`);
        }
        
        function collectAnswers() {
            const answers = [];
            const questions = document.querySelectorAll('.question');
            
            questions.forEach((question, index) => {
                const inputs = question.querySelectorAll('input');
                let answer = null;
                
                inputs.forEach(input => {
                    if (input.type === 'radio' && input.checked) {
                        answer = input.value;
                    } else if (input.type === 'text') {
                        answer = input.value;
                    }
                });
                
                answers.push(answer);
            });
            
            return answers;
        }
        
        function calculateScore(answers) {
            let correct = 0;
            const totalQuestions = quizConfig.questions.length;
            
            answers.forEach((answer, index) => {
                const question = quizConfig.questions[index];
                if (question && answer === question.correctAnswer) {
                    correct++;
                }
            });
            
            return totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
        }
    </script>
</body>
</html>`;

    await this.writeFile(`assessments/quiz_${quiz.id}/index.html`, quizContent);
  }

  private async createxAPIStatements(
    courseData: ExportCourseData,
    options: xAPIOptions,
    activityId: string
  ): Promise<void> {
    // Create a sample statements file for reference
    const sampleStatements = {
      statements: [
        {
          actor: {
            mbox: "mailto:learner@example.com",
            name: "Sample Learner"
          },
          verb: {
            id: "http://adlnet.gov/expapi/verbs/experienced",
            display: { "en-US": "experienced" }
          },
          object: {
            id: activityId,
            definition: {
              name: { "en-US": courseData.course.title },
              description: { "en-US": courseData.course.description || "" },
              type: "http://adlnet.gov/expapi/activities/course"
            }
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.writeFile('xapi/sample-statements.json', JSON.stringify(sampleStatements, null, 2));
  }

  private generateQuestionOptions(question: any, questionIndex: number): string {
    if (question.type === 'multiple_choice' && question.options) {
      return question.options.map((option: string, optionIndex: number) => `
        <label>
          <input type="radio" name="question_${questionIndex}" value="${option}">
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

  private escapeJs(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }
}
