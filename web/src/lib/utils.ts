import { ConfidenceLevel, WasteType, RiskLevel, SDGIndicator, UserImpact } from './types';

// Get confidence level from score
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

// Get confidence display info
export function getConfidenceInfo(level: ConfidenceLevel): {
  color: string;
  bgColor: string;
  text: string;
  description: string;
} {
  switch (level) {
    case 'high':
      return {
        color: 'text-confidence-high',
        bgColor: 'bg-confidence-high/20',
        text: 'High Confidence',
        description: 'AI is confident in this classification. Proceed with the recommended action.',
      };
    case 'medium':
      return {
        color: 'text-confidence-medium',
        bgColor: 'bg-confidence-medium/20',
        text: 'Medium Confidence',
        description: 'Please verify the classification. Consider double-checking before disposal.',
      };
    case 'low':
      return {
        color: 'text-confidence-low',
        bgColor: 'bg-confidence-low/20',
        text: 'Low Confidence',
        description: 'Manual verification recommended. Consider consulting waste guidelines.',
      };
  }
}

// Get waste type display info
export function getWasteTypeInfo(type: WasteType): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const types: Record<WasteType, { label: string; color: string; bgColor: string; icon: string }> = {
    recyclable: {
      label: 'Recyclable',
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/20',
      icon: '♻️',
    },
    organic: {
      label: 'Organic',
      color: 'text-accent-lime',
      bgColor: 'bg-accent-lime/20',
      icon: '🍃',
    },
    e_waste: {
      label: 'E-Waste',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      icon: '🔌',
    },
    hazardous: {
      label: 'Hazardous',
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
      icon: '⚠️',
    },
    general: {
      label: 'General',
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/20',
      icon: '🗑️',
    },
  };

  return types[type] || types.general;
}

// Get risk level display info
export function getRiskLevelInfo(level: RiskLevel): {
  label: string;
  color: string;
  bgColor: string;
} {
  const levels: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
    low: { label: 'Low Risk', color: 'text-green-400', bgColor: 'bg-green-400/20' },
    medium: { label: 'Medium Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20' },
    high: { label: 'High Risk', color: 'text-red-400', bgColor: 'bg-red-400/20' },
  };

  return levels[level] || levels.low;
}

// Calculate user impact from entries
export function calculateUserImpact(
  entries: number,
  correctSegregation: number,
  avgConfidence: number
): UserImpact {
  // Points calculation based on correct segregation and confidence
  const basePoints = entries * 10;
  const segregationBonus = correctSegregation * 5;
  const confidenceBonus = Math.round(avgConfidence * 100);
  
  // Environmental impact estimates (rough approximations)
  const co2PerEntry = 0.5; // kg CO2 saved per proper recycling
  const energyPerEntry = 2; // kWh saved per entry
  const treesPerTonCo2 = 6; // Trees needed to absorb 1 ton CO2

  const totalPoints = basePoints + segregationBonus + confidenceBonus;
  const co2Saved = entries * co2PerEntry;
  const energySaved = entries * energyPerEntry;
  const treesEquivalent = (co2Saved / 1000) * treesPerTonCo2;

  return {
    totalPoints,
    recyclingScore: Math.round((correctSegregation / Math.max(entries, 1)) * 100),
    entriesSubmitted: entries,
    correctSegregation,
    co2Saved,
    energySaved,
    treesEquivalent: Math.round(treesEquivalent * 10) / 10,
  };
}

// SDG indicators
export function getSDGIndicators(analytics: {
  recycling_rate: number;
  co2_saved_kg: number;
  energy_saved_kwh: number;
}): SDGIndicator[] {
  return [
    {
      number: 11,
      title: 'Sustainable Cities',
      description: 'Making cities inclusive, safe, resilient and sustainable',
      contribution: 'Smart waste collection reduces urban pollution',
      value: analytics.recycling_rate,
    },
    {
      number: 12,
      title: 'Responsible Consumption',
      description: 'Ensuring sustainable consumption and production patterns',
      contribution: `${analytics.co2_saved_kg.toFixed(1)} kg CO₂ prevented`,
      value: Math.min(100, analytics.co2_saved_kg / 10),
    },
    {
      number: 13,
      title: 'Climate Action',
      description: 'Taking urgent action to combat climate change',
      contribution: `${analytics.energy_saved_kwh.toFixed(1)} kWh energy saved`,
      value: Math.min(100, analytics.energy_saved_kwh / 100),
    },
  ];
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateString);
}
