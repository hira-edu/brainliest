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

## Recent Changes

### July 09, 2025 - SearchableSelect Component Rewrite and Critical UI Fixes (COMPLETED)
- **Complete SearchableSelect rewrite**: Rebuilt component with elite industry-standard patterns replacing problematic Command component implementation
- **Fixed mouse hover and selection**: Proper onMouseEnter handlers and hover states for intuitive user interaction
- **Eliminated blur and overlay issues**: Corrected focus management and z-index positioning for stable dropdown behavior
- **Enhanced keyboard navigation**: Full arrow key support with proper highlighting and Enter key selection
- **Professional visual design**: Industry-standard styling with smooth transitions and proper spacing
- **Robust search functionality**: Debounced search with real-time filtering and custom value creation support
- **Fixed parsing errors**: Resolved malformed searchable-select.tsx file that was causing JavaScript compilation failures
- **Database API fixes**: Removed non-existent column references in storage layer preventing user management errors
- **Production-ready implementation**: Component now meets enterprise UI/UX standards with reliable performance

### July 09, 2025 - Slug-based System Clarification and Implementation (COMPLETED)
- **Schema architecture clarification**: Confirmed that subjects and exams use slug-based primary keys, while questions use ID-based primary keys but reference exams/subjects via slug fields (examSlug, subjectSlug)
- **Admin panel slug-based conversion**: Successfully converted admin interface to use slug-based system for subjects and exams
- **Fixed subject and exam filtering**: Updated SearchableSelect components to use slug-based filtering throughout admin interface
- **Form validation updates**: Converted form defaults and validation to use slug-based references for subjects and exams
- **Database consistency**: Ensured all foreign key relationships use appropriate slug-based references (examSlug, subjectSlug)
- **Mixed ID/slug system**: Questions maintain ID-based identification while correctly referencing slug-based subjects and exams
- **Comprehensive testing**: Verified all CRUD operations work properly with the hybrid ID/slug system

### July 09, 2025 - Cascade Filtering Implementation for Exams Management (COMPLETED)
- **Replaced difficulty filter with hierarchical cascade filtering**: Implemented Category → Subcategory → Subject filtering chain in exams management
- **Intelligent filter dependencies**: Category selection filters subcategories; subcategory selection filters subjects; all filters cascade appropriately
- **Enhanced user experience**: Subject filter is disabled until category/subcategory is selected, providing guided filtering workflow
- **Real-time filter updates**: Filter options update dynamically based on parent selections with proper state management
- **Comprehensive filter logic**: All exam display and pagination logic updated to support hierarchical filtering
- **Consistent SearchableSelect usage**: Maintained elite SearchableSelect implementation across all filter components

### July 09, 2025 - Vercel Deployment Import Path Fix (COMPLETED)
- **Fixed critical deployment imports**: Corrected incorrect `.js` extension imports in `api/index.js` and `scripts/test-database-connection.js`
- **Industry-standard import paths**: Updated schema imports from `../shared/schema.js` to `../shared/schema` for proper TypeScript compilation
- **Vercel compatibility**: Ensured import paths work correctly with Vercel's build process and serverless function deployment
- **Database connection stability**: Maintained proper schema imports for Neon database operations in production environment
- **Build process optimization**: Eliminated module resolution errors that were causing 500 errors during Vercel deployment
- **Root cause resolution**: Identified that the `/var/task/src/shared/schemas/database` error was due to build process issues, not source code problems
- **Clean import structure**: Verified all current imports use correct paths without problematic references to non-existent modules

### July 09, 2025 - Production Build Configuration and Database Setup (COMPLETED)
- **Environment configuration**: Created comprehensive .env file with Neon database connection string and development JWT secrets
- **Database connectivity verified**: Successfully connected to Neon PostgreSQL database with proper SSL configuration
- **Fixed sitemap service import**: Corrected import path in storage.ts from `./sitemap-service.js` to `./services/sitemap-service.js`
- **Production build system**: Created working backend build using esbuild that generates functional dist/index.js
- **Build script automation**: Developed scripts/build.js for streamlined production builds with backend compilation and static file handling
- **Production deployment ready**: Verified production server starts correctly and connects to database with health check endpoint
- **Module resolution fix**: Resolved Cannot find module errors that were preventing production builds
- **Local build instructions**: Created comprehensive BUILD_INSTRUCTIONS.md with step-by-step local setup guide
- **Build script reliability**: Enhanced scripts/build.js with detailed output and troubleshooting information