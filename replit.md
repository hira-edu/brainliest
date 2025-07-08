# replit.md

## Overview

This is a modern full-stack exam preparation platform called "Brainliest" built with React/TypeScript frontend, Node.js/Express backend, PostgreSQL database via Neon, and Drizzle ORM. The platform provides AI-powered exam preparation with features like practice exams, question banks, analytics, and admin management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state, React Context for global state
- **Authentication**: JWT-based authentication with Google OAuth integration
- **Routing**: React Router with feature-based organization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Processing**: CSV import/export capabilities
- **Email**: SendGrid integration for notifications
- **AI Integration**: Google Generative AI for question assistance

### Database Design
- **ORM**: Drizzle with type-safe queries
- **Schema**: Normalized design with proper foreign key relationships
- **Key Tables**: users, subjects, exams, questions, user_sessions, comments
- **Features**: Full-text search, performance indexes, audit trails
- **Analytics**: Detailed answer tracking, performance trends, study recommendations

## Key Components

### Frontend Features
- **Feature-Based Organization**: Organized by domains (auth, admin, exam, content, analytics)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **SEO Optimization**: Meta tags, OpenGraph, structured data
- **Component Library**: Reusable UI components with consistent theming

### Backend Services
- **Authentication Service**: User registration, login, JWT management, Google OAuth
- **Question Management**: CRUD operations for questions with AI assistance
- **Session Management**: Exam session tracking with progress persistence
- **Analytics Service**: Performance tracking and reporting
- **Admin Panel**: User management, content administration, CSV operations

### Security Features
- **Input Validation**: Server-side validation for all endpoints
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: IP-based rate limiting for API endpoints
- **Secure Headers**: Helmet.js for security headers

## Data Flow

### User Registration/Authentication
1. User submits registration form or uses Google OAuth
2. Backend validates input and creates user record
3. Email verification sent (if email/password registration)
4. JWT tokens generated and stored in HTTP-only cookies
5. User redirected to dashboard with authenticated session

### Exam Taking Flow
1. User selects subject and exam from catalog
2. Session created with initial state
3. Questions loaded progressively with answers stored
4. Real-time progress tracking and analytics collection
5. Session completion triggers performance analysis
6. Results stored for historical tracking and recommendations

### Admin Content Management
1. Admin accesses protected admin panel
2. CRUD operations for subjects, exams, questions
3. CSV import/export for bulk operations
4. Real-time validation and data integrity checks
5. Audit logging for all administrative actions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon
- **drizzle-orm**: Type-safe database operations
- **@google/generative-ai**: AI-powered question assistance
- **@sendgrid/mail**: Email notifications
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token management

### Frontend Dependencies
- **React & React-DOM**: Core framework
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **lucide-react**: Icon library
- **react-hook-form**: Form management
- **@hookform/resolvers**: Form validation

### Development Dependencies
- **TypeScript**: Static type checking
- **Vite**: Build tool and dev server
- **ESLint & Prettier**: Code linting and formatting
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Production Environment
- **Frontend**: Vercel deployment with automatic builds
- **Backend**: Serverless functions on Vercel
- **Database**: Neon PostgreSQL with connection pooling
- **Static Assets**: CDN distribution via Vercel

### Environment Configuration
- **Development**: Local development with hot reload
- **Staging**: Preview deployments for testing
- **Production**: Optimized builds with monitoring

### Build Process
1. TypeScript compilation and type checking
2. Vite bundling for frontend assets
3. ESBuild for backend serverless functions
4. Database migrations via Drizzle Kit
5. Asset optimization and compression

### Security Considerations
- Environment variables for sensitive configuration
- HTTPS-only communication in production
- Database connection pooling and security
- Content Security Policy headers
- Rate limiting and DDoS protection

The application follows modern best practices for scalability, security, and maintainability while providing a comprehensive exam preparation platform with AI-powered features.