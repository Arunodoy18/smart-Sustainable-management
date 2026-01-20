/**
 * Loading Spinner Component
 * =========================
 * 
 * Reusable loading indicators for async operations.
 */

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const variantClasses = {
  primary: 'border-primary-200 border-t-primary-600',
  white: 'border-white/30 border-t-white',
  gray: 'border-gray-200 border-t-gray-600',
};

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        'rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'lg',
  text,
  fullScreen = false,
  overlay = false,
  className,
}: LoadingSpinnerProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      <Spinner size={size} />
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-40">
        {content}
      </div>
    );
  }

  return content;
}

interface LoadingCardProps {
  count?: number;
  className?: string;
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse', className)}>
      <div className="bg-gray-200 rounded-lg h-48 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export function LoadingCardGrid({ count = 3, className }: LoadingCardProps) {
  return (
    <div className={clsx('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded-t-lg mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 border-b border-gray-200" />
      ))}
    </div>
  );
}

export function LoadingPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 bg-gray-200 rounded-lg" />
        <div className="h-80 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export default LoadingSpinner;
