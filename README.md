# 🧠 Brainliest - AI-Powered Learning Platform

## 🌟 **Project Overview**

Brainliest is an enterprise-grade, AI-powered learning platform that provides interactive exam preparation and analytics. Built with modern technologies including **Supabase**, **Drizzle ORM**, **React**, and **TypeScript**.

## 🏗️ **Architecture**

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Authentication**: Secured role-based system (user/admin/moderator/super_admin)
- **Real-time**: Supabase subscriptions
- **Deployment**: Vercel serverless functions

## 🚀 **Quick Start Guide**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase CLI (for local development)

### **1. Clone & Install**
```bash
git clone <repository-url>
cd brainliest
npm install
```

### **2. Set Up Local Supabase**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase stack
supabase start

# This will give you:
# - API URL: http://127.0.0.1:54321
# - Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - Studio URL: http://127.0.0.1:54323
```

### **3. Configure Environment**
Create a `.env` file with:
```env
# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# JWT Secrets (auto-generated in development)
JWT_SECRET=your-jwt-secret-min-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=your-admin-secret-min-32-chars-long
SESSION_SECRET=your-session-secret-min-32-chars

# Optional Services
GEMINI_API_KEY=your-gemini-api-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
```

### **4. Run Development Server**
```bash
# Start with Supabase environment
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU \
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
NODE_ENV=development \
npm run dev
```

**🎉 Your app will be running at:** `http://127.0.0.1:5000`

## 📱 **Key Features**

### **🔐 Authentication System**
- **Role-based access control** (user/admin/moderator/super_admin)
- **JWT-based authentication** with refresh tokens
- **Route protection** for admin areas
- **Session management** with automatic cleanup

### **📊 Database & Analytics**
- **Supabase PostgreSQL** with real-time subscriptions
- **Drizzle ORM** for type-safe database operations
- **Row Level Security (RLS)** policies
- **Advanced analytics** with performance tracking

### **🎯 Exam System**
- **Interactive question interface**
- **Real-time progress tracking**
- **AI-powered explanations** (Gemini API)
- **Freemium model** with question limits

### **🎨 Modern UI/UX**
- **Responsive design** with TailwindCSS
- **Component library** with shadcn/ui
- **Dark/light mode** support
- **Mobile-first** approach

## 🔧 **Development Workflow**

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run db:push     # Push database schema
npm run db:studio   # Open database studio
```

### **Database Operations**
```bash
# View local database
supabase db diff

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

## 🚦 **Project Status**

### ✅ **Completed**
- ✅ **Supabase integration** with local development
- ✅ **Authentication system** migration and fixes
- ✅ **Database schema** with proper relationships
- ✅ **Responsive UI** with modern components
- ✅ **API endpoints** for all core features
- ✅ **Real-time subscriptions** ready
- ✅ **Build system** optimized for production

### 🔄 **In Progress**
- 🔄 **Google OAuth integration**
- 🔄 **Email verification system**
- 🔄 **Advanced analytics dashboard**
- 🔄 **Mobile app development**

### 📋 **Todo**
- 📋 **User registration workflow**
- 📋 **Payment integration**
- 📋 **Advanced AI features**
- 📋 **Performance optimizations**

## 📁 **Project Structure**

```
brainliest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific code
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes.ts       # API routes
│   │   └── supabase-db.ts  # Database connection
├── shared/                 # Shared types and schemas
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   └── seed.sql          # Sample data
└── docs/                  # Documentation
```

## 🛠️ **Technical Stack**

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Wouter** for routing
- **React Query** for data fetching
- **Lucide** icons

### **Backend**
- **Node.js + Express** with TypeScript
- **Drizzle ORM** for database operations
- **Supabase client** for real-time features
- **JWT** for authentication
- **Zod** for validation

### **Database**
- **Supabase PostgreSQL**
- **Row Level Security** policies
- **Real-time subscriptions**
- **Automated backups**

## 🚀 **Deployment**

### **Production Deployment**
1. **Push to Vercel**: `vercel --prod`
2. **Set environment variables** in Vercel dashboard
3. **Configure Supabase** production instance
4. **Run migrations**: `npm run db:push`

### **Environment Variables for Production**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://your-production-db-url
JWT_SECRET=your-secure-jwt-secret
# ... other production secrets
```

## 📞 **Support & Contributing**

### **Getting Help**
- 📚 Check `/docs` folder for detailed guides
- 🐛 Report issues in GitHub Issues
- 💬 Join our Discord community

### **Contributing**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎯 Ready to build the future of learning? Let's go!** 🚀 