/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { Fragment, useRef, useEffect, useState } from 'react'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import { Menu, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import uuid from 'react-uuid'
import { useSupabase } from '@/context/SupabaseProvider'
import { formatDistance } from 'date-fns'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'

// types
import type { NotificationTypes } from '@/types'
import { useDispatch } from 'react-redux'
import { recount } from '@/GlobalRedux/Features/recountSlice'

interface propTypes {
  darkMode?: boolean
}

const Notifications = ({ darkMode }: propTypes) => {
  const [isUnreadChecked, setIsUnreadChecked] = useState(false)

  const [total, setTotal] = useState(0)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const router = useRouter()
  const { supabase, session } = useSupabase()

  const dispatch = useDispatch()

  const userId: string = session.user.id

  const [list, setList] = useState<NotificationTypes[] | null>(null)
  const [count, setCount] = useState(0)

  const fetchData = async () => {
    const { data, error }: { data: NotificationTypes[], error: any } = await supabase
      .from('dum_notifications')
      .select()
      .eq('user_id', userId)
      // .order('is_read', { ascending: true })
      .order('id', { ascending: false })
      .limit(15)

    if (error) console.error(error)

    void countUnread()
    setList(data)

    // Recount sidebar counter
    dispatch(recount())
  }

  const handleShowMore = async () => {
    if (!list) return

    // return if no more notifications to load
    if (list.length === total) {
      console.log(list.length, total)
      return
    }

    let query = supabase
      .from('dum_notifications')
      .select()
      .eq('user_id', userId)

    // Per Page from context
    const from = list.length
    const to = from + 14

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error } = await query

    if (error) console.error(error)

    setList([...list, ...data])
  }

  const handleScroll = () => {
    const scrollContainer = scrollContainerRef.current

    if (scrollContainer && (scrollContainer.scrollTop + scrollContainer.clientHeight === scrollContainer.scrollHeight)) {
      void handleShowMore()
    }
  }

  const countUnread = async () => {
    const { count: unreadCount }: { count: number } = await supabase
      .from('dum_notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .eq('user_id', userId)

    setCount(unreadCount)
  }

  // Mark as read
  const handleClick = async (notification: NotificationTypes) => {
    // mark as read code here..
    await supabase
      .from('dum_notifications')
      .update({
        is_read: true
      })
      .eq('id', notification.id)

    void countUnread()

    router.push(`/tracker?code=${notification.reference_id}`)
  }

  useEffect(() => {
    const countTotal = async () => {
      const { count: notiTotal }: { count: number } = await supabase
        .from('dum_notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      setTotal(notiTotal)
    }
    void countTotal()
    void fetchData()
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('realtime notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dum_notifications', filter: `user_id=eq.${userId}` },
        () => {
          void fetchData()
        })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className='pt-1 cursor-pointer'>
      <Menu as="div" className="relative inline-block text-left mr-2">
        <div>
          <Menu.Button className="relative focus:ring-0 focus:outline-none ">
            <span className={`inline-flex items-center justify-center rounded-full ${darkMode ? 'bg-white' : 'bg-gray-500 bg-opacity-30'} w-8 h-8`}>
              <span className='absolute z-30 top-0 -right-2 bg-red-500 rounded-full px-1 text-white text-[8px]'>{count}</span>
              <BellAlertIcon className='w-6 h-6 text-gray-700 dark:text-gray-200'/>
            </span>
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-30 mt-2 w-80 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div onScroll={handleScroll} ref={scrollContainerRef} className="overflow-y-auto h-[calc(100vh-170px)] pt-8">
              <div className='bg-gray-200 w-full px-4 py-2 fixed top-0 left-0'>
                <label className='flex items-center space-x-1'>
                  <input
                    onChange={() => setIsUnreadChecked(!isUnreadChecked)}
                    checked={isUnreadChecked}
                    type='checkbox'
                    className=''/>
                  <span className='text-xs'>Only display <b>Unread</b> items</span>
                </label>
              </div>
              {
                list?.map((notification: NotificationTypes) => (
                  (!notification.is_read || !isUnreadChecked) &&
                    <Menu.Item key={uuid()}>
                      <div
                        onClick={async () => await handleClick(notification)}
                        className={`${notification.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'} hover:bg-gray-100 mx-2 p-2 text-xs`}>
                        <div className='flex items-start justify-start space-x-2'>
                          <span className='flex-1' dangerouslySetInnerHTML={{ __html: notification.message }}/>
                          {
                            !notification.is_read && <ExclamationCircleIcon className={`${notification.is_read ? 'text-blue-300' : 'text-blue-500'} w-4 h-4`}/>
                          }
                        </div>
                        {/* @ts-expect-error */}
                        <div className='text-blue-700'>{formatDistance(new Date(), new Date(notification.created_at))} ago</div>
                      </div>
                    </Menu.Item>
                ))
              }
              {
                list?.length === 0 && <Menu.Item><div className='text-sm p-2 text-gray-500'>No notifications found.</div></Menu.Item>
              }
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
export default Notifications
