import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase is optional - only used for real-time features and storage
// Auth is handled by the custom FastAPI backend

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.info('[Supabase] Not configured - real-time features disabled');
    }
    return null;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    console.error('[Supabase] Invalid SUPABASE_URL format');
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We use our own auth
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
}

// Export a getter instead of direct instance to handle missing config gracefully
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
  
  get isConfigured() {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },
};
