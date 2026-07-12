import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEBUG: Log the values to console
console.log('🔍 DEBUG - Supabase URL:', supabaseUrl);
console.log('🔍 DEBUG - Supabase Anon Key:', supabaseAnonKey ? '***KEY EXISTS***' : '❌ KEY IS MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing Supabase credentials!');
  console.error('❌ Check your .env file in the root directory');
  console.error('❌ Make sure variables are named VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);