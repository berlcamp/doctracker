import type { AccountTypes } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { format } from 'date-fns'
// import { fullTextQuery } from './text-helper'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface DocumentFilterTypes {
  filterKeyword?: string
  filterAgency?: string
  filterStatus?: string
  filterDateFrom?: string
  filterDateTo?: string
  filterTypes?: any[]
}

export async function fetchDocuments (filters: DocumentFilterTypes, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('dum_document_trackers')
      .select('*, dum_document_tracker_replies(*)', { count: 'exact' })

    // Full text search
    if (typeof filters.filterKeyword !== 'undefined' && filters.filterKeyword.trim() !== '') {
      query = query.or(`remarks.ilike.%${filters.filterKeyword}%,particulars.ilike.%${filters.filterKeyword}%,name.ilike.%${filters.filterKeyword}%,routing_slip_no.ilike.%${filters.filterKeyword}%,amount.ilike.%${filters.filterKeyword}%`)

      // fulltext search from trackersearch posgres function
      // query = query.textSearch('trackersearch', fullTextQuery(filters.filterKeyword))
    }

    // Filter agency
    if (typeof filters.filterAgency !== 'undefined' && filters.filterAgency.trim() !== '') {
      query = query.or(`agency.ilike.%${filters.filterAgency}%`)
    }

    // Filter Date
    if (typeof filters.filterDateFrom !== 'undefined' && filters.filterDateFrom !== '') {
      query = query.gte('date', filters.filterDateFrom)
    }
    if (typeof filters.filterDateTo !== 'undefined' && filters.filterDateTo !== '') {
      query = query.lte('date', filters.filterDateTo)
    }

    // Filter type
    if (typeof filters.filterTypes !== 'undefined' && filters.filterTypes.length > 0) {
      const statement: string[] = []
      filters.filterTypes?.forEach((type: string) => {
        const str = `type.eq.${type}`
        statement.push(str)
      })
      query = query.or(statement.join(', '))
    }

    // Filter Status
    if (typeof filters.filterStatus !== 'undefined' && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
    }

    // Perform count before paginations
    // const { count } = await query

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)
    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, count, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error xx', error)
    return { data: [], count: 0 }
  }
}

export async function fetchActivities (today: string, endDate: Date) {
  try {
    const { data, count, error } = await supabase
      .from('dum_document_trackers')
      .select('*', { count: 'exact' })
      .gte('activity_date', today)
      .lt('activity_date', endDate.toISOString())
      .eq('is_deleted', false)
      .eq('type', 'Letters')
      .neq('is_archive', 'true')
      .order('activity_date', { ascending: true })
      .limit(30)

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchDistrictAssistance (filters: { filterKeyword?: string, filterHospital?: string, filterFrom?: string, filterTo?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('asenso_district_assistance')
      .select('*', { count: 'exact' })

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(`fullname.ilike.%${filters.filterKeyword}%,referral.ilike.%${filters.filterKeyword}%`)
    }

    // filter filterHospital
    if (filters.filterHospital && filters.filterHospital !== '') {
      query = query.eq('hospital', filters.filterHospital)
    }

    // filter approve "From"
    if (filters.filterFrom && filters.filterFrom !== '') {
      query = query.gte('date_approved', format(new Date(filters.filterFrom), 'yyyy-MM-dd'))
    }

    // filter approve "To"
    if (filters.filterTo && filters.filterTo !== '') {
      query = query.lte('date_approved', format(new Date(filters.filterTo), 'yyyy-MM-dd'))
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function searchActiveEmployees (searchTerm: string, excludedItems: any[]) {
  let query = supabase
    .from('asenso_users')
    .select()
    .eq('status', 'active')
    .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

  // Search match
  query = query.or(`firstname.ilike.%${searchTerm}%,middlename.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%`)

  // Excluded already selected items
  excludedItems.forEach(item => {
    query = query.neq('id', item.id)
  })

  // Limit results
  query = query.limit(3)

  const { data, error } = await query

  if (error) console.error(error)

  return data ?? []
}

export async function fetchAccounts (filters: { filterKeyword?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('asenso_users')
      .select('*', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(`name.ilike.%${filters.filterKeyword}%`)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: userData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: AccountTypes[] = userData

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}
