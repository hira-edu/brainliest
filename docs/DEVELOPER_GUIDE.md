# Developer Guide - Enterprise Brainliest Platform

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Initialize database
npm run db:push

# Start development server
npm run dev
```

## Project Structure

### Feature-Based Architecture
```
client/src/features/
├── auth/           # Authentication & authorization
│   ├── components/ # Auth-specific UI components
│   ├── services/   # API calls and business logic
│   ├── pages/      # Auth-related pages
│   └── index.ts    # Feature barrel exports
├── admin/          # Admin panel functionality
├── exam/           # Exam taking experience
├── content/        # Content management
├── analytics/      # Performance tracking
└── shared/         # Cross-cutting concerns
```

### Backend Services
```
src/server/
├── controllers/    # Request handling and validation
├── services/       # Business logic and data operations
├── middleware/     # Request processing pipeline
├── config/         # Environment and database configuration
├── utils/          # Server-side utilities
└── types/          # API interface definitions
```

## Development Guidelines

### Component Development

#### Creating New Features
1. Create feature directory: `client/src/features/[feature-name]/`
2. Add required subdirectories: `components/`, `pages/`, `services/`, `hooks/`
3. Create barrel export: `index.ts`
4. Update main app routing in `App.tsx`

#### Component Structure
```typescript
// components/ExampleComponent.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useExampleHook } from '../hooks/useExample';

interface ExampleComponentProps {
  title: string;
  onAction: () => void;
}

export default function ExampleComponent({ 
  title, 
  onAction 
}: ExampleComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data, error } = useExampleHook();

  return (
    <div className="example-component">
      <h2>{title}</h2>
      <Button onClick={onAction} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
}
```

#### Barrel Exports
```typescript
// features/example/index.ts
export { default as ExampleComponent } from './components/ExampleComponent';
export { default as ExamplePage } from './pages/ExamplePage';
export { useExample } from './hooks/useExample';
export * from './services/exampleApi';
```

### Service Development

#### API Services
```typescript
// services/exampleApi.ts
import { apiRequest } from '@/services/queryClient';

export interface ExampleData {
  id: number;
  name: string;
  status: 'active' | 'inactive';
}

export const exampleApi = {
  getAll: (): Promise<ExampleData[]> =>
    apiRequest('/api/examples'),
    
  getById: (id: number): Promise<ExampleData> =>
    apiRequest(`/api/examples/${id}`),
    
  create: (data: Omit<ExampleData, 'id'>): Promise<ExampleData> =>
    apiRequest('/api/examples', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  update: (id: number, data: Partial<ExampleData>): Promise<ExampleData> =>
    apiRequest(`/api/examples/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  delete: (id: number): Promise<void> =>
    apiRequest(`/api/examples/${id}`, {
      method: 'DELETE'
    })
};
```

#### Backend Services
```typescript
// src/server/services/example.service.ts
import { db } from '../config/database';
import { examples } from '@shared/schemas/database';
import { eq } from 'drizzle-orm';

export class ExampleService {
  async getAll(): Promise<Example[]> {
    return await db.select().from(examples);
  }

  async getById(id: number): Promise<Example | undefined> {
    const [example] = await db
      .select()
      .from(examples)
      .where(eq(examples.id, id));
    return example;
  }

  async create(data: InsertExample): Promise<Example> {
    const [example] = await db
      .insert(examples)
      .values(data)
      .returning();
    return example;
  }

  async update(id: number, data: Partial<Example>): Promise<Example | undefined> {
    const [example] = await db
      .update(examples)
      .set(data)
      .where(eq(examples.id, id))
      .returning();
    return example;
  }

  async delete(id: number): Promise<void> {
    await db.delete(examples).where(eq(examples.id, id));
  }
}

export const exampleService = new ExampleService();
```

### Database Development

#### Schema Definition
```typescript
// src/shared/schemas/database.ts
import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const examples = pgTable('examples', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Zod schemas for validation
export const insertExampleSchema = createInsertSchema(examples);
export const selectExampleSchema = createSelectSchema(examples);

// TypeScript types
export type Example = typeof examples.$inferSelect;
export type InsertExample = typeof examples.$inferInsert;
```

#### Migrations
```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push

# Reset database (development only)
npm run db:reset
```

### Styling Guidelines

#### CSS Architecture
```css
/* styles/components/example-component.css */
.example-component {
  /* Use CSS variables for consistency */
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-md);
}

.example-component__header {
  /* BEM naming convention */
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.example-component--loading {
  /* State modifier */
  opacity: 0.6;
  pointer-events: none;
}
```

#### Tailwind Usage
```typescript
// Prefer Tailwind utility classes
<div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
  <h2 className="text-lg font-semibold mb-2">Title</h2>
  <p className="text-gray-600 dark:text-gray-300">Description</p>
</div>
```

### Testing Guidelines

#### Component Testing
```typescript
// __tests__/ExampleComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExampleComponent from '../ExampleComponent';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    renderWithProviders(
      <ExampleComponent title="Test Title" onAction={jest.fn()} />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const mockOnAction = jest.fn();
    renderWithProviders(
      <ExampleComponent title="Test" onAction={mockOnAction} />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', async () => {
    renderWithProviders(
      <ExampleComponent title="Test" onAction={jest.fn()} />
    );
    
    // Simulate loading state
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
```

#### API Testing
```typescript
// __tests__/api/examples.test.ts
import request from 'supertest';
import { app } from '../../src/server';
import { db } from '../../src/server/config/database';

describe('Examples API', () => {
  beforeEach(async () => {
    await db.delete(examples);
  });

  describe('GET /api/examples', () => {
    it('returns empty array when no examples exist', async () => {
      const response = await request(app)
        .get('/api/examples')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns examples when they exist', async () => {
      // Create test data
      await db.insert(examples).values({
        name: 'Test Example',
        description: 'Test Description'
      });

      const response = await request(app)
        .get('/api/examples')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Test Example');
    });
  });

  describe('POST /api/examples', () => {
    it('creates new example', async () => {
      const newExample = {
        name: 'New Example',
        description: 'New Description'
      };

      const response = await request(app)
        .post('/api/examples')
        .send(newExample)
        .expect(201);

      expect(response.body.name).toBe(newExample.name);
      expect(response.body.id).toBeDefined();
    });

    it('validates required fields', async () => {
      await request(app)
        .post('/api/examples')
        .send({})
        .expect(400);
    });
  });
});
```

## Common Patterns

### Form Handling
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertExampleSchema } from '@shared/schemas/database';

export default function ExampleForm() {
  const form = useForm({
    resolver: zodResolver(insertExampleSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const onSubmit = async (data: InsertExample) => {
    try {
      await exampleApi.create(data);
      toast.success('Example created successfully');
      form.reset();
    } catch (error) {
      toast.error('Failed to create example');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </Form>
  );
}
```

### Data Fetching
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleApi } from '../services/exampleApi';

export function useExamples() {
  return useQuery({
    queryKey: ['examples'],
    queryFn: exampleApi.getAll,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useExample(id: number) {
  return useQuery({
    queryKey: ['examples', id],
    queryFn: () => exampleApi.getById(id),
    enabled: !!id
  });
}

export function useCreateExample() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: exampleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
    }
  });
}

export function useUpdateExample() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Example> }) =>
      exampleApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
      queryClient.invalidateQueries({ queryKey: ['examples', id] });
    }
  });
}
```

### Error Handling
```typescript
// Global error boundary
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// API error handling
export const apiRequest = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

## Performance Best Practices

### Code Splitting
```typescript
// Lazy load feature components
const AdminPanel = lazy(() => import('@/features/admin'));
const AnalyticsDashboard = lazy(() => import('@/features/analytics'));

// Wrap in Suspense
<Suspense fallback={<div>Loading...</div>}>
  <AdminPanel />
</Suspense>
```

### Memoization
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return processLargeDataSet(data);
}, [data]);

// Callback memoization
const handleClick = useCallback((id: number) => {
  onItemClick(id);
}, [onItemClick]);

// Component memoization
const MemoizedComponent = memo(({ title, items }: Props) => {
  return (
    <div>
      <h3>{title}</h3>
      {items.map(item => <Item key={item.id} data={item} />)}
    </div>
  );
});
```

## Deployment

### Build Process
```bash
# Production build
npm run build

# Type checking
npm run check

# Linting
npm run lint

# Testing
npm run test

# Deploy to Vercel
npm run deploy
```

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://...
NODE_ENV=production

# Optional
GEMINI_API_KEY=your_api_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
RESEND_API_KEY=your_resend_key
```

This guide provides the foundation for developing features in the enterprise-grade Brainliest platform. Follow these patterns for consistency and maintainability.