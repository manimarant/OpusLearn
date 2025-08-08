# LMS Integration Guide

This document describes how to use the LMS integration feature to publish courses from OpusLearn to external Learning Management Systems.

## Supported Platforms

- **Moodle**: Open-source LMS with web services API
- **Canvas**: Instructure Canvas LMS with REST API  
- **Blackboard Learn**: Blackboard Learn with REST API

## How to Use

### 1. Access the Publish Feature

1. Navigate to any course preview page (`/courses/{id}/preview`)
2. If you're the course instructor, you'll see a "Publish to LMS" button in the header
3. Click the button to open the publish dialog

### 2. Configure LMS Connection

1. **Select Platform**: Choose your target LMS platform from the dropdown
2. **API URL**: Enter the base URL of your LMS instance
3. **API Key**: Enter your API credentials (web service token, access token, etc.)
4. **External Course ID** (Optional): Enter an existing course ID to update, or leave empty to create new

### 3. Validate Connection

1. Click "Validate Connection" to test your credentials
2. Wait for validation to complete
3. If successful, proceed to the publish tab

### 4. Publish Course

1. Review the publish configuration
2. Click "Publish Course" to export and create the course in your LMS
3. The system will create:
   - Course structure with modules and chapters
   - Assignments with due dates and point values
   - Quizzes with questions and settings
   - Discussion forums

## API Credentials Setup

### Moodle

1. **Enable Web Services**:
   - Go to Site Administration → Advanced Features
   - Check "Enable web services"

2. **Create Web Service Token**:
   - Go to Site Administration → Server → Web Services → Manage tokens
   - Create a new token for your user account
   - Copy the token string

3. **API URL Format**: `https://your-moodle-site.com`

### Canvas

1. **Generate Access Token**:
   - Go to Account → Settings → Approved Integrations
   - Click "New Access Token"
   - Copy the generated token

2. **API URL Format**: `https://your-canvas-instance.instructure.com`

### Blackboard Learn

1. **Create Application**:
   - Contact your Blackboard administrator
   - Register your application to get an application key
   - Get the REST API base URL

2. **API URL Format**: `https://your-blackboard-instance.com`

## Course Content Mapping

### OpusLearn → LMS Mapping

| OpusLearn Element | Moodle | Canvas | Blackboard |
|-------------------|---------|---------|------------|
| Course | Course | Course | Course |
| Module | Section | Module | Content Area |
| Chapter | Page/Resource | Page | Content Item |
| Assignment | Assignment | Assignment | Assignment |
| Quiz | Quiz | Quiz | Test |
| Discussion | Forum | Discussion Topic | Discussion Board |

### Supported Content Types

- **Text Content**: Rich text with basic HTML formatting
- **Assignments**: Title, description, instructions, due dates, point values
- **Quizzes**: Multiple choice, true/false, short answer questions
- **Discussions**: Forum topics with initial prompts

### Content Limitations

- **Media Files**: Not automatically transferred (URLs preserved)
- **Interactive Elements**: Basic HTML only, no JavaScript
- **Custom Styling**: Inline styles are removed for security

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify API URL format (include https://, no trailing slash)
   - Check API credentials are correct and active
   - Ensure web services are enabled on target LMS

2. **Partial Course Creation**
   - Some content may fail while others succeed
   - Check LMS permissions for creating different content types
   - Review server logs for specific error messages

3. **Authentication Errors**
   - Verify token/key has sufficient permissions
   - Check if token has expired
   - Ensure user account exists and is active

### Error Messages

- **"Network error"**: Check internet connection and API URL
- **"Invalid API configuration"**: Verify credentials and permissions
- **"Validation failed"**: Check required fields are filled
- **"HTTP 403"**: Insufficient permissions on target LMS
- **"HTTP 404"**: API endpoint not found (check URL format)

## API Endpoints

The following REST endpoints are available for programmatic access:

### Get Supported Platforms
```
GET /api/lms/platforms
```

### Validate Connection
```
POST /api/lms/validate
{
  "platform": "moodle|canvas|blackboard",
  "apiUrl": "https://lms-instance.com",
  "apiKey": "your-api-key"
}
```

### Publish Course
```
POST /api/courses/{courseId}/publish
{
  "platform": "moodle|canvas|blackboard", 
  "apiUrl": "https://lms-instance.com",
  "apiKey": "your-api-key",
  "courseId": "external-course-id" // optional
}
```

## Security Considerations

- API credentials are never stored persistently
- All API requests use HTTPS
- Content is sanitized before sending to external LMS
- User must own the course to publish it
- Authentication required for all operations

## Development

### Adding New LMS Platforms

1. Create new adapter class extending `BaseLMSAdapter`
2. Implement required methods: `validateConfig`, `publishCourse`, `updateCourse`, `deleteCourse`
3. Add platform to `LMSService` constructor
4. Update platform info in `getPlatformInfo` method

### Extending Content Support

1. Modify `LMSCourseData` interface to include new content types
2. Update course data collection in publish API endpoint
3. Implement content creation methods in each adapter
4. Add UI support in publish dialog if needed

## Support

For technical support or feature requests related to LMS integration:

1. Check this documentation first
2. Review server logs for error details
3. Test with minimal course content to isolate issues
4. Contact your LMS administrator for platform-specific issues
