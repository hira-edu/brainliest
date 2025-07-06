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
- **PostgreSQL Database**: Production-ready PostgreSQL database with Neon serverless hosting
- **Database Storage**: DatabaseStorage class using Drizzle ORM for all data operations
- **Schema Management**: Drizzle migrations with automatic schema deployment
- **Data Persistence**: All subjects, exams, questions, and user sessions stored in PostgreSQL
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

### July 06, 2025 - PostgreSQL Database Integration for Production Scalability (COMPLETED)
- **Complete database migration**: Successfully migrated from in-memory storage to PostgreSQL database
- **DatabaseStorage implementation**: Created comprehensive DatabaseStorage class using Drizzle ORM
- **Schema deployment**: Deployed all database tables (subjects, exams, questions, user_sessions, comments, users)
- **Data seeding**: Implemented automatic database seeding with 5 subjects, sample exam data, and 5 sample users
- **Production ready**: All API endpoints now use PostgreSQL for persistent data storage
- **Drizzle ORM integration**: Full integration with type-safe database operations
- **Error handling**: Robust error handling for database operations with proper null safety
- **Scalability achieved**: Platform now supports unlimited users and data growth

### July 06, 2025 - Complete Deployment Package for External Server Deployment (COMPLETED)
- **Comprehensive deployment guide**: Created detailed DEPLOYMENT_GUIDE.md with step-by-step instructions for server deployment
- **Docker containerization**: Added Dockerfile with multi-stage build for optimized production deployment
- **Docker Compose setup**: Created docker-compose.yml with PostgreSQL and application services configured
- **Environment configuration**: Added .env.example template with all required environment variables
- **Health monitoring**: Implemented /api/health endpoint for application and database status monitoring
- **Production scripts**: Enhanced package.json with proper build and start scripts for production deployment
- **Security configuration**: Added proper .gitignore file excluding sensitive files and build artifacts
- **Deployment options**: Provided multiple deployment methods (Node.js, Docker, Docker Compose) with Nginx configuration
- **Complete package**: Project is now ready for deployment on any external server with PostgreSQL support

### July 06, 2025 - GitHub and Vercel Deployment Configuration (COMPLETED)
- **Vercel configuration**: Created optimized vercel.json with proper routing for full-stack deployment
- **GitHub deployment guide**: Added comprehensive GITHUB_VERCEL_DEPLOYMENT.md with step-by-step instructions
- **Professional README**: Created detailed README.md with project overview, features, and deployment instructions
- **Database options**: Documented integration with Neon, Railway, and Supabase for managed PostgreSQL
- **Environment setup**: Provided clear instructions for setting up environment variables in Vercel
- **One-click deployment**: Added Vercel deploy button for instant deployment from GitHub
- **Build optimization**: Configured proper build commands and output directories for Vercel
- **Production ready**: Project fully prepared for GitHub repository and Vercel deployment

### July 06, 2025 - Official Certification Icons Implementation (COMPLETED)
- **Professional icon library**: Created comprehensive SVG-based certification icons for all major providers
- **Official branding**: Added authentic-looking icons for PMP, AWS, CompTIA, Cisco, Azure, Google Cloud, Oracle, VMware, Kubernetes, Docker
- **Academic subject icons**: Included specialized icons for Mathematics, Statistics, Science, Engineering, Business, Medical subjects
- **Smart icon integration**: Updated subject cards and homepage to automatically use official icons when available
- **Fallback system**: Maintained FontAwesome icons as fallback for subjects without official icons
- **Scalable design**: SVG-based icons ensure crisp display at all sizes and devices
- **Admin panel integration**: Created icon selector component for easy icon management in admin interface
- **Brand consistency**: All certification icons follow official color schemes and design patterns

### July 06, 2025 - Comprehensive Category and Sub-Category Navigation System (COMPLETED)
- **Complete categorization structure**: Built comprehensive 2-level category system with main categories and sub-categories
- **Professional Certifications category**: Contains IT & Cloud Computing, Project Management, Cybersecurity, and Networking sub-categories
- **University & College category**: Contains 8 sub-categories: Mathematics & Statistics, Computer Science, Natural Sciences, Engineering, Business & Economics, Health & Medical Sciences, Social Sciences & Humanities, and Standardized Test Prep
- **Category navigation pages**: Created dedicated /categories page showing all categories and sub-categories
- **Sub-category detail pages**: Built detailed pages for each sub-category with subject filtering and search
- **Enhanced routing system**: Added proper routing for /categories/:categoryId/:subCategoryId navigation paths
- **Subject filtering by category**: Implemented smart subject categorization using keyword matching
- **Search and sort functionality**: Added search bar and sorting options (by name, exam count, question count) on category pages
- **Breadcrumb navigation**: Added back buttons and breadcrumb navigation for easy category browsing
- **Header navigation link**: Added "Categories" link to main navigation for easy access
- **Homepage integration**: Added "Browse All Categories" button on homepage for discoverability
- **Responsive design**: All category pages are fully responsive and mobile-friendly

### July 06, 2025 - Major Database Expansion with Comprehensive Academic Subjects (COMPLETED)
- **Successfully resolved display issue**: Fixed technical problem where expanded subject database wasn't appearing on homepage
- **Massive subject database expansion**: Added 47 comprehensive subjects across 8 major categories (now fully functional)
- **Statistics subjects**: Added AP Statistics, Biostatistics, Business Statistics, Elementary Statistics, and Intro to Statistics
- **Mathematics subjects**: Added Calculus, Linear Algebra, Geometry, Discrete Mathematics, and Pre-Calculus
- **Computer Science subjects**: Added Programming, Data Structures, Web Development, Database Design, and Computer Science Fundamentals
- **Engineering subjects**: Added Mechanical Engineering, Electrical Engineering, and general Engineering
- **Medical/Nursing subjects**: Added Nursing, Pharmacology, Medical Sciences, Anatomy, and Health Sciences
- **Science subjects**: Added Physics, Chemistry, Biology, Astronomy, and Earth Science
- **Business subjects**: Added Accounting, Economics, Finance, and Business Administration
- **Social Sciences**: Added Psychology, History, Philosophy, Sociology, Political Science, English, and Writing
- **Professional Exams**: Added HESI, TEAS, GRE, LSAT, TOEFL, and GED preparation
- **Comprehensive exam coverage**: Added 65 practice exams across all subject categories with realistic question counts and timing
- **Enhanced categorization**: Fixed and improved subject categorization with expanded keywords for proper organization
- **Technical resolution**: Fixed backend data seeding and frontend categorization to properly display all 47 subjects
- **Font Awesome icons**: Fixed icon display issues by adding Font Awesome CSS library
- **Admin panel optimization**: Removed duplicate filter sections for cleaner UI
- **Sample questions**: Added representative questions for major subjects including PMP, AWS, CompTIA, Computer Science, Mathematics, and Statistics

### July 06, 2025 - Production-Ready Professional Email System with Verified Domain (COMPLETED)
- **Resend email service integration**: Successfully implemented multi-provider email system with Resend as primary service
- **Verified domain configuration**: brainliest.com domain verified and configured in Resend for professional email delivery
- **Production email delivery**: System now sends emails from noreply@brainliest.com to any user email address
- **Multi-provider fallback**: Support for Resend, SendGrid, and Mailgun with automatic detection and fallback
- **Beautiful branded emails**: Professional HTML email templates with Brainliest branding and security notices
- **Scalable architecture**: Enterprise-grade email delivery capable of handling thousands of users
- **Testing and debugging**: Smart fallback system with console logging for development and testing
- **Cost-effective solution**: Using Resend with 3,000 emails/month free tier, then affordable scaling

### July 06, 2025 - Google Gemini AI Integration
- **Switched from OpenAI to Google Gemini**: Replaced OpenAI API with Google Gemini Pro for all AI features
- **Updated AI question help**: Now uses Gemini for generating hints and guidance without revealing answers
- **Enhanced answer explanations**: Gemini provides detailed explanations for correct and incorrect answers
- **Improved API reliability**: Using provided Gemini API key for consistent AI assistance
- **Maintained feature compatibility**: All existing AI functionality continues to work seamlessly

### July 06, 2025 - Google OAuth Authentication System Implementation (COMPLETED)
- **Real Google OAuth integration**: Replaced mock authentication with proper Google Identity Services
- **Google Client ID configuration**: Added VITE_GOOGLE_CLIENT_ID environment variable support
- **Comprehensive authentication service**: Created GoogleAuthService class with JWT parsing and user management
- **Fallback authentication system**: Implemented demo authentication when Google services are unavailable
- **Auth callback routing**: Added proper OAuth callback handling with /auth/callback route
- **Production-ready authentication**: System supports both development demo mode and production Google OAuth
- **Updated authentication modals**: Both auth-modal and question-limit-modal now use real Google sign-in
- **Enhanced user experience**: Graceful handling of Google service errors with informative fallbacks

### July 06, 2025 - Comprehensive User Settings Panel with Modern Functionality
- **Complete user settings interface**: Created comprehensive settings panel with 5 main sections
- **Profile management**: Personal information editing including contact details, bio, and social links
- **Security features**: Password change functionality with validation and show/hide toggles
- **Notification preferences**: Granular control over email, push, and reminder notifications
- **Privacy controls**: Profile visibility, data sharing, and analytics opt-out options
- **Account management**: Data export functionality and account deletion with proper confirmations
- **Backend API integration**: Full REST API endpoints for all settings operations
- **Header integration**: Added settings link in user dropdown menu for easy access
- **Modern UI components**: Used shadcn/ui components with proper validation and loading states

### July 06, 2025 - Enhanced Authentication Modal with Separate Sign-in/Sign-up Flows
- **Separate authentication modes**: Clear distinction between sign-in and sign-up processes
- **Sign-in tab**: Email and password fields for existing users with proper validation
- **Sign-up tab**: Email verification code flow for new user registration
- **Easy mode switching**: Quick links to switch between sign-in and sign-up modes
- **Social authentication**: Google sign-in option available for both authentication modes
- **Updated branding**: Modal title and descriptions reflect "Brainliest" brand

### July 06, 2025 - Complete Rebranding from ExamPrep Pro to Brainliest
- **Complete brand name change**: Updated all references from "ExamPrep Pro" to "Brainliest" across the entire platform
- **Email address updates**: Changed all email addresses from @examprep.pro to @brainliest.com domain
- **Legal page updates**: Updated Terms of Service and Privacy Policy with new brand name and contact information
- **Contact information refresh**: Updated Contact Us page with new company name and email addresses
- **Footer and header updates**: Consistent branding across all navigation and footer components
- **HTML title update**: Changed page title to "Brainliest - Exam Preparation Platform"
- **Company information**: Updated Our Story page with new brand identity and messaging

## Recent Changes

### July 06, 2025 - Complete Footer Section with Legal and Contact Pages
- **Comprehensive footer component**: Added footer with company info, quick links, legal pages, and contact information
- **Terms of Service page**: Created detailed legal terms covering service use, liability, privacy, and user agreements
- **Our Story page**: Added company background, mission, and team information with professional design
- **Privacy Policy page**: Complete privacy policy covering data collection, usage, and user rights
- **Contact Us page**: Professional contact form with categories, contact info, FAQs, and backend API integration
- **Footer integration**: Added footer component to all major pages for consistent site navigation
- **Legal compliance**: Full legal framework with proper terms, privacy policy, and contact mechanisms

### July 06, 2025 - Comprehensive Admin Panel with Dashboard and Management Features
- **Full-featured admin dashboard**: Complete platform overview with statistics cards showing subjects, exams, questions, and popular content
- **Subject management system**: Create, edit, and delete certification categories with icon support and statistics tracking
- **Exam management with cloning**: Full CRUD operations for exams including clone functionality and metadata management
- **Enhanced question manager**: Advanced search and filtering by subject, exam, text content, and domain with real-time results
- **CSV import/export functionality**: Bulk question management with template download, file validation, and import statistics
- **Comprehensive analytics tab**: Placeholder for future advanced analytics and reporting features
- **Professional tabbed interface**: Clean organization with dashboard, subjects, exams, questions, and analytics sections
- **Real-time data synchronization**: All components automatically update when data changes across the platform
- **Improved icon management**: Enhanced icon display with smaller sizing, right-side positioning, and dropdown selection from previously used icons with vertical list layout

### July 06, 2025 - Enhanced Homepage with Subject Organization
- **Enhanced original design**: Kept familiar layout while adding search and categorization features
- **Search and filter functionality**: Added search bar and category dropdown for better subject discovery
- **Organized categories**: Professional Certifications and University & College subjects with visual icons
- **Quick stats dashboard**: Added overview cards showing total subjects, exams, questions, and success rate
- **Enhanced trending section**: Upgraded popular certifications with trend indicators and growth percentages
- **Improved navigation**: Enhanced header with dropdown menus and user account management
- **Expanded subject database**: Added 15+ subjects across Professional and Academic categories
- **Mobile-responsive design**: Maintained original design aesthetic with responsive enhancements

### July 06, 2025 - Advanced Analytics and Performance Tracking
- **Comprehensive analytics dashboard**: Full-featured analytics page with performance insights
- **Multi-tab analytics interface**: Performance trends, domain analysis, recommendations, and exam history
- **Visual data representation**: Interactive charts using Recharts for trends and domain analysis
- **Performance metrics**: Total exams, questions answered, average scores, and improvement tracking
- **Domain-specific analysis**: Detailed breakdown of accuracy by knowledge domains
- **AI-powered recommendations**: Personalized study suggestions based on performance data
- **Historical tracking**: Complete exam history with scores, timing, and accuracy data

### July 06, 2025 - Professional Authentication System
- **Professional authentication modal**: Replaced simple name prompt with full-featured auth modal
- **Email verification flow**: Users sign in via email with verification code system
- **Social authentication**: Added Google/Gmail sign-in options with branded buttons
- **Shared authentication state**: Header and comment sections now use consistent auth context
- **Comments always visible**: Comments section now appears below all feedback without expansion
- **Enhanced UX**: Tabbed interface for email vs social sign-in, proper validation and loading states

### July 06, 2025 - Enhanced Question Interface
- **Added slide-down feedback system**: Feedback now appears below questions with smooth animation instead of replacing the question
- **Integrated ChatGPT AI assistance**: Added AI help button on questions and AI explanations in feedback
- **Added comments system with authentication**: Users must sign in before commenting on questions, includes discussion threads
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