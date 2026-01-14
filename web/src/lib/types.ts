// Type definitions for the Smart Waste Management system

export type UserRole = 'user' | 'driver' | 'admin';

export type WasteStatus = 'pending' | 'accepted' | 'collected';

export type WasteType = 'recyclable' | 'organic' | 'e_waste' | 'hazardous' | 'general';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface WasteEntry {
  id: string;
  user_id: string;
  waste_type: WasteType;
  confidence_score: number;
  image_url: string;
  location: Location | null;
  is_recyclable: boolean;
  risk_level: RiskLevel;
  recommended_action: string;
  instructions: string[];
  collection_type: string;
  impact_note: string;
  status: WasteStatus;
  collected_by: string | null;
  collection_image_url: string | null;
  collected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  total_entries: number;
  by_type: Record<WasteType, number>;
  recycling_rate: number;
  avg_confidence: number;
  co2_saved_kg: number;
  energy_saved_kwh: number;
  pending_pickups: number;
  collected_today: number;
  points_earned: number;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  phone?: string;
  address?: string;
}

// WebSocket event types
export type WSEventType = 
  | 'new_pickup'
  | 'pickup_accepted'
  | 'pickup_collected'
  | 'status_update'
  | 'driver_location';

export interface WSMessage {
  type: WSEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

// Camera and Geolocation types
export interface CameraState {
  isSupported: boolean;
  hasPermission: boolean | null;
  stream: MediaStream | null;
  error: string | null;
}

export interface GeoState {
  isSupported: boolean;
  hasPermission: boolean | null;
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
}

// UI state types
export interface ClassificationResult {
  entry: WasteEntry;
  confidenceLevel: ConfidenceLevel;
}

// Points and impact types
export interface UserImpact {
  totalPoints: number;
  recyclingScore: number;
  entriesSubmitted: number;
  correctSegregation: number;
  co2Saved: number;
  energySaved: number;
  treesEquivalent: number;
}

// SDG Indicator types
export interface SDGIndicator {
  number: 11 | 12 | 13;
  title: string;
  description: string;
  contribution: string;
  value: number;
}
