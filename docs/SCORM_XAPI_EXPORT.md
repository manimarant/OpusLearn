# SCORM/xAPI Export Guide

This document describes how to use the SCORM/xAPI export functionality to create standardized e-learning packages from OpusLearn courses.

## Overview

OpusLearn supports exporting courses as industry-standard e-learning packages that can be imported into any compatible Learning Management System (LMS). The export functionality supports:

- **SCORM 1.2**: Industry standard for e-learning content packages
- **SCORM 2004**: Enhanced SCORM standard with advanced sequencing
- **xAPI (Tin Can API)**: Modern standard for tracking detailed learning analytics

## How to Export a Course

### 1. Access Export Functionality

1. Navigate to the course detail page (`/courses/{id}`)
2. If you're the course instructor, you'll see an "Export Package" button in the header
3. Click the button to open the export dialog

### 2. Select Export Format

Choose from three available formats:

#### SCORM 1.2
- **Best for**: Maximum compatibility with older LMS platforms
- **Features**: Basic tracking, offline capability, wide support
- **Use when**: You need broad LMS compatibility

#### SCORM 2004
- **Best for**: Modern LMS platforms with advanced features
- **Features**: Advanced navigation, better organization, enhanced tracking
- **Use when**: You want modern SCORM features and your LMS supports it

#### xAPI (Tin Can API)
- **Best for**: Detailed learning analytics and modern tracking
- **Features**: Rich interaction tracking, detailed analytics, mobile support
- **Use when**: You need comprehensive learning analytics

### 3. Configure Export Options

#### General Settings
- **Package Title**: Name of the exported course package
- **Organization**: Your organization name (appears in package metadata)
- **Language**: Content language (en, es, fr, de, it)
- **Version**: Package version number

#### SCORM-Specific Settings (SCORM 1.2 & 2004)
- **Mastery Score**: Minimum score percentage required to pass (0-100%)
- **Max Time Allowed**: Maximum time limit (e.g., "PT2H" for 2 hours)
- **Time Limit Action**: What happens when time expires
  - Continue without message
  - Exit with message
  - Exit without message

#### xAPI-Specific Settings
- **Activity ID**: Unique identifier for the course activity (auto-generated if empty)
- **xAPI Endpoint**: URL of your Learning Record Store (LRS) - optional
- **Auth Token**: Authentication token for LRS communication - optional

### 4. Export and Download

1. Review the export summary
2. Click "Export Package" to generate the package
3. The package will be automatically downloaded as a ZIP file
4. Import the ZIP file into your target LMS

## Package Contents

### SCORM Packages

SCORM packages include:

```
course_package.zip
├── imsmanifest.xml          # Package manifest
├── content/
│   ├── index.html           # Course launch page
│   ├── module_1/
│   │   ├── index.html       # Module content
│   │   └── style.css        # Module styles
│   └── module_2/
│       ├── index.html
│       └── style.css
├── shared/
│   ├── scorm_api.js         # SCORM API wrapper
│   ├── scorm_wrapper.js     # SCORM communication
│   └── common.css           # Shared styles
└── assessments/
    └── quiz_1/
        └── index.html       # Quiz content
```

### xAPI Packages

xAPI packages include:

```
course_package.zip
├── tincan.xml               # xAPI activity definitions
├── index.html               # Course launch page
├── modules/
│   ├── module_1/
│   │   └── index.html       # Module with xAPI tracking
│   └── module_2/
│       └── index.html
├── shared/
│   ├── tincan-min.js        # xAPI library
│   ├── xapi-wrapper.js      # xAPI communication
│   └── common.css           # Shared styles
├── assessments/
│   └── quiz_1/
│       └── index.html       # Quiz with xAPI scoring
└── xapi/
    └── sample-statements.json # Sample xAPI statements
```

## Content Mapping

### OpusLearn → Package Mapping

| OpusLearn Element | SCORM | xAPI |
|-------------------|-------|------|
| Course | Course | Activity (course type) |
| Module | Section/Item | Activity (lesson type) |
| Chapter | Page/Resource | Activity (interaction type) |
| Assignment | Assignment | Activity (assessment type) |
| Quiz | Quiz | Activity (assessment type) |
| Discussion | Forum | Activity (discussion type) |

### Supported Content Features

✅ **Fully Supported**:
- Rich text content with HTML formatting
- Assignments with due dates and point values
- Quizzes with multiple choice, true/false, and short answer questions
- Discussion topics and prompts
- Course structure and navigation
- Progress tracking
- Completion status

⚠️ **Partially Supported**:
- Images (URLs preserved, files not embedded)
- Links to external resources
- Embedded videos (URLs preserved)

❌ **Not Supported**:
- Interactive JavaScript components
- File uploads/downloads
- Real-time collaboration features
- Custom styling beyond basic formatting

## LMS Compatibility

### SCORM 1.2 Compatible LMS
- Moodle (all versions)
- Canvas
- Blackboard Learn
- D2L Brightspace
- TalentLMS
- Adobe Captivate Prime
- Most legacy LMS platforms

### SCORM 2004 Compatible LMS
- Moodle 2.0+
- Canvas
- Blackboard Learn 9.0+
- D2L Brightspace
- Modern LMS platforms

### xAPI Compatible LMS
- Moodle with xAPI plugin
- TotaraLMS
- Adobe Captivate Prime
- Learning Locker
- Watershed LRS
- Any LRS-enabled platform

## Troubleshooting

### Common Issues

#### 1. Export Fails with "Validation Error"
- **Cause**: Missing required course content
- **Solution**: Ensure course has:
  - At least one module
  - At least one chapter per module
  - Valid chapter titles

#### 2. Package Won't Import to LMS
- **Cause**: Incompatible SCORM version or corrupted package
- **Solutions**:
  - Try different SCORM version (1.2 vs 2004)
  - Check LMS SCORM support documentation
  - Verify ZIP file isn't corrupted

#### 3. Tracking Not Working in LMS
- **Cause**: LMS configuration or SCORM communication issues
- **Solutions**:
  - Verify LMS supports chosen SCORM version
  - Check LMS SCORM settings
  - Contact LMS administrator

#### 4. xAPI Statements Not Recording
- **Cause**: Missing LRS configuration or network issues
- **Solutions**:
  - Verify LRS endpoint URL and credentials
  - Check network connectivity to LRS
  - Review browser console for errors

### Error Messages

- **"Course data validation failed"**: Course missing required content
- **"Export request validation failed"**: Invalid export options
- **"Failed to create package"**: Technical error during package creation
- **"Unauthorized"**: User doesn't own the course

## Technical Details

### API Endpoints

#### Get Export Formats
```
GET /api/export/formats
```

#### Export Course
```
POST /api/courses/{courseId}/export
{
  "format": "scorm12|scorm2004|xapi",
  "options": {
    "title": "Course Title",
    "organization": "My Organization",
    "language": "en",
    "masteryScore": 80,
    "activityId": "http://example.com/course/123"
  }
}
```

### File Structure

The export service is organized as follows:

```
server/services/elearning-export/
├── base-package.ts           # Base exporter class
├── scorm-exporter.ts         # SCORM 1.2/2004 implementation
├── xapi-exporter.ts          # xAPI implementation
└── export-service.ts         # Main service coordinator
```

### Extending Support

To add support for additional formats:

1. Create new exporter class extending `BasePackageExporter`
2. Implement required methods:
   - `createPackage()`
   - Format-specific content generation
3. Register in `ELearningExportService`
4. Add format info to `getSupportedFormats()`

## Best Practices

### Content Preparation
1. **Keep content simple**: Avoid complex interactive elements
2. **Use standard HTML**: Stick to basic formatting for best compatibility
3. **Optimize images**: Use web-optimized images and consider file sizes
4. **Test quizzes**: Ensure quiz questions have clear correct answers

### Package Configuration
1. **Choose appropriate format**: Use SCORM 1.2 for maximum compatibility
2. **Set realistic mastery scores**: Consider learner abilities
3. **Configure time limits appropriately**: Allow sufficient time for completion
4. **Use meaningful titles**: Help learners identify content easily

### LMS Import
1. **Test in staging**: Always test packages before deploying to production
2. **Check permissions**: Ensure proper user access in target LMS
3. **Configure tracking**: Set up grade book integration if needed
4. **Provide instructions**: Give learners clear guidance on package usage

## Support

For technical issues with SCORM/xAPI export:

1. **Check this documentation** for common solutions
2. **Verify course content** meets minimum requirements
3. **Test with different formats** if one fails
4. **Contact LMS administrator** for platform-specific issues
5. **Review browser console** for technical error details

## Standards Compliance

### SCORM 1.2
- Compliant with ADL SCORM 1.2 specification
- Includes proper manifest structure
- Implements required API communication
- Supports basic completion and scoring

### SCORM 2004
- Compliant with ADL SCORM 2004 3rd Edition
- Enhanced sequencing support
- Improved navigation controls
- Advanced content organization

### xAPI
- Follows xAPI 1.0.3 specification
- Implements standard verbs and activity types
- Provides comprehensive statement tracking
- Supports offline synchronization
