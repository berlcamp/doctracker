'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DocumentDuplicateIcon } from '@heroicons/react/20/solid'
import { useSupabase } from '@/context/SupabaseProvider'
import type { AccountTypes } from '@/types'
import { useSelector } from 'react-redux'

const TrackerSideBar = () => {
  const [receiveCount, setReceiveCount] = useState(0)
  const [forwardedCount, setForwardedCount] = useState(0)
  const searchParams = useSearchParams()

  const filter = searchParams.get('filter')

  const { supabase, session, systemUsers } = useSupabase()

  // Redux staff
  const recountStatus = useSelector((state: any) => state.recount.value)

  const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

  const counter = async () => {
    const { count }: { count: number } = await supabase
      .from('dum_document_trackers')
      .select('*', { count: 'exact' })
      .eq('current_status', 'Forwarded')
      .eq('current_department_id', user.department_id)

    setReceiveCount(count)

    const { count: forwarded }: { count: number } = await supabase
      .from('dum_document_trackers')
      .select('*', { count: 'exact' })
      .or('current_status.eq.Forwarded,current_status.eq.Received')
      .eq('forwarded_from_department_id', user.department_id)

    setForwardedCount(forwarded)
  }
  useEffect(() => {
    void counter()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recountStatus])
  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <DocumentDuplicateIcon className='w-5 h-5'/>
            <span>Document Tracker</span>
          </div>
        </li>
        <li>
          <Link
            href="/tracker"
            className={`app__menu_link ${!filter ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">All Documents</span>
          </Link>
        </li>
        <li>
          <Link
            href="/tracker?filter=receive"
            className={`app__menu_link ${filter === 'receive' ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Receive</span>
            {
              receiveCount > 0 &&
                <span className='inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5'>
                  <span className='rounded-full px-1 text-white text-xs'>{receiveCount}</span>
                </span>
            }
          </Link>
        </li>
        <li>
          <Link
            href="/tracker?filter=forwarded"
            className={`app__menu_link ${filter === 'forwarded' ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Forwarded</span>
            {
              forwardedCount > 0 &&
                <span className='inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5'>
                  <span className='rounded-full px-1 text-white text-xs'>{forwardedCount}</span>
                </span>
            }
          </Link>
        </li>
        <li>
          <Link
            href="/tracker?filter=following"
            className={`app__menu_link ${filter === 'following' ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Following</span>
          </Link>
        </li>
      </ul>
    </>
  )
}

export default TrackerSideBar
