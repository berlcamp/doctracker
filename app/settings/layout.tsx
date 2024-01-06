'use client'

import { Unauthorized } from '@/components'
import { superAdmins } from '@/constants/TrackerConstants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'

export default function PmsLayout ({ children }: { children: React.ReactNode }) {
  const { hasAccess } = useFilter()
  const { session } = useSupabase()

  // Check access from permission settings or Super Admins
  if (!hasAccess('settings') && !superAdmins.includes(session.user.email)) return <Unauthorized/>

  return (
    <>
      {children}
    </>
  )
}
