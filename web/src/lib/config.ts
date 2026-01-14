// API and WebSocket configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  apiVersion: '/api/v1',
};

export const endpoints = {
  auth: {
    login: `${config.apiVersion}/auth/login/access-token`,
    signup: `${config.apiVersion}/auth/signup`,
    me: `${config.apiVersion}/auth/me`,
  },
  waste: {
    classify: `${config.apiVersion}/waste/classify`,
    history: `${config.apiVersion}/waste/history`,
    pending: `${config.apiVersion}/waste/pending`,
    accept: (id: string) => `${config.apiVersion}/waste/${id}/accept`,
    collect: (id: string) => `${config.apiVersion}/waste/${id}/collect`,
    analytics: `${config.apiVersion}/waste/analytics`,
    ws: (token: string) => `${config.wsUrl}${config.apiVersion}/waste/ws/${token}`,
  },
};
