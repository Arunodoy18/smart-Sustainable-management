import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xevbkwjqyhwaiklkvyyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldmJrd2pxeWh3YWlrbGt2eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzA0MjYsImV4cCI6MjA4MjY0NjQyNn0.Y9Jo01N_Sh0vyms-W-sDTjOAZ3dUjdRdNgU2IyKU5Cw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
