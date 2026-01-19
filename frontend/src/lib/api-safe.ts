/**
 * Safe API wrapper with timeout, error handling, and graceful fallback
 * Prevents UI crashes when backend is unreachable
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Creates an AbortController with timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Safe fetch wrapper that never throws - always returns a result object
 */
export async function safeFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  const controller = createTimeoutController(timeout);
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data: T | null = null;
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      // Extract error message from response
      const errorMessage = 
        (data as { detail?: string })?.detail || 
        (data as { message?: string })?.message || 
        `Request failed with status ${response.status}`;
      
      return {
        data: null,
        error: errorMessage,
        status: response.status,
        ok: false,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
      ok: true,
    };
  } catch (err) {
    // Handle network errors, timeouts, etc.
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          data: null,
          error: 'Request timed out. Please check your connection.',
          status: 0,
          ok: false,
        };
      }
      
      if (err.message.includes('fetch')) {
        return {
          data: null,
          error: 'Unable to connect to server. Please try again later.',
          status: 0,
          ok: false,
        };
      }

      return {
        data: null,
        error: err.message,
        status: 0,
        ok: false,
      };
    }

    return {
      data: null,
      error: 'An unexpected error occurred',
      status: 0,
      ok: false,
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
  return safeFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string, 
  body?: unknown, 
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return safeFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Authenticated fetch with token
 */
export async function authFetch<T>(
  endpoint: string,
  token: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return safeFetch<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  const result = await safeFetch('/health', { timeout: 3000 });
  return result.ok;
}
