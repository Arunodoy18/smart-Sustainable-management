/**
 * Stats Card Component
 * ====================
 * 
 * Dashboard statistics card.
 */

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import { cn, formatNumber } from '@/lib/utils';

export interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: number | string;
  icon?: ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  suffix?: string;
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, icon, iconColor = 'bg-primary-100 text-primary-600', trend, suffix, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('card flex items-start gap-4', className)}
        {...props}
      >
        {icon && (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconColor)}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? formatNumber(value) : value}
            </span>
            {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
          </p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs">
              {trend.isPositive ? (
                <ArrowUpIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                {trend.value}%
              </span>
              {trend.label && <span className="text-gray-500">{trend.label}</span>}
            </p>
          )}
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export { StatsCard };
