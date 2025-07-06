# 🧠 Brainliest - Comprehensive Exam Preparation Platform

A modern, AI-powered exam preparation platform built with React, Node.js, and PostgreSQL. Designed for professional certifications (PMP, AWS, CompTIA) and university subjects across multiple disciplines.

## ✨ Features

### 🎯 Core Functionality
- **47+ Subjects** across Professional Certifications and University categories
- **Multi-exam practice** with real-time feedback and explanations
- **AI-powered assistance** using Google Gemini for hints and detailed explanations
- **Progress tracking** with comprehensive analytics and performance insights
- **User authentication** with role-based access control
- **Responsive design** optimized for all devices

### 📊 Admin Panel
- **Complete dashboard** with platform statistics and insights
- **Subject management** with categorization and icon support
- **Exam creation and cloning** with metadata management
- **Question bank management** with CSV import/export functionality
- **User management** with ban/unban capabilities and role control
- **Advanced search and filtering** across all content types

### 🤖 AI Integration
- **Question assistance** powered by Google Gemini
- **Detailed explanations** for both correct and incorrect answers
- **Contextual hints** without revealing the answer
- **Smart recommendations** based on performance data

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/brainliest)

### Environment Variables Required:
```bash
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_32_character_random_string
GOOGLE_GEMINI_API_KEY=your_gemini_api_key  # Optional but recommended
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** for persistent data storage
- **Google Gemini AI** for intelligent features

### Infrastructure
- **Vercel** for serverless deployment
- **Neon/Railway/Supabase** for managed PostgreSQL
- **GitHub** for version control and CI/CD

## 📁 Project Structure

```
brainliest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express.js backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── ai.ts              # AI integration
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── vercel.json            # Vercel deployment configuration
└── GITHUB_VERCEL_DEPLOYMENT.md  # Detailed deployment guide
```

## 🎓 Academic Subjects Coverage

### Professional Certifications
- **IT & Cloud Computing**: AWS, CompTIA, Azure, Google Cloud
- **Project Management**: PMP, Agile, Scrum Master
- **Cybersecurity**: CISSP, Security+, CEH
- **Networking**: CCNA, Network+, CCIE

### University & College
- **Mathematics & Statistics**: Calculus, Linear Algebra, Statistics, Discrete Math
- **Computer Science**: Programming, Data Structures, Algorithms, Database Design
- **Natural Sciences**: Physics, Chemistry, Biology, Astronomy
- **Engineering**: Mechanical, Electrical, Civil Engineering
- **Business & Economics**: Accounting, Finance, Economics, Business Administration
- **Health & Medical**: Nursing, Pharmacology, Medical Sciences, HESI, TEAS
- **Social Sciences**: Psychology, History, Philosophy, Political Science
- **Test Preparation**: GRE, LSAT, TOEFL, GED

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Google Gemini API key (optional)

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/brainliest.git
cd brainliest

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your database URL and secrets in .env

# Deploy database schema
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:5000` to see the application.

## 📊 Database Schema

The application uses PostgreSQL with these main tables:
- `subjects` - Certification categories and academic subjects
- `exams` - Practice exam sets within each subject  
- `questions` - Multiple-choice questions with explanations
- `users` - User accounts with role-based access
- `user_sessions` - Exam session tracking and progress
- `comments` - Question discussions and community features

## 🔐 Security Features

- **Session management** with PostgreSQL-backed sessions
- **Role-based access control** (Student, Instructor, Admin)
- **Input validation** with Zod schemas
- **SQL injection protection** through Drizzle ORM
- **Environment variable protection** for sensitive data

## 📈 Performance & Monitoring

- **Health check endpoint**: `/api/health`
- **Database connection monitoring**
- **Automatic error handling** and logging
- **Optimized builds** with Vite and esbuild
- **CDN delivery** through Vercel Edge Network

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Deployment Guide](GITHUB_VERCEL_DEPLOYMENT.md)
- 🏥 Health Check: `/api/health`
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/brainliest/issues)

## 🌟 Acknowledgments

- Built with modern web technologies and best practices
- AI features powered by Google Gemini
- UI components from Radix UI and shadcn/ui
- Database hosted on Neon/Railway/Supabase
- Deployed on Vercel for global performance

---

**Ready to help students and professionals ace their exams with AI-powered preparation!** 🚀