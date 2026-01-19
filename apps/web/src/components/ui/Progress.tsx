/**
 * Progress Component
 * ==================
 * 
 * Progress bar and circular progress.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// LINEAR PROGRESS
// ============================================================================

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value, max = 100, size = 'md', color = 'primary', showLabel = false, ...props },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const colors = {
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className={cn('overflow-hidden rounded-full bg-gray-200', sizes[size])}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              colors[color]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="mt-1 text-right text-xs text-gray-500">{Math.round(percentage)}%</p>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 80,
      strokeWidth = 8,
      color = 'primary',
      showLabel = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colors = {
      primary: 'text-primary-500',
      secondary: 'text-secondary-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      danger: 'text-red-500',
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            className="text-gray-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={cn('transition-all duration-300', colors[color])}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export { Progress, CircularProgress };
