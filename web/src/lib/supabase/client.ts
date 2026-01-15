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
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
