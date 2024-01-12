import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { type AccountTypes } from '@/types'

export async function POST (req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { item }: { item: AccountTypes } = await req.json()

  // Signup to supabase auth system
  const { data: signUpData, error } = await supabase.auth.admin.createUser({
    email: item.email,
    password: item.temp_password,
    email_confirm: true
  })

  if (error) {
    return NextResponse.json({ error_message: error.message })
  } else {
    const newUser: any = signUpData
    return NextResponse.json({ error_message: '', insert_id: newUser.user.id })
  }
}
