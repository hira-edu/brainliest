# Enterprise Architecture Guide

## Overview

This document provides a comprehensive guide to the enterprise-level architecture of the Brainliest exam preparation platform, following industry best practices and modern software engineering principles.

## Architecture Principles

### 1. **Domain-Driven Design (DDD)**
The codebase is organized around business domains:
- **Authentication**: User identity and access management
- **Content**: Subjects, exams, and questions management
- **Exam**: Test-taking experience and session management
- **Analytics**: Performance tracking and insights
- **Admin**: Platform administration and management

### 2. **Separation of Concerns**
Each layer has specific responsibilities:
- **Presentation Layer**: React components and UI logic
- **Business Logic Layer**: Controllers and service classes
- **Data Access Layer**: Database operations and external APIs
- **Infrastructure Layer**: Configuration and utilities

### 3. **Feature-Based Organization**
```
features/
├── auth/ (Authentication domain)
├── content/ (Content management domain)
├── exam/ (Exam taking domain)
├── analytics/ (Analytics domain)
├── admin/ (Administration domain)
└── shared/ (Cross-cutting concerns)
```

## Frontend Architecture

### **Component Hierarchy**

#### **Feature Components**
Located in `client/src/features/{domain}/components/`
- **Purpose**: Domain-specific business logic components
- **Examples**: `QuestionCard`, `ExamProgress`, `AuthModal`
- **Dependencies**: Can import from shared components and services

#### **Shared Components**
Located in `client/src/features/shared/components/`
- **Purpose**: Reusable components across features
- **Examples**: `Header`, `Footer`, `SEOHead`, `CookieConsentBanner`
- **Dependencies**: Should not depend on feature-specific logic

#### **UI Components**
Located in `client/src/components/ui/`
- **Purpose**: Pure UI components without business logic
- **Examples**: `Button`, `Input`, `Modal`, `Dropdown`
- **Dependencies**: Only design system and styling

### **State Management Strategy**

#### **Server State**
- **Tool**: TanStack Query (React Query)
- **Location**: `client/src/services/queryClient.ts`
- **Purpose**: API data caching and synchronization

#### **Client State**
- **Local State**: React useState for component-specific state
- **Shared State**: React Context for feature-specific shared state
- **Global State**: Minimal use of global context for authentication

#### **Form State**
- **Tool**: React Hook Form with Zod validation
- **Pattern**: Controller components with type-safe schemas
- **Validation**: Real-time validation with user-friendly error messages

### **Routing Architecture**

#### **Route Organization**
```typescript
// Feature-based route organization
/auth/* -> Authentication feature
/admin/* -> Admin feature
/exam/* -> Exam taking feature
/analytics/* -> Analytics feature
/content/* -> Content browsing feature
```

#### **Route Protection**
- **Authentication**: Route guards for protected pages
- **Authorization**: Role-based access control
- **Redirects**: Intelligent redirects based on user state

## Backend Architecture

### **Service Layer Pattern**

#### **Controllers**
Located in `src/server/controllers/`
```typescript
// Example: Authentication Controller
export class AuthController {
  async register(req: ApiRequest, res: ApiResponse) {
    // Validation, business logic delegation, response handling
  }
  
  async login(req: ApiRequest, res: ApiResponse) {
    // Authentication logic, token generation, cookie setting
  }
}
```

#### **Services**
Located in `src/server/services/`
```typescript
// Example: Authentication Service
export class AuthService {
  async register(email: string, password: string): Promise<RegisterResult> {
    // Business logic, database operations, external API calls
  }
  
  async validateUser(email: string, password: string): Promise<User | null> {
    // User validation, password checking, account status
  }
}
```

#### **Data Access Layer**
Located in `src/server/services/storage.service.ts`
```typescript
// Database operations with type safety
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    // Type-safe database queries using Drizzle ORM
  }
}
```

### **API Design Patterns**

#### **RESTful Endpoints**
```
GET    /api/subjects           # List all subjects
GET    /api/subjects/:id       # Get specific subject
POST   /api/subjects           # Create new subject
PUT    /api/subjects/:id       # Update subject
DELETE /api/subjects/:id       # Delete subject
```

#### **Request/Response Types**
```typescript
// Strongly typed API interfaces
interface ApiRequest<T = any> extends Request {
  body: T;
  user?: AuthenticatedUser;
}

interface ApiResponse<T = any> extends Response {
  json: (body: ApiSuccess<T> | ApiError) => this;
}
```

#### **Error Handling**
```typescript
// Consistent error response format
interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
```

## Database Architecture

### **Schema Organization**
Located in `src/shared/schemas/database.ts`

#### **Core Entities**
```sql
-- Users and Authentication
users (id, email, username, password_hash, role, created_at)
auth_sessions (id, user_id, token, expires_at)
auth_logs (id, user_id, action, ip_address, user_agent)

-- Content Management
subjects (id, name, description, category, icon)
exams (id, subject_id, title, description, difficulty)
questions (id, exam_id, text, options, correct_answer)

-- User Progress
user_sessions (id, user_id, exam_id, answers, score, completed_at)
detailed_answers (id, user_id, question_id, answer, is_correct)

-- Analytics
user_profiles (id, username, total_exams, average_score)
performance_trends (id, username, subject_id, weekly_score)
```

#### **Relationships**
- **One-to-Many**: User → Sessions, Subject → Exams, Exam → Questions
- **Many-to-Many**: Users ↔ Subjects (through sessions)
- **Self-referencing**: Categories (hierarchical structure)

### **Data Validation**
```typescript
// Zod schemas for runtime validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Type inference
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

## Security Architecture

### **Authentication & Authorization**

#### **JWT Token Strategy**
```typescript
// Secure token generation and validation
const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  JWT_SECRET,
  { expiresIn: '15m' }
);

const refreshToken = jwt.sign(
  { userId: user.id, tokenType: 'refresh' },
  REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

#### **Cookie Security**
```typescript
// Secure cookie configuration
ServerCookieService.setAuthCookie(res, 'authToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
});
```

#### **Role-Based Access Control**
```typescript
// Middleware for route protection
export const requireAuth = (requiredRole?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Token validation, role checking, request enhancement
  };
};
```

### **Input Validation & Sanitization**

#### **Request Validation**
```typescript
// Zod schema validation middleware
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    req.body = result.data;
    next();
  };
};
```

#### **SQL Injection Prevention**
- **Drizzle ORM**: Parameterized queries by default
- **Input Sanitization**: All user inputs validated and sanitized
- **Least Privilege**: Database user with minimal permissions

### **CORS & Security Headers**
```typescript
// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

## Performance Architecture

### **Frontend Optimization**

#### **Code Splitting**
```typescript
// Feature-based lazy loading
const AdminPanel = lazy(() => import('@/features/admin'));
const ExamInterface = lazy(() => import('@/features/exam'));

// Route-based splitting
<Route path="/admin" component={Suspense(AdminPanel)} />
```

#### **Asset Optimization**
```css
/* Critical CSS inlined */
/* Non-critical CSS loaded asynchronously */
/* Images optimized and lazy-loaded */
/* Icons delivered as optimized SVGs */
```

#### **Caching Strategy**
```typescript
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});
```

### **Backend Optimization**

#### **Database Performance**
```sql
-- Indexed columns for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
```

#### **API Response Optimization**
```typescript
// Pagination for large datasets
const getPaginatedResults = async (page: number, limit: number) => {
  return await db
    .select()
    .from(questions)
    .limit(limit)
    .offset((page - 1) * limit);
};

// Field selection to reduce payload
const getMinimalUser = async (id: number) => {
  return await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username
    })
    .from(users)
    .where(eq(users.id, id));
};
```

## Testing Architecture

### **Testing Strategy**

#### **Unit Tests**
- **Components**: React Testing Library + Jest
- **Services**: Jest with mocked dependencies
- **Utilities**: Pure function testing

#### **Integration Tests**
- **API Endpoints**: Supertest + Jest
- **Database Operations**: Test database with cleanup
- **Feature Workflows**: Cross-component integration

#### **End-to-End Tests**
- **User Journeys**: Playwright or Cypress
- **Authentication Flows**: Complete login/logout cycles
- **Exam Taking**: Full exam session simulation

### **Test Organization**
```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── features/
├── e2e/
│   ├── auth/
│   ├── exam/
│   └── admin/
└── fixtures/
    ├── users.ts
    ├── questions.ts
    └── mocks.ts
```

## Deployment Architecture

### **Environment Configuration**
```typescript
// Environment-specific settings
export const config = {
  development: {
    database: process.env.DEV_DATABASE_URL,
    cors: { origin: "http://localhost:3000" }
  },
  production: {
    database: process.env.DATABASE_URL,
    cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') }
  }
};
```

### **Build Process**
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --bundle --platform=node",
    "test": "jest && playwright test",
    "lint": "eslint . && prettier --check .",
    "deploy": "npm run build && npm run test && vercel deploy"
  }
}
```

### **Monitoring & Observability**
```typescript
// Error tracking and performance monitoring
import * as Sentry from '@sentry/node';

// API monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration
    });
  });
  next();
});
```

## Development Workflow

### **Feature Development Process**
1. **Design**: Define feature requirements and API contracts
2. **Schema**: Create/update database schema and types
3. **Backend**: Implement services and controllers
4. **Frontend**: Create components and pages
5. **Integration**: Connect frontend to backend
6. **Testing**: Unit, integration, and E2E tests
7. **Review**: Code review and quality assurance
8. **Deploy**: Staging deployment and production release

### **Code Quality Standards**
- **TypeScript**: Strict mode with comprehensive typing
- **ESLint**: Enforced code style and best practices
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

### **Documentation Standards**
- **Code Documentation**: JSDoc for complex functions
- **API Documentation**: OpenAPI/Swagger specifications
- **Architecture Documentation**: Living documentation in `/docs`
- **README**: Comprehensive setup and development guide

This architecture provides a scalable, maintainable, and secure foundation for the Brainliest platform while following industry best practices and enterprise standards.