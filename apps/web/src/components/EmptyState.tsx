/**
 * Empty State Component
 * =====================
 * 
 * Displays a placeholder when no data is available.
 */

import { ReactNode } from 'react';
import { 
  InboxIcon, 
  DocumentIcon, 
  PhotoIcon, 
  FolderIcon 
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

type IconType = 'inbox' | 'document' | 'photo' | 'folder';

const icons: Record<IconType, typeof InboxIcon> = {
  inbox: InboxIcon,
  document: DocumentIcon,
  photo: PhotoIcon,
  folder: FolderIcon,
};

interface EmptyStateProps {
  icon?: IconType;
  customIcon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = 'inbox',
  customIcon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const IconComponent = icons[icon];

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16',
        className
      )}
    >
      <div
        className={clsx(
          'bg-gray-100 rounded-full flex items-center justify-center mb-4',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}
      >
        {customIcon || (
          <IconComponent
            className={clsx(
              'text-gray-400',
              compact ? 'w-6 h-6' : 'w-8 h-8'
            )}
          />
        )}
      </div>
      <h3
        className={clsx(
          'font-semibold text-gray-900',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={clsx(
            'text-gray-500 max-w-sm mt-1',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
