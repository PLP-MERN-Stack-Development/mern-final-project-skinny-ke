# CollabTask - Design System & Component Library

## 🎨 Design System Overview

### Design Principles
1. **Consistency**: Unified visual language across all components
2. **Accessibility**: WCAG 2.1 AA compliance as minimum standard
3. **Scalability**: Components work at any scale, from mobile to desktop
4. **Performance**: Optimized for fast loading and smooth interactions
5. **Flexibility**: Customizable components that adapt to brand requirements

### Visual Hierarchy
- **Primary Colors**: Brand identity and key actions
- **Secondary Colors**: Supporting elements and states
- **Neutral Colors**: Text, backgrounds, and borders
- **Semantic Colors**: Success, warning, error states

---

## 🌈 Color Palette

### Primary Colors
```css
/* Primary Brand Colors */
--color-primary-50: #eff6ff;    /* Lightest */
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;   /* Main brand color */
--color-primary-600: #2563eb;   /* Primary action */
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;   /* Darkest */

/* Usage Guidelines */
.primary-600: Primary actions, main CTAs, active states
.primary-500: Brand elements, selected states
.primary-700: Hover states for primary actions
```

### Semantic Colors
```css
/* Success Colors */
--color-success-50: #f0fdf4;
--color-success-100: #dcfce7;
--color-success-500: #22c55e;
--color-success-600: #16a34a;
--color-success-700: #15803d;

/* Warning Colors */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
--color-warning-700: #b45309;

/* Error Colors */
--color-error-50: #fef2f2;
--color-error-100: #fee2e2;
--color-error-500: #ef4444;
--color-error-600: #dc2626;
--color-error-700: #b91c1c;

/* Info Colors */
--color-info-50: #f0f9ff;
--color-info-100: #e0f2fe;
--color-info-500: #06b6d4;
--color-info-600: #0891b2;
--color-info-700: #0e7490;
```

### Neutral Colors
```css
/* Gray Scale */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;

/* Usage Guidelines */
gray-900: Primary text, headings
gray-700: Secondary text, icons
gray-500: Placeholder text, disabled elements
gray-300: Borders, dividers
gray-100: Light backgrounds, hover states
gray-50: Card backgrounds, form fields
```

### Color Usage Examples
```css
/* Button Color Mapping */
.btn-primary {
  background: var(--color-primary-600);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-700);
}

/* Status Indicators */
.status-success {
  background: var(--color-success-100);
  color: var(--color-success-700);
  border: 1px solid var(--color-success-200);
}

.status-warning {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
  border: 1px solid var(--color-warning-200);
}

.status-error {
  background: var(--color-error-100);
  color: var(--color-error-700);
  border: 1px solid var(--color-error-200);
}
```

---

## 📝 Typography System

### Font Stack
```css
/* Primary Font Stack */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                    Roboto, sans-serif;

/* Monospace Font Stack */
--font-family-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 
                    Monaco, 'Cascadia Code', monospace;

/* Display Font Stack */
--font-family-display: 'Poppins', 'Inter', sans-serif;
```

### Type Scale
```css
/* Heading Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Typography Classes
```css
/* Heading Styles */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--color-gray-900);
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--color-gray-900);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--color-gray-800);
}

/* Body Text */
.body-large {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--color-gray-700);
}

.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-gray-700);
}

.body-small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-gray-600);
}

/* Utility Classes */
.text-caption {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--color-gray-700);
}
```

---

## 📐 Spacing & Layout System

### Spacing Scale
```css
/* Spacing Units (8px base) */
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
```

### Grid System
```css
/* Container Sizes */
--container-sm: 640px;   /* Small screens */
--container-md: 768px;   /* Medium screens */
--container-lg: 1024px;  /* Large screens */
--container-xl: 1280px;  /* Extra large screens */
--container-2xl: 1536px; /* 2X large screens */

/* Grid Template */
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }

/* Flexbox Utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: var(--space-2); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
```

### Layout Components
```css
/* Container */
.container {
  width: 100%;
  max-width: var(--container-lg);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.container-sm {
  max-width: var(--container-sm);
}

.container-md {
  max-width: var(--container-md);
}

.container-lg {
  max-width: var(--container-lg);
}

.container-xl {
  max-width: var(--container-xl);
}

/* Section Spacing */
.section {
  padding: var(--space-16) 0;
}

.section-sm {
  padding: var(--space-8) 0;
}

.section-lg {
  padding: var(--space-24) 0;
}
```

---

## 🎭 Border Radius & Shadows

### Border Radius Scale
```css
/* Border Radius */
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius: 0.25rem;        /* 4px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;    /* Full circle */

/* Component-Specific Radii */
--radius-button: var(--radius-lg);
--radius-card: var(--radius-xl);
--radius-input: var(--radius-md);
--radius-avatar: var(--radius-full);
```

### Shadow System
```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

/* Usage Examples */
.shadow-card {
  box-shadow: var(--shadow-lg);
}

.shadow-button {
  box-shadow: var(--shadow);
}

.shadow-button-hover {
  box-shadow: var(--shadow-md);
}

.shadow-modal {
  box-shadow: var(--shadow-2xl);
}
```

---

## 🔤 Component Library

### Button Components

#### Primary Button
```jsx
// Button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, ...props }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center rounded-lg font-medium
      transition-colors focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
    `;

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
      ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

export { Button };
```

#### Button Usage Examples
```jsx
// Usage examples
<Button variant="primary">Get Started</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="ghost" icon={<PlusIcon />}>Add Task</Button>
<Button variant="danger" loading>Deleting...</Button>
```

### Input Components

#### Text Input
```jsx
// Input.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-400">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

export { Input };
```

#### Textarea Component
```jsx
// Textarea.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, resize = 'vertical', ...props }, ref) => {
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            resizeClasses[resize],
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

export { Textarea };
```

### Card Components

#### Base Card
```jsx
// Card.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200',
      outlined: 'bg-white border-2 border-gray-300',
      elevated: 'bg-white shadow-lg',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const radiuses = {
      default: 'rounded-xl',
    };

    return (
      <div
        className={cn(
          variants[variant],
          paddings[padding],
          radiuses.default,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-6', className)}
      {...props}
    />
  )
);

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
);

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
);

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-6', className)}
      {...props}
    />
  )
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

#### Task Card Component
```jsx
// TaskCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  title: string;
  description?: string;
  assignee?: {
    name: string;
    avatar?: string;
    initials: string;
  };
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  status: 'todo' | 'in-progress' | 'review' | 'done';
  commentCount?: number;
  fileCount?: number;
  onClick?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  todo: 'border-l-gray-300',
  'in-progress': 'border-l-blue-500',
  review: 'border-l-orange-500',
  done: 'border-l-green-500',
};

export function TaskCard({
  title,
  description,
  assignee,
  dueDate,
  priority,
  tags = [],
  status,
  commentCount = 0,
  fileCount = 0,
  onClick,
  onComplete,
  onEdit,
  className,
}: TaskCardProps) {
  const priorityColor = priorityColors[priority];
  const borderColor = statusColors[status];

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border-l-4',
        borderColor,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900 line-clamp-2">{title}</h4>
          <div className="flex items-center space-x-1 ml-2">
            <Badge variant="secondary" className={cn('text-xs', priorityColor)}>
              {priority}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Assignee */}
            {assignee && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-xs">
                    {assignee.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600">{assignee.name}</span>
              </div>
            )}

            {/* Due Date */}
            {dueDate && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">📅</span>
                <span className="text-xs text-gray-600">{dueDate}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Comment Count */}
            {commentCount > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">💬</span>
                <span className="text-xs text-gray-600">{commentCount}</span>
              </div>
            )}

            {/* File Count */}
            {fileCount > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">📎</span>
                <span className="text-xs text-gray-600">{fileCount}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              {onComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                >
                  <span className="text-xs">✓</span>
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <span className="text-xs">⋯</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Badge Components

#### Badge Variants
```jsx
// Badge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-1.5 text-sm',
      lg: 'px-3 py-2 text-base',
    };

    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

export { Badge };
```

### Avatar Components

#### Avatar Variants
```jsx
// Avatar.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'md', fallback, ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full',
          sizes[size],
          className
        )}
        {...props}
      >
        {fallback}
      </div>
    );
  }
);

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

export { Avatar, AvatarImage, AvatarFallback };
```

### Modal/Dialog Components

#### Base Dialog
```jsx
// Dialog.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DialogContext);
  
  return (
    <button
      ref={ref}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  );
});

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);
    
    if (!open) return null;

    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl',
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Content */}
        <div
          ref={ref}
          className={cn(
            'relative bg-white rounded-xl shadow-xl',
            'w-full mx-4 max-h-[90vh] overflow-hidden',
            sizes[size],
            className
          )}
          {...props}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {children}
        </div>
      </div>
    );
  }
);

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0', className)}
      {...props}
    />
  )
);

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
);

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0', className)}
      {...props}
    />
  )
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
```

---

## 📱 Responsive Breakpoints

### Breakpoint System
```css
/* Breakpoint Variables */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;

/* Media Queries */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }

/* Responsive Utilities */
.hidden { display: none; }
.block { display: block; }
.flex { display: flex; }
.grid { display: grid; }

@media (min-width: 768px) {
  .md\\:hidden { display: none; }
  .md\\:block { display: block; }
  .md\\:flex { display: flex; }
}

@media (min-width: 1024px) {
  .lg\\:hidden { display: none; }
  .lg\\:block { display: block; }
  .lg\\:flex { display: flex; }
}
```

### Responsive Component Examples
```css
/* Responsive Card Grid */
.card-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

/* Responsive Navigation */
.nav-mobile {
  display: block;
}

.nav-desktop {
  display: none;
}

@media (min-width: 768px) {
  .nav-mobile {
    display: none;
  }
  
  .nav-desktop {
    display: block;
  }
}

/* Responsive Typography */
.text-responsive {
  font-size: 1rem;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .text-responsive {
    font-size: 1.125rem;
    line-height: 1.6;
  }
}

@media (min-width: 1024px) {
  .text-responsive {
    font-size: 1.25rem;
    line-height: 1.7;
  }
}
```

---

## ♿ Accessibility Guidelines

### ARIA Attributes
```jsx
// Accessible Button Component
const AccessibleButton = ({ children, ariaLabel, ariaDescribedBy, ...props }) => (
  <button
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    role="button"
    {...props}
  >
    {children}
  </button>
);

// Accessible Dialog
const AccessibleDialog = ({ titleId, descriptionId, ...props }) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    {...props}
  />
);

// Accessible Form
const AccessibleForm = () => (
  <form role="form" aria-labelledby="form-title">
    <h2 id="form-title">Create New Task</h2>
    
    <label htmlFor="task-title">
      Task Title <span aria-label="required">*</span>
    </label>
    <input
      id="task-title"
      type="text"
      required
      aria-describedby="task-title-help"
    />
    <div id="task-title-help">
      Enter a clear, descriptive title for your task
    </div>
    
    <label htmlFor="task-description">Description</label>
    <textarea
      id="task-description"
      aria-describedby="task-description-help"
    />
    <div id="task-description-help">
      Optional: Add more details about the task requirements
    </div>
    
    <button type="submit" aria-describedby="submit-help">
      Create Task
    </button>
    <div id="submit-help">
      This will create the task and notify assigned team members
    </div>
  </form>
);
```

### Color Contrast Requirements
```css
/* Ensure minimum 4.5:1 contrast ratio */

/* Primary text on white background */
.text-primary {
  color: var(--color-gray-900); /* Contrast ratio: 21:1 */
}

.text-secondary {
  color: var(--color-gray-700); /* Contrast ratio: 10.8:1 */
}

.text-muted {
  color: var(--color-gray-600); /* Contrast ratio: 7.5:1 */
}

/* Button text on colored backgrounds */
.btn-primary {
  background: var(--color-primary-600);
  color: white; /* Contrast ratio: 5.2:1 */
}

.btn-secondary {
  background: var(--color-gray-200);
  color: var(--color-gray-900); /* Contrast ratio: 15.8:1 */
}

/* Status indicators */
.status-success {
  background: var(--color-success-100);
  color: var(--color-success-800); /* Contrast ratio: 4.8:1 */
}

.status-error {
  background: var(--color-error-100);
  color: var(--color-error-800); /* Contrast ratio: 5.3:1 */
}
```

---

## 🚀 Performance Guidelines

### Component Performance
```jsx
// Optimize re-renders with React.memo
const TaskCard = React.memo(({ task, onUpdate }) => {
  return (
    <div className="task-card">
      {/* Task content */}
    </div>
  );
});

// Use useCallback for event handlers
const TaskList = ({ tasks }) => {
  const handleTaskClick = useCallback((taskId) => {
    // Handle task click
  }, []);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => handleTaskClick(task.id)}
        />
      ))}
    </div>
  );
};

// Use useMemo for expensive calculations
const KanbanBoard = ({ tasks }) => {
  const groupedTasks = useMemo(() => {
    return tasks.reduce((groups, task) => {
      const status = task.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(task);
      return groups;
    }, {});
  }, [tasks]);

  return (
    <div className="kanban-board">
      {/* Render columns */}
    </div>
  );
};
```

### CSS Performance
```css
/* Use efficient selectors */
.task-card {
  /* Avoid deep descendant selectors */
}

/* Instead of: */
.container .task-list .task-card { }

/* Use: */
.task-card { }

/* Optimize animations */
.card-hover {
  transition: transform 0.2s ease-in-out;
}

.card-hover:hover {
  transform: translateY(-2px);
  /* Use transform instead of changing top/left */
}

/* Use will-change for animated elements */
.animated-element {
  will-change: transform;
}
```

---

## 🔧 Development Guidelines

### Component Structure
```
src/
├── components/
│   ├── ui/                  # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── forms/              # Form components
│   │   ├── TaskForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── ...
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   └── features/           # Feature-specific components
│       ├── TaskCard.tsx
│       ├── KanbanBoard.tsx
│       └── ...
├── styles/
│   ├── globals.css
│   ├── components.css
│   └── utilities.css
└── lib/
    ├── utils.ts
    ├── constants.ts
    └── types.ts
```

### CSS Architecture
```css
/* 1. Base styles */
@import 'base.css';

/* 2. Component styles */
@import 'components/button.css';
@import 'components/card.css';
@import 'components/form.css';

/* 3. Utility classes */
@import 'utilities/spacing.css';
@import 'utilities/typography.css';
@import 'utilities/colors.css';

/* 4. Layout styles */
@import 'layout/grid.css';
@import 'layout/flexbox.css';
```

### Naming Conventions
```css
/* BEM Methodology */

/* Block */
.task-card { }

/* Element */
.task-card__title { }
.task-card__description { }
.task-card__footer { }

/* Modifier */
.task-card--urgent { }
.task-card--completed { }
.task-card__title--large { }

/* Component variants */
.btn--primary { }
.btn--secondary { }
.btn--large { }
.btn--loading { }
```

This comprehensive design system provides the foundation for building consistent, accessible, and performant React components for the CollabTask application. Each component includes proper TypeScript definitions, accessibility features, and responsive behavior.