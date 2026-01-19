/**
 * API Types
 * =========
 * 
 * TypeScript types for API requests and responses.
 */

// ============================================================================
// COMMON
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Array<{
    field: string;
    message: string;
    type: string;
  }>;
}

// ============================================================================
// AUTH
// ============================================================================

export type UserRole = 'citizen' | 'driver' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending' | 'deleted';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UserProfile extends User {
  total_points: number;
  current_streak: number;
  total_waste_entries: number;
  level: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// ============================================================================
// WASTE
// ============================================================================

export type WasteCategory =
  | 'recyclable'
  | 'organic'
  | 'hazardous'
  | 'electronic'
  | 'general'
  | 'medical'
  | 'construction';

export type BinType =
  | 'green'
  | 'blue'
  | 'black'
  | 'yellow'
  | 'red'
  | 'brown'
  | 'special';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface Classification {
  category: WasteCategory;
  subcategory?: string;
  bin_type: BinType;
  confidence: number;
  confidence_tier: ConfidenceTier;
  reasoning?: string;
  is_hazardous: boolean;
  requires_special_handling: boolean;
  handling_instructions?: string;
}

export interface WasteEntry {
  id: string;
  image_url: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  notes?: string;
  classification?: Classification;
  created_at: string;
  updated_at: string;
}

export interface WasteEntryDetail extends WasteEntry {
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon?: string;
  link_url?: string;
}

export interface ImpactStats {
  total_entries: number;
  recycled_kg: number;
  co2_saved_kg: number;
  trees_equivalent: number;
  water_saved_liters: number;
}

// ============================================================================
// PICKUP
// ============================================================================

export type PickupStatus =
  | 'pending'
  | 'scheduled'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface Pickup {
  id: string;
  user_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  address: string;
  scheduled_date: string;
  scheduled_time_slot: string;
  status: PickupStatus;
  estimated_weight_kg?: number;
  waste_types: string[];
  notes?: string;
  verification_code: string;
  rating?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar_url?: string;
  };
}

export interface PickupRequest {
  latitude: number;
  longitude: number;
  address: string;
  scheduled_date: string;
  scheduled_time_slot: string;
  waste_types: string[];
  estimated_weight_kg?: number;
  notes?: string;
}

// ============================================================================
// REWARDS
// ============================================================================

export type RewardType =
  | 'waste_entry'
  | 'correct_classification'
  | 'pickup_completed'
  | 'daily_streak'
  | 'weekly_streak'
  | 'monthly_streak'
  | 'referral'
  | 'achievement'
  | 'bonus';

export interface Reward {
  id: string;
  type: RewardType;
  points: number;
  description: string;
  created_at: string;
}

export interface RewardSummary {
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  points_to_next_level: number;
  level_progress: number;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  next_milestone: number;
  progress_to_next: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  target?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  points: number;
  level: number;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  user_rank: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

// ============================================================================
// ADMIN
// ============================================================================

export interface DashboardStats {
  total_users: number;
  total_waste_entries: number;
  total_pickups: number;
  pending_pickups: number;
  active_drivers: number;
  today_entries: number;
  today_pickups: number;
}

export interface ZoneAnalytics {
  zone_id: string;
  zone_name: string;
  total_entries: number;
  recycling_rate: number;
  compliance_rate: number;
  date: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  radius: number;
  category?: WasteCategory;
}

export interface SystemHealth {
  database: boolean;
  cache: boolean;
  ml_service: boolean;
  storage: boolean;
  overall: boolean;
  checked_at: string;
}
