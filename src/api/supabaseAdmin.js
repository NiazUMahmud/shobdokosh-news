/**
 * Supabase client with service-role key — used only in dev to write news from the browser.
 * In production, Netlify Functions use the server-side SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
);
