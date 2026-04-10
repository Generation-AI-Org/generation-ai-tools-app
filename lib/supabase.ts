import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (read-only, RLS enforced)
export const supabase = createClient(url, anon)

// Server client (service role, bypasses RLS — nur in Server Components / API Routes)
export function createServerClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
