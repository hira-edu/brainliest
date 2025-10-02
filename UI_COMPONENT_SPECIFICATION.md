> **Guardrail Notice**  
> This specification is subordinate to [.ai-guardrails](.ai-guardrails), [PROJECT_MANIFEST.md](PROJECT_MANIFEST.md), and [COMPLETE_BUILD_SPECIFICATION.md](COMPLETE_BUILD_SPECIFICATION.md). Review these documents and [docs/architecture/guardrails.md](docs/architecture/guardrails.md) before making changes.

## Related Documents
- [.ai-guardrails](.ai-guardrails)
- [PROJECT_MANIFEST.md](PROJECT_MANIFEST.md)
- [COMPLETE_BUILD_SPECIFICATION.md](COMPLETE_BUILD_SPECIFICATION.md)
- [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md)
- [docs/architecture/guardrails.md](docs/architecture/guardrails.md)

# UI Component Library Specification — Brainliest Platform

**Version:** 2.0.0
**Last Updated:** 2025-10-02
**Status:** 🔒 LOCKED — Component Design Contract

> **⚠️ MASTER DOCUMENT REFERENCE:**
> This document is governed by **`PROJECT_MANIFEST.md`**
> See `PROJECT_MANIFEST.md` for AI guardrails, cross-references, and modification policies.
> **Any AI must read `PROJECT_MANIFEST.md` FIRST before creating components.**
>
> **📖 COMPANION DOCUMENTS:**
> - `COMPLETE_BUILD_SPECIFICATION.md` — Technical implementation contract
> - `ARCHITECTURE_BLUEPRINT.md` — System architecture
> - `PROJECT_MANIFEST.md` — Master guardrails

---

## 🎯 PURPOSE

Define the **complete, reusable, 100% modular component library** for Brainliest platform with:
- ✅ **Zero duplication** — Check existing components before creating new ones
- ✅ **100% responsive** — Mobile-first, accessible design
- ✅ **Fully modular** — Each component is independent and composable
- ✅ **Design system** — Consistent tokens, spacing, typography
- ✅ **Accessibility** — WCAG 2.1 AA compliant
- ✅ **Type-safe** — Strict TypeScript, no `any`

---

## 📋 TABLE OF CONTENTS

1. [Component Creation Rules](#component-creation-rules)
2. [Design System Tokens](#design-system-tokens)
3. [Component Registry](#component-registry)
4. [Primitive Components](#primitive-components)
5. [Composite Components](#composite-components)
6. [Layout Components](#layout-components)
7. [Form Components](#form-components)
8. [Data Display Components](#data-display-components)
9. [Feedback Components](#feedback-components)
10. [Navigation Components](#navigation-components)
11. [Domain-Specific Components](#domain-specific-components)
12. [Responsive Patterns](#responsive-patterns)
13. [Accessibility Requirements](#accessibility-requirements)
14. [Component Testing](#component-testing)
15. [Storybook Stories](#storybook-stories)

---

## 🚫 COMPONENT CREATION RULES

### MANDATORY: Pre-Creation Checklist

Before creating ANY component, AI **MUST**:

1. **Search Existing Components**
   ```bash
   # Search for similar components
   rg -i "component.*{componentName}" packages/ui/src/
   rg -i "export.*{ComponentName}" packages/ui/src/

   # Check component registry
   cat packages/ui/src/index.ts | grep -i {componentName}
   ```

2. **Verify Component Doesn't Exist**
   - [ ] Not in `packages/ui/src/primitives/`
   - [ ] Not in `packages/ui/src/composites/`
   - [ ] Not in `packages/ui/src/layout/`
   - [ ] Not in `packages/ui/src/forms/`
   - [ ] Not in `packages/ui/src/feedback/`
   - [ ] Not in `packages/ui/src/navigation/`

3. **Check for Similar Functionality**
   - [ ] Is this a variant of an existing component?
   - [ ] Can existing component be extended with props?
   - [ ] Should this be a composition of existing components?

4. **Verify Design Token Usage**
   - [ ] Uses tokens from `packages/ui/src/theme/tokens.ts`
   - [ ] No hardcoded colors/spacing/typography
   - [ ] Follows responsive breakpoint system

5. **Confirm Accessibility Requirements**
   - [ ] ARIA labels defined
   - [ ] Keyboard navigation supported
   - [ ] Focus management handled
   - [ ] Screen reader tested

### Component Location Rules

| Component Type | Location | Naming |
|----------------|----------|--------|
| **Primitives** | `packages/ui/src/primitives/` | Single responsibility, atomic |
| **Composites** | `packages/ui/src/composites/` | Multiple primitives combined |
| **Layout** | `packages/ui/src/layout/` | Structure and positioning |
| **Forms** | `packages/ui/src/forms/` | Input and validation |
| **Feedback** | `packages/ui/src/feedback/` | User feedback (toasts, alerts) |
| **Navigation** | `packages/ui/src/navigation/` | Navigation patterns |
| **Domain** | `apps/web/src/components/` or `apps/admin/src/components/` | App-specific |

### Forbidden Component Patterns

```typescript
// ❌ FORBIDDEN: Default export
export default function Button() { ... }

// ✅ REQUIRED: Named export
export function Button(props: ButtonProps) { ... }

// ❌ FORBIDDEN: Importing data/business logic
import { db } from '@brainliest/db';
import { questionService } from '@brainliest/shared/services';

// ✅ REQUIRED: Props-driven, data from parent
export function QuestionCard({ question }: { question: QuestionDto }) { ... }

// ❌ FORBIDDEN: Hardcoded values
const color = '#3B82F6';
const spacing = '16px';

// ✅ REQUIRED: Design tokens
import { colors, spacing } from '@/theme/tokens';
const color = colors.primary[500];
const gap = spacing[4];

// ❌ FORBIDDEN: any type
function Component(props: any) { ... }

// ✅ REQUIRED: Strict types
interface ComponentProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
}
export function Component(props: ComponentProps) { ... }
```

---

## 🎨 DESIGN SYSTEM TOKENS

### Location
**File:** `packages/ui/src/theme/tokens.ts`
**SSOT:** This is the ONLY place for design values

### Token Structure

```typescript
// packages/ui/src/theme/tokens.ts

export const colors = {
  // Brand colors
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Primary brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    900: '#14532D',
  },
  // Semantic colors
  success: {
    light: '#86EFAC',
    DEFAULT: '#22C55E',
    dark: '#15803D',
  },
  error: {
    light: '#FCA5A5',
    DEFAULT: '#EF4444',
    dark: '#B91C1C',
  },
  warning: {
    light: '#FCD34D',
    DEFAULT: '#F59E0B',
    dark: '#B45309',
  },
  info: {
    light: '#93C5FD',
    DEFAULT: '#3B82F6',
    dark: '#1E40AF',
  },
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Background colors
  background: {
    DEFAULT: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
```

### Tailwind Configuration

```typescript
// packages/ui/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { colors, spacing, typography, borderRadius, shadows, breakpoints } from './src/theme/tokens';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      borderRadius,
      boxShadow: shadows,
      screens: breakpoints,
    },
  },
  plugins: [],
};

export default config;
```

---

## 📚 COMPONENT REGISTRY

### Current Components (SSOT)

**File:** `packages/ui/src/index.ts`

```typescript
// Primitives
export { Button } from './primitives/button';
export { Input } from './primitives/input';
export { Textarea } from './primitives/textarea';
export { Select } from './primitives/select';
export { Checkbox } from './primitives/checkbox';
export { Radio } from './primitives/radio';
export { Switch } from './primitives/switch';
export { Badge } from './primitives/badge';
export { Avatar } from './primitives/avatar';
export { Spinner } from './primitives/spinner';
export { Icon } from './primitives/icon';
export { Link } from './primitives/link';

// Layout
export { Container } from './layout/container';
export { Grid } from './layout/grid';
export { Stack } from './layout/stack';
export { Divider } from './layout/divider';
export { Card } from './layout/card';
export { Section } from './layout/section';

// Composites
export { Modal } from './composites/modal';
export { Dialog } from './composites/dialog';
export { Dropdown } from './composites/dropdown';
export { Tooltip } from './composites/tooltip';
export { Popover } from './composites/popover';
export { Tabs } from './composites/tabs';
export { Accordion } from './composites/accordion';
export { Table } from './composites/table';
export { Pagination } from './composites/pagination';
export { SearchableSelect } from './composites/searchable-select';
export { CommandPalette } from './composites/command-palette';
export { DataGrid } from './composites/data-grid';

// Forms
export { Form } from './forms/form';
export { FormField } from './forms/form-field';
export { FormError } from './forms/form-error';
export { FormLabel } from './forms/form-label';
export { FormSection } from './forms/form-section';

// Feedback
export { Alert } from './feedback/alert';
export { Toast } from './feedback/toast';
export { Progress } from './feedback/progress';
export { Skeleton } from './feedback/skeleton';
export { EmptyState } from './feedback/empty-state';

// Navigation
export { Breadcrumbs } from './navigation/breadcrumbs';
export { Sidebar } from './navigation/sidebar';
export { Header } from './navigation/header';
export { Footer } from './navigation/footer';
export { Menu } from './navigation/menu';
export { MenuButton } from './navigation/menu-button';

// Hooks
export { useMediaQuery } from './hooks/use-media-query';
export { useClipboard } from './hooks/use-clipboard';
export { usePagination } from './hooks/use-pagination';
export { useDisclosure } from './hooks/use-disclosure';
export { useKeyboardShortcut } from './hooks/use-keyboard-shortcut';

// Types
export type * from './types';
```

### Before Creating New Component

**AI MUST execute:**

```bash
# 1. Check if component exists
grep -i "ComponentName" packages/ui/src/index.ts

# 2. Search for similar components
rg -i "ComponentName|component-name" packages/ui/src/

# 3. Check both apps for duplicates
rg -i "ComponentName|component-name" apps/web/src/components/
rg -i "ComponentName|component-name" apps/admin/src/components/

# 4. If found: STOP and reuse existing component
# 5. If not found: Proceed with creation following this spec
```

---

## 🧱 PRIMITIVE COMPONENTS

### Button

**Location:** `packages/ui/src/primitives/button.tsx`

```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Spinner } from './spinner';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
        danger: 'bg-error-DEFAULT text-white hover:bg-error-dark focus-visible:ring-error-DEFAULT',
        success: 'bg-success-DEFAULT text-white hover:bg-success-dark focus-visible:ring-success-DEFAULT',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-base rounded-lg gap-2',
        lg: 'h-12 px-6 text-lg rounded-lg gap-2.5',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, fullWidth, className })}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'sm' ? 'xs' : 'sm'} />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Storybook:** `packages/ui/src/primitives/button.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const WithLoading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading...',
    isLoading: true,
  },
};

export const WithIcons: Story = {
  args: {
    variant: 'primary',
    children: 'Button with Icons',
    leftIcon: <span>←</span>,
    rightIcon: <span>→</span>,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};
```

**Test:** `packages/ui/src/primitives/button.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-error-DEFAULT');
  });

  it('is keyboard accessible', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press me</Button>);

    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Input

**Location:** `packages/ui/src/primitives/input.tsx`

```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      state: {
        default: '',
        error: 'border-error-DEFAULT focus-visible:ring-error-DEFAULT',
        success: 'border-success-DEFAULT focus-visible:ring-success-DEFAULT',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, state, leftAddon, rightAddon, ...props }, ref) => {
    if (leftAddon || rightAddon) {
      return (
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-500">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            className={inputVariants({
              size,
              state,
              className: `${leftAddon ? 'pl-10' : ''} ${rightAddon ? 'pr-10' : ''}`,
            })}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-gray-500">
              {rightAddon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={inputVariants({ size, state, className })}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

### Card

**Location:** `packages/ui/src/layout/card.tsx`

```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg border bg-white transition-shadow',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        outlined: 'border-2 border-gray-300',
        elevated: 'border-gray-200 shadow-md hover:shadow-lg',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, header, footer, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cardVariants({ variant, className })} {...props}>
        {header && (
          <div className={`border-b border-gray-200 ${padding === 'md' ? 'px-6 py-4' : padding === 'lg' ? 'px-8 py-5' : 'px-4 py-3'}`}>
            {header}
          </div>
        )}
        <div className={cardVariants({ padding })}>
          {children}
        </div>
        {footer && (
          <div className={`border-t border-gray-200 ${padding === 'md' ? 'px-6 py-4' : padding === 'lg' ? 'px-8 py-5' : 'px-4 py-3'}`}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';
```

---

## 🎭 COMPOSITE COMPONENTS

### Modal

**Location:** `packages/ui/src/composites/modal.tsx`

```typescript
import { Fragment, forwardRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../primitives/button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      footer,
      size = 'md',
      closeOnOverlayClick = true,
    },
    ref
  ) => {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-modal"
          onClose={closeOnOverlayClick ? onClose : () => {}}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  ref={ref}
                  className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all`}
                >
                  {title && (
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-2"
                    >
                      {title}
                    </Dialog.Title>
                  )}
                  {description && (
                    <Dialog.Description className="text-sm text-gray-600 mb-4">
                      {description}
                    </Dialog.Description>
                  )}

                  <div className="mt-4">{children}</div>

                  {footer && (
                    <div className="mt-6 flex justify-end gap-3">
                      {footer}
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }
);

Modal.displayName = 'Modal';
```

### SearchableSelect

**Location:** `packages/ui/src/composites/searchable-select.tsx`

```typescript
import { useState, useMemo } from 'react';
import { Combobox } from '@headlessui/react';
import { Input } from '../primitives/input';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  searchPlaceholder = 'Search...',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (query === '') return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  return (
    <Combobox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Combobox.Input
          as={Input}
          placeholder={placeholder}
          displayValue={() => selectedOption?.label ?? ''}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Combobox.Button>

        <Combobox.Options className="absolute z-dropdown mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
          ) : (
            filteredOptions.map((option) => (
              <Combobox.Option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 px-4 ${
                    active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                  } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`
                }
              >
                {({ selected }) => (
                  <span className={selected ? 'font-semibold' : 'font-normal'}>
                    {option.label}
                  </span>
                )}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}
```

---

## 📱 RESPONSIVE PATTERNS

### Mobile-First Approach

**All components MUST:**

1. **Start with mobile styles** (no breakpoint prefix)
2. **Add larger breakpoints progressively** (sm:, md:, lg:, xl:)
3. **Test on all breakpoints** (320px, 640px, 768px, 1024px, 1280px)

```typescript
// ✅ CORRECT: Mobile-first
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Column 1</div>
  <div className="w-full md:w-1/2">Column 2</div>
</div>

// ❌ WRONG: Desktop-first
<div className="flex flex-row md:flex-col gap-4">
  ...
</div>
```

### Responsive Component Example

```typescript
// packages/ui/src/layout/responsive-grid.tsx
export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: keyof typeof spacing;
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
}: ResponsiveGridProps) {
  return (
    <div
      className={`
        grid
        grid-cols-${cols.mobile}
        md:grid-cols-${cols.tablet}
        lg:grid-cols-${cols.desktop}
        gap-${gap}
      `}
    >
      {children}
    </div>
  );
}
```

### Breakpoint Hook

```typescript
// packages/ui/src/hooks/use-media-query.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Usage
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return { isMobile, isTablet, isDesktop };
}
```

---

## ♿ ACCESSIBILITY REQUIREMENTS

### Mandatory ARIA Attributes

Every interactive component MUST have:

1. **`aria-label`** or **`aria-labelledby`** for screen readers
2. **`role`** attribute when semantic HTML isn't sufficient
3. **`aria-describedby`** for additional context
4. **`aria-invalid`** and **`aria-errormessage`** for form errors
5. **`aria-expanded`**, **`aria-haspopup`** for interactive elements

### Keyboard Navigation

All components MUST support:

- ✅ **Tab** navigation
- ✅ **Enter/Space** activation
- ✅ **Escape** to close modals/dropdowns
- ✅ **Arrow keys** for lists/grids
- ✅ **Focus visible** states

### Example: Accessible Button

```typescript
<button
  type="button"
  aria-label="Close modal"
  aria-describedby="modal-description"
  className="focus-visible:ring-2 focus-visible:ring-primary-500"
  onClick={onClose}
>
  <Icon name="x" aria-hidden="true" />
</button>
```

### Focus Management

```typescript
// packages/ui/src/hooks/use-focus-trap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    };

    element.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleTab);
  }, []);

  return ref;
}
```

---

## 🧪 COMPONENT TESTING

### Test Requirements

Every component MUST have:

1. **Render test** — Verifies component renders without crashing
2. **Props test** — Verifies all props work correctly
3. **Interaction test** — Verifies user interactions (click, keyboard)
4. **Accessibility test** — Verifies ARIA attributes and keyboard nav
5. **Variant test** — Verifies all variants render correctly

### Test Template

```typescript
// packages/ui/src/primitives/component-name.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentName } from './component-name';

describe('ComponentName', () => {
  // 1. Render test
  it('renders without crashing', () => {
    render(<ComponentName>Content</ComponentName>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  // 2. Props test
  it('applies custom className', () => {
    render(<ComponentName className="custom-class">Content</ComponentName>);
    expect(screen.getByText('Content')).toHaveClass('custom-class');
  });

  // 3. Interaction test
  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick}>Click me</ComponentName>);

    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // 4. Accessibility test
  it('has no accessibility violations', async () => {
    const { container } = render(<ComponentName>Content</ComponentName>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is keyboard accessible', async () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick}>Press me</ComponentName>);

    screen.getByText('Press me').focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });

  // 5. Variant test
  it.each(['primary', 'secondary', 'outline'] as const)(
    'renders %s variant correctly',
    (variant) => {
      render(<ComponentName variant={variant}>Content</ComponentName>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    }
  );
});
```

---

## 📖 STORYBOOK STORIES

### Story Template

```typescript
// packages/ui/src/primitives/component-name.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './component-name';

const meta: Meta<typeof ComponentName> = {
  title: 'Primitives/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
      description: 'Visual variant of the component',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    children: 'Default Component',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ComponentName variant="primary">Primary</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
      <ComponentName variant="outline">Outline</ComponentName>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Customizable Component',
  },
};
```

---

## 🎯 COMPONENT CHECKLIST

Before submitting a new component, verify:

### Design
- [ ] Uses design tokens (no hardcoded values)
- [ ] Follows mobile-first responsive approach
- [ ] Supports all specified variants
- [ ] Includes dark mode support (if applicable)
- [ ] Matches Figma designs (if available)

### Code Quality
- [ ] TypeScript strict mode (no `any`)
- [ ] Proper prop types with JSDoc comments
- [ ] ForwardRef for DOM access
- [ ] DisplayName set for debugging
- [ ] Class variance authority for variants

### Functionality
- [ ] All props work as expected
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Disabled states styled correctly
- [ ] Event handlers properly typed

### Accessibility
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] Screen reader tested
- [ ] No accessibility violations (axe)

### Testing
- [ ] Unit tests written (>80% coverage)
- [ ] Interaction tests included
- [ ] Accessibility tests passing
- [ ] Storybook stories created
- [ ] Visual regression tests (if applicable)

### Documentation
- [ ] JSDoc comments on props
- [ ] Usage examples in Storybook
- [ ] Exported from package index
- [ ] Added to component registry above

---

## 📚 DOMAIN-SPECIFIC COMPONENTS

Components specific to Brainliest domain should be created in **app directories**, NOT in `packages/ui`:

### Question Components
**Location:** `apps/web/src/components/question/`

- `question-card.tsx` — Display question with options
- `question-option.tsx` — Single option display
- `question-explanation.tsx` — AI explanation display
- `question-timer.tsx` — Exam timer component
- `question-progress.tsx` — Progress indicator

### Exam Components
**Location:** `apps/web/src/components/exam/`

- `exam-card.tsx` — Exam overview card
- `exam-session-panel.tsx` — Active session controls
- `exam-results-summary.tsx` — Results display
- `exam-score-gauge.tsx` — Visual score display

### Admin Components
**Location:** `apps/admin/src/components/`

- `import-wizard.tsx` — Question import flow
- `question-editor.tsx` — Rich question editor
- `category-tree.tsx` — Taxonomy tree view
- `audit-log-viewer.tsx` — Audit trail display

---

## ✅ FINAL CHECKLIST FOR AI

Before creating ANY component:

```bash
# 1. Search for existing component
grep -ri "ComponentName" packages/ui/src/

# 2. If found: STOP - Reuse existing component
# 3. If not found: Verify this spec
# 4. Create component following template above
# 5. Write tests (>80% coverage)
# 6. Create Storybook story
# 7. Export from package index
# 8. Add to component registry in this document
# 9. Run quality gates
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

---

**END OF UI COMPONENT SPECIFICATION**

*This document is the SSOT for all UI components. All components must be created following these specifications exactly.*

**Last Updated:** 2025-10-02
**Version:** 2.0.0 LOCKED
**Governed by:** PROJECT_MANIFEST.md
