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
  total_pages: number;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  detail?: string; // FastAPI error format
  details?: Array<{
    field: string;
    message: string;
    type: string;
  }>;
}

// ============================================================================
// AUTH
// ============================================================================

/**
 * IMPORTANT: These enum values MUST match the backend PostgreSQL enum values.
 * The backend uses UPPERCASE values for all enums.
 */
export type UserRole = 'CITIZEN' | 'DRIVER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
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
  address?: string;
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

/**
 * IMPORTANT: These enum values MUST match the backend PostgreSQL enum values.
 * The backend uses UPPERCASE values for all enums.
 */
export type WasteCategory =
  | 'RECYCLABLE'
  | 'ORGANIC'
  | 'HAZARDOUS'
  | 'ELECTRONIC'
  | 'GENERAL'
  | 'MEDICAL';

export type BinType =
  | 'GREEN'
  | 'BLUE'
  | 'BLACK'
  | 'YELLOW'
  | 'RED'
  | 'SPECIAL';

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Classification {
  category: WasteCategory;
  subcategory?: string;
  sub_category?: string; // API may use snake_case
  bin_type: BinType;
  recommended_bin?: string; // Alternative field name
  confidence: number;
  confidence_tier: ConfidenceTier;
  reasoning?: string;
  is_hazardous: boolean;
  requires_special_handling: boolean;
  handling_instructions?: string;
}

export interface WasteEntry {
  id: string;
  user_id: string;
  image_url: string;
  image_thumbnail_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  user_notes?: string;
  // Classification fields (flat, matching backend WasteEntryResponse)
  category?: WasteCategory;
  subcategory?: string;
  bin_type?: BinType;
  ai_confidence?: number;
  confidence_tier?: ConfidenceTier;
  // User override
  user_verified: boolean;
  user_override_category?: WasteCategory;
  // Status
  status: string;
  // Impact
  estimated_weight_kg?: number;
  co2_saved_kg?: number;
  // Points (populated on upload response)
  points_awarded?: number;
  total_points?: number;
  level?: number;
  points_earned?: number;
  created_at: string;
  updated_at: string;
}

export interface WasteEntryDetail extends WasteEntry {
  recommendations: Recommendation[];
}

// Response from classification endpoint
export interface WasteClassification {
  entry: WasteEntry;
  classification: Classification;
  recommendations: Recommendation[];
  points_earned: number;
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

/**
 * IMPORTANT: These enum values MUST match the backend PostgreSQL enum values.
 */
export type PickupStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'FAILED';

export interface Pickup {
  id: string;
  user_id: string;
  waste_entry_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  address: string;
  address_details?: string;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  status: PickupStatus;
  priority: string;
  qr_code?: string;
  assigned_at?: string;
  en_route_at?: string;
  arrived_at?: string;
  collected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PickupRequest {
  waste_entry_id: string;
  latitude: number;
  longitude: number;
  address: string;
  address_details?: string;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  priority?: string;
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
  points_reward?: number; // Alternative field name
  unlocked: boolean;
  unlocked_at?: string;
  earned_at?: string; // Alternative field name
  progress?: number;
  target?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  avatar_url?: string;
  points: number;
  level: number;
  is_current_user?: boolean;
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
