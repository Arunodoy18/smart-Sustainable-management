'use client';

import { WasteEntry } from '@/lib/types';
import { getConfidenceLevel, getConfidenceInfo, getWasteTypeInfo } from '@/lib/utils';
import { cn } from '@/lib/cn';
import { Badge } from './Badge';

interface ConfidenceIndicatorProps {
  score: number;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceIndicator({ 
  score, 
  showDescription = true,
  size = 'md' 
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(score);
  const info = getConfidenceInfo(level);
  const percentage = Math.round(score * 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cn('font-medium', info.color)}>{info.text}</span>
        <span className="text-gray-400 font-mono">{percentage}%</span>
      </div>
      
      {/* Progress bar */}
      <div className={cn('w-full bg-surface-hover rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            level === 'high' && 'bg-confidence-high',
            level === 'medium' && 'bg-confidence-medium',
            level === 'low' && 'bg-confidence-low'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showDescription && (
        <p className="text-sm text-gray-400">{info.description}</p>
      )}
    </div>
  );
}

interface ClassificationResultCardProps {
  entry: WasteEntry;
  showActions?: boolean;
  onViewDetails?: () => void;
}

export function ClassificationResultCard({ 
  entry, 
  showActions = true,
  onViewDetails 
}: ClassificationResultCardProps) {
  const wasteInfo = getWasteTypeInfo(entry.waste_type);
  const confidenceLevel = getConfidenceLevel(entry.confidence_score);

  return (
    <div className="bg-surface rounded-2xl p-5 space-y-4 animate-fade-in">
      {/* Header with waste type */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{wasteInfo.icon}</span>
          <div>
            <h3 className={cn('text-xl font-semibold', wasteInfo.color)}>
              {wasteInfo.label}
            </h3>
            <Badge 
              variant={entry.is_recyclable ? 'success' : 'default'}
              size="sm"
            >
              {entry.is_recyclable ? 'Recyclable' : 'Non-Recyclable'}
            </Badge>
          </div>
        </div>

        <Badge
          variant={
            entry.status === 'collected' ? 'success' :
            entry.status === 'accepted' ? 'info' : 'warning'
          }
          size="md"
        >
          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
        </Badge>
      </div>

      {/* Confidence indicator */}
      <ConfidenceIndicator score={entry.confidence_score} />

      {/* Recommended action */}
      <div className="bg-background-secondary rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Recommended Action</h4>
        <p className="text-white">{entry.recommended_action}</p>
      </div>

      {/* Instructions */}
      {entry.instructions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Instructions</h4>
          <ul className="space-y-1">
            {entry.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                <span className="text-eco-500 mt-0.5">•</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact note */}
      <div className="flex items-center space-x-2 text-sm text-eco-400 bg-eco-500/10 rounded-lg px-3 py-2">
        <span>🌍</span>
        <span>{entry.impact_note}</span>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onViewDetails}
            className="text-eco-400 hover:text-eco-300 text-sm font-medium transition-colors"
          >
            View Details →
          </button>
        </div>
      )}
    </div>
  );
}
