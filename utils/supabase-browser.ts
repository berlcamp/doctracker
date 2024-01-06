/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createBrowserClient as browserClient } from '@supabase/ssr'

export const createBrowserClient = () =>
  browserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
