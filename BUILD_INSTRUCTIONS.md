# 🚀 **Brainliest - Build & Development Instructions**

## 🔧 **Current System Architecture**

After recent updates, the project now uses:
- ✅ **Supabase PostgreSQL** (replaced Neon)
- ✅ **Secured Authentication System** (replaced old AuthContext)
- ✅ **Local Development** with Supabase CLI
- ✅ **Drizzle ORM** + **Supabase Client** integration

## 🏁 **Quick Start (New Setup)**

### **Prerequisites**
```bash
# Required tools
Node.js 18+
npm or yarn
Supabase CLI
```

### **1. Clone & Install Dependencies**
```bash
git clone <repository-url>
cd brainliest
npm install
```

### **2. Install Supabase CLI**
```bash
# macOS
brew install supabase/tap/supabase

# Alternative: NPM
npm install -g supabase
```

### **3. Start Local Supabase Stack**
```bash
supabase start
```

**This will provide:**
- 🔗 **API URL**: `http://127.0.0.1:54321`
- 🗄️ **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- 🎨 **Studio URL**: `http://127.0.0.1:54323`
- 📧 **Email Testing**: `http://127.0.0.1:54324`

### **4. Run Development Server**
```bash
# Start with all required environment variables
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU \
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
NODE_ENV=development \
npm run dev
```

**🎉 Application will be running at:** `http://127.0.0.1:5000`

## 🔧 **Build Process**

### **Development Build**
```bash
npm run dev          # Start development server with hot reload
```

### **Production Build**
```bash
npm run build        # Compile TypeScript and bundle assets
npm start           # Start production server
```

### **Build Components**
1. **Backend Build**: TypeScript compilation with `tsx`
2. **Frontend Build**: Vite bundling with React
3. **Database**: Supabase local instance with migrations
4. **Authentication**: Secured auth system with JWT

## 🌍 **Environment Configuration**

### **Development Environment**
Create `.env` file (optional - auto-generated in development):
```env
# Supabase Local Development
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

### **Production Environment**
```env
# Supabase Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
DATABASE_URL=postgresql://your-production-db-url

# Secure JWT Secrets
JWT_SECRET=your-secure-jwt-secret-min-32-chars-long
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-chars
ADMIN_JWT_SECRET=your-secure-admin-secret-min-32-chars-long
SESSION_SECRET=your-secure-session-secret-min-32-chars
```

## 🛠️ **Development Workflow**

### **Available Scripts**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database Operations
supabase db diff     # View schema changes
supabase db reset    # Reset local database
supabase gen types typescript --local > types/supabase.ts

# Supabase Services
supabase start       # Start local Supabase stack
supabase stop        # Stop local Supabase stack
supabase status      # Check service status
```

### **Database Management**
```bash
# View local database in browser
open http://127.0.0.1:54323

# Apply migrations
supabase db push

# Create new migration
supabase db diff --file=migration_name
```

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Authentication Errors**
```bash
# Error: "useAuth must be used within an AuthProvider"
# ✅ FIXED: All components now use useSecuredAuth
```

#### **2. Database Connection Issues**
```bash
# Error: "SUPABASE_URL must be set"
# Solution: Start Supabase first
supabase start
```

#### **3. Port Already in Use**
```bash
# Error: "Port 5000 is already in use"
# Solution: Use different port
PORT=3001 npm run dev
```

#### **4. Missing Dependencies**
```bash
# Error: "Cannot find package '@supabase/supabase-js'"
# Solution: Install dependencies
npm install @supabase/supabase-js postgres
```

#### **5. Build Errors**
```bash
# Clean build
rm -rf dist/ node_modules/
npm install
npm run build
```

### **macOS Specific Issues**
```bash
# Error: "listen ENOTSUP: operation not supported on socket"
# ✅ FIXED: Server now binds to 127.0.0.1 in development
```

## 🏗️ **Project Structure**

```
brainliest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── features/       # Feature modules
│   │   │   ├── auth/       # 🔐 Secured auth system
│   │   │   ├── admin/      # 👑 Admin components
│   │   │   ├── exam/       # 📝 Exam interface
│   │   │   └── shared/     # 🔄 Shared components
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── supabase-db.ts  # 🗄️ Database connection
│   │   └── routes.ts       # API routes
├── shared/                 # Shared types
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   ├── seed.sql          # Sample data
│   └── config.toml       # Supabase config
└── docs/                  # Documentation
```

## 🚀 **Deployment**

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

### **Environment Variables for Vercel**
Set these in Vercel Dashboard → Settings → Environment Variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://your-production-db-url
JWT_SECRET=your-secure-jwt-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
ADMIN_JWT_SECRET=your-secure-admin-secret
SESSION_SECRET=your-secure-session-secret
```

## 📊 **Performance & Monitoring**

### **Build Optimization**
- ✅ **Tree shaking** enabled
- ✅ **Code splitting** by route
- ✅ **Asset optimization** with Vite
- ✅ **TypeScript compilation** optimized

### **Database Performance**
- ✅ **Connection pooling** via Supabase
- ✅ **Query optimization** with Drizzle
- ✅ **Indexes** on frequently queried fields
- ✅ **RLS policies** for security

## 🎯 **Next Steps**

1. **Complete Google OAuth** integration
2. **Implement email verification** system
3. **Add payment processing** for premium features
4. **Enhance mobile** responsiveness
5. **Add comprehensive** testing suite

---

**🎉 Your Brainliest platform is ready for development!** 🚀

For more detailed guides, check the `/docs` folder or the main `README.md` file.