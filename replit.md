# Frost Learning Platform

## Overview

Frost Learning is a comprehensive e-learning platform built with modern web technologies. It provides a full-featured Learning Management System (LMS) with course creation, content management, student enrollment, discussions, assignments, and analytics capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Serverless-optimized connection pooling

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Role-based access (student, instructor, admin)
- **Security**: Secure cookies, CSRF protection, and proper session handling

### Course Management
- **Course Creation**: Instructors can create and manage courses
- **Module System**: Hierarchical content organization (Course → Modules → Lessons)
- **Content Types**: Support for text, video, and interactive content
- **Publishing Workflow**: Draft/Published/Archived status management

### Learning Features
- **Enrollment System**: Student course enrollment and progress tracking
- **Discussion Forums**: Course-specific discussions with threaded replies
- **Assignment System**: Assignment creation, submission, and grading
- **Progress Tracking**: Lesson completion and course progress analytics

### User Interface
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Design System**: Consistent UI using shadcn/ui components
- **Dark Mode**: CSS variable-based theming support
- **Accessibility**: ARIA compliance and keyboard navigation

## Data Flow

### Authentication Flow
1. User initiates login via `/api/login`
2. Redirects to Replit OAuth provider
3. User authenticates and returns with authorization code
4. Server exchanges code for tokens and creates session
5. Client receives authenticated user data

### Course Content Flow
1. Instructors create courses through the course builder
2. Content is organized in modules and lessons
3. Students enroll in published courses
4. Progress is tracked as students complete lessons
5. Analytics aggregate engagement and completion data

### Real-time Features
- Live discussion updates
- Notification system for course updates
- Progress synchronization across devices

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: OAuth authentication provider
- **Replit Runtime**: Development and hosting environment

### UI/UX Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **React Hook Form**: Form validation and management

### Development Tools
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast development server and bundling
- **ESBuild**: Production build optimization
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Database**: Live connection to Neon PostgreSQL
- **Authentication**: Replit Auth with development callback URLs
- **Asset Serving**: Vite handles static assets and client routing

### Production Build
- **Client**: Vite builds optimized React application to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Static Assets**: Served directly by Express in production
- **Environment**: NODE_ENV-based configuration switching

### Database Management
- **Schema**: Shared TypeScript definitions in `/shared/schema.ts`
- **Migrations**: Drizzle Kit generates and applies migrations
- **Connection**: Environment-based DATABASE_URL configuration
- **Pooling**: Connection pooling for serverless environments

### Security Considerations
- **Session Security**: HTTP-only cookies with secure flags
- **CORS**: Configured for Replit domain restrictions
- **Input Validation**: Zod schemas for API request validation
- **SQL Injection**: Parameterized queries via Drizzle ORM
- **Authentication**: Role-based access control throughout the application