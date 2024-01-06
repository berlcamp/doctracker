import { createBrowserClient } from '../utils/supabase-browser'

export async function CheckIfSchoolHead (id) {
  const supabase = createBrowserClient()

  const { count } = await supabase
    .from('hrm_schools')
    .select('id', { count: 'exact' })
    .eq('head_user_id', id)
    .limit(1)
    .single()

  return count > 0
}
