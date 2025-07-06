# Multi-Exam Practice Platform

## Overview

This is a comprehensive web-based practice exam platform designed for users preparing for certification exams like PMP, AWS, and more. The platform allows users to select subjects, take practice exams with multiple-choice questions, receive immediate feedback, and track their progress. It includes both user-facing features and admin functionality for managing content.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Custom components built with Radix UI primitives
- **Styling**: Tailwind CSS with shadcn/ui design system
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API architecture

### Database Schema
The application uses four main entities:
- **Subjects**: Main certification categories (PMP, AWS, etc.)
- **Exams**: Practice exam sets within each subject
- **Questions**: Multiple-choice questions with options and explanations
- **User Sessions**: Track user progress and exam attempts

## Key Components

### User Interface Components
- **Subject Selection**: Grid-based subject cards with icons and statistics
- **Exam Selection**: List of available exams with difficulty levels and metadata
- **Question Interface**: Single-question display with immediate feedback
- **Progress Tracking**: Timer, progress bar, and question navigation
- **Results Dashboard**: Score summary with domain-based performance analysis

### Data Management
- **In-Memory Storage**: Currently uses MemStorage class for development
- **Database Integration**: Configured for PostgreSQL with Drizzle migrations
- **Schema Validation**: Zod schemas for type-safe data validation
- **API Layer**: Express routes with proper error handling

### Admin Functionality
- **Question Management**: CRUD operations for questions, answers, and explanations
- **Content Organization**: Manage subjects, exams, and question categorization
- **Data Import**: Support for bulk question uploads (extensible for CSV)

## Data Flow

1. **User Journey**: Home → Subject Selection → Exam Selection → Question Interface → Results
2. **Session Management**: Create session on exam start, track answers and timing
3. **Real-time Feedback**: Immediate response validation with explanations
4. **Progress Persistence**: Session state maintained throughout exam
5. **Result Calculation**: Score computation with domain-specific analytics

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight React router

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development plugins

### Authentication & Sessions
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session middleware (implied dependency)

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon serverless PostgreSQL
- **Environment**: Replit-optimized with specific plugins

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Database**: Drizzle migrations via `db:push` command
- **Deployment**: Node.js with static file serving

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **Session Configuration**: PostgreSQL-backed sessions for scalability

## Recent Changes

### July 06, 2025 - Enhanced Question Interface
- **Added slide-down feedback system**: Feedback now appears below questions with smooth animation instead of replacing the question
- **Integrated ChatGPT AI assistance**: Added AI help button on questions and AI explanations in feedback
- **Added comments system**: Users can discuss questions with other learners, comments slide down below feedback
- **Enhanced user experience**: Questions remain visible during feedback for better learning context
- **Added OpenAI integration**: Backend endpoints for AI help and detailed explanations

### Database Extensions
- Added comments table with author name, content, timestamps, and threading support
- Extended API routes for comment CRUD operations and AI assistance

## Changelog

```
Changelog:
- July 06, 2025. Initial setup and enhanced question interface with AI help and comments
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```