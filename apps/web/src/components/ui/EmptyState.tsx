/**
 * Empty State Component
 * =====================
 * 
 * Display when no data is available.
 */

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  const navigate = useNavigate();
  
  const handleAction = () => {
    if (action?.onClick) {
      action.onClick();
    } else if (action?.href) {
      navigate(action.href);
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && (
        <Button className="mt-4" onClick={handleAction}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
