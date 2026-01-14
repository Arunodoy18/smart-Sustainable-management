'use client';

import { cn } from '@/lib/cn';
import { WasteEntry } from '@/lib/types';
import { formatRelativeTime, getWasteTypeInfo } from '@/lib/utils';
import { Badge } from './Badge';

interface StatusCardProps {
  entry: WasteEntry;
  showUser?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StatusCard({ entry, showUser = false, onClick, className }: StatusCardProps) {
  const wasteInfo = getWasteTypeInfo(entry.waste_type);
  
  const statusConfig = {
    pending: { badge: 'warning' as const, text: 'Pending Pickup', icon: '⏳' },
    accepted: { badge: 'info' as const, text: 'Driver Assigned', icon: '🚗' },
    collected: { badge: 'success' as const, text: 'Collected', icon: '✅' },
  };

  const status = statusConfig[entry.status];

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface rounded-xl p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-surface-hover hover:scale-[1.01]',
        className
      )}
    >
      <div className="flex items-start space-x-4">
        {/* Image thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-background-tertiary flex-shrink-0">
          {entry.image_url ? (
            <img
              src={entry.image_url}
              alt="Waste item"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {wasteInfo.icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={cn('font-medium', wasteInfo.color)}>
              {wasteInfo.label}
            </span>
            <Badge variant={status.badge} size="sm">
              {status.icon} {status.text}
            </Badge>
          </div>

          <p className="text-sm text-gray-400 truncate">
            {entry.recommended_action}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatRelativeTime(entry.created_at)}
            </span>
            {entry.location && (
              <span className="text-xs text-eco-400">
                📍 Location available
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusTimelineProps {
  entry: WasteEntry;
}

export function StatusTimeline({ entry }: StatusTimelineProps) {
  const steps = [
    { key: 'submitted', label: 'Submitted', icon: '📸', done: true },
    { key: 'pending', label: 'Pending Pickup', icon: '⏳', done: entry.status !== 'pending' || entry.status === 'pending' },
    { key: 'accepted', label: 'Driver Assigned', icon: '🚗', done: entry.status === 'accepted' || entry.status === 'collected' },
    { key: 'collected', label: 'Collected', icon: '✅', done: entry.status === 'collected' },
  ];

  const currentStep = steps.findIndex(s => s.key === entry.status);

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isActive = index === currentStep + 1;
        const isPast = index <= currentStep + 1;
        
        return (
          <div key={step.key} className="flex items-center mb-4 last:mb-0">
            {/* Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                isPast ? 'bg-eco-500/20' : 'bg-surface-hover',
                isActive && 'ring-2 ring-eco-500 ring-offset-2 ring-offset-background'
              )}
            >
              {step.icon}
            </div>

            {/* Label */}
            <div className="ml-4">
              <p className={cn(
                'font-medium',
                isPast ? 'text-white' : 'text-gray-500'
              )}>
                {step.label}
              </p>
              {isActive && (
                <p className="text-sm text-eco-400">In progress</p>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-5 w-0.5 h-4 -translate-x-1/2',
                  isPast ? 'bg-eco-500' : 'bg-surface-hover'
                )}
                style={{ top: `${(index * 64) + 48}px` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
