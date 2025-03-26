"use client"

import { createClient as createClientBase } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  
  return createClientBase<Database>(supabaseUrl, supabaseAnonKey)
}