import { createServerClient } from '@/utils/supabase-server'

export async function verifyAuth () {
  const supabase = createServerClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Check if exist on registration data before redirecting to main page
  const { error } = await supabase
    .from('asenso_users')
    .upsert({
      id: session?.user.id,
      firstname: session?.user.user_metadata.firstname,
      middlename: session?.user.user_metadata.middlename,
      lastname: session?.user.user_metadata.lastname,
      assignment: session?.user.user_metadata.assignment,
      org_id: session?.user.user_metadata.org_id
    }, { onConflict: 'id' })

  if (error) console.log(error)
}
