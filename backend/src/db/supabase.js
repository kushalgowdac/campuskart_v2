// ============================================================
// db/supabase.js — The database connection
// ============================================================
// This is the ONLY file that talks to Supabase directly.
// Every controller imports { supabase } from here and uses it.
//
// WHY one file for DB connection?
// If you ever need to change DB credentials or switch providers,
// you change it in ONE place. This is the "Single Source of Truth" principle.
// In Sommerville: this is the Data Access Layer.
//
// WHAT is createClient doing?
// It initialises the Supabase JS SDK with your project URL and key.
// After this, supabase.from('products').select('*') talks to your DB.
// The SERVICE_ROLE_KEY bypasses RLS (Row Level Security) — giving
// your backend full DB access. NEVER expose this key to the frontend.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


// Get the directory of THIS file (src/db/)
// Then go up two levels to backend/ where .env lives
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;



// Fail fast: if env vars are missing, crash immediately with a clear message.
// Better to crash on startup than to get mysterious errors later.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.\n' +
    'Copy these from: supabase.com → your project → Settings → API'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // We manage our own auth (JWT) — we don't use Supabase Auth.
    // This tells the SDK not to persist any session on the server side.
    persistSession: false,
    autoRefreshToken: false,
  }
});