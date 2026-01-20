/**
 * Avatar Component
 * ================
 * 
 * User avatar with fallback initials.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Combined name prop
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, firstName, lastName, name, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    // Parse name into first/last if provided
    let first = firstName;
    let last = lastName;
    if (name && !firstName && !lastName) {
      const parts = name.split(' ');
      first = parts[0] || '';
      last = parts.slice(1).join(' ') || '';
    }
    
    const initials = getInitials(first, last);

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700 font-medium',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || `${firstName} ${lastName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
