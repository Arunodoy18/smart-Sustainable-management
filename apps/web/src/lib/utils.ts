/**
 * Utility Functions
 * =================
 * 
 * Common utility functions for the application.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string
 */
export function formatDate(date: string | Date, pattern = 'PPP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get initials from a name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '?';
}

/**
 * Get bin color by type
 */
export function getBinColor(binType: string): string {
  const colors: Record<string, string> = {
    green: '#22c55e',
    blue: '#3b82f6',
    black: '#1f2937',
    yellow: '#eab308',
    red: '#ef4444',
    brown: '#92400e',
    special: '#8b5cf6',
  };
  return colors[binType] || '#6b7280';
}

/**
 * Get status color
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-800' },
    assigned: { bg: 'bg-purple-100', text: 'text-purple-800' },
    en_route: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    arrived: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
    failed: { bg: 'bg-red-100', text: 'text-red-800' },
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    suspended: { bg: 'bg-red-100', text: 'text-red-800' },
  };
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}

/**
 * Get confidence tier color
 */
export function getConfidenceColor(tier: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    high: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    low: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  };
  return colors[tier] || { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
}

/**
 * Calculate level from points
 */
export function calculateLevel(points: number): number {
  const thresholds = [0, 500, 1500, 3500, 7000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (points >= thresholds[i]) {
      level = i + 1;
    }
  }
  return Math.min(level, 5);
}

/**
 * Get points needed for next level
 */
export function getPointsToNextLevel(points: number): number {
  const thresholds = [0, 500, 1500, 3500, 7000, Infinity];
  const level = calculateLevel(points);
  return thresholds[level] - points;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate random verification code
 */
export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
