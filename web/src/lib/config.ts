const API_VERSION = '/api/v1';

function getApiUrl(): string {
  // In browser, use relative URL to leverage Next.js rewrites
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If API URL is set and not localhost in production, use it
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl;
    }
    // Use relative path to leverage Next.js rewrites (works in all environments)
    return '';
  }
  // Server-side: use env var or default (port 8080 for Azure Container Apps)
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

function getWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiUrl) {
    return apiUrl.replace(/^http/, 'ws');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  return 'ws://localhost:8080';
}

export const config = {
  get apiUrl() { return getApiUrl(); },
  get wsUrl() { return getWsUrl(); },
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  apiVersion: API_VERSION,
  
  // Validation helper for critical env vars (call on app init)
  validateEnv(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    // These are optional in development but we log warnings
    if (typeof window !== 'undefined') {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('[Config] NEXT_PUBLIC_SUPABASE_URL is not set');
      }
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('[Config] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
      }
    }
    
    return { valid: missing.length === 0, missing };
  }
};

export const endpoints = {
  auth: {
    login: `${API_VERSION}/auth/login/access-token`,
    signup: `${API_VERSION}/auth/signup`,
    me: `${API_VERSION}/auth/me`,
  },
  waste: {
    classify: `${API_VERSION}/waste/classify`,
    history: `${API_VERSION}/waste/history`,
    pending: `${API_VERSION}/waste/pending`,
    accept: (id: string) => `${API_VERSION}/waste/${id}/accept`,
    collect: (id: string) => `${API_VERSION}/waste/${id}/collect`,
    analytics: `${API_VERSION}/waste/analytics`,
    ws: (token: string) => `${config.wsUrl}${API_VERSION}/waste/ws/${token}`,
  },
  health: `${API_VERSION}/health`,
};
