/**
 * Supabase Client Configuration
 * 
 * IMPORTANT: This uses the anon (public) key, NOT the service_role key.
 * 
 * Why anon key in frontend?
 * - The anon key is safe to expose in browser code
 * - It has Row Level Security (RLS) protections
 * - It can only access data allowed by your Supabase RLS policies
 * 
 * Why NOT service_role key?
 * - service_role bypasses ALL security rules
 * - It would expose your entire database to anyone viewing browser source
 * - It should ONLY be used in backend server code (like your FastAPI backend)
 * 
 * Build-time safety:
 * - Uses placeholder values during build if env vars are missing
 * - Only validates in browser runtime
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDU2ODAwMH0.placeholder';

// Validate in browser runtime only
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error(
      '❌ Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
