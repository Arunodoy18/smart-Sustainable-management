/**
 * Spinner Component
 * =================
 * 
 * Loading spinner indicator.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-2',
      lg: 'h-8 w-8 border-3',
    };

    const colors = {
      primary: 'border-primary-600',
      white: 'border-white',
      gray: 'border-gray-600',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-t-transparent',
          sizes[size],
          colors[color],
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

// Full page loading
const LoadingPage = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// Inline loading
const LoadingInline = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex items-center justify-center gap-2 py-8">
    <Spinner size="md" />
    <p className="text-sm text-gray-500">{text}</p>
  </div>
);

export { Spinner, LoadingPage, LoadingInline };
