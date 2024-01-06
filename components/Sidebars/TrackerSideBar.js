'use client'
import { Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import { useFilter } from '@/context/FilterContext'

const TrackerSideBar = () => {
  const currentRoute = usePathname()
  const { hasAccess } = useFilter()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <Cog6ToothIcon className='w-4 h-4'/>
            <span>Menu</span>
          </div>
        </li>
        {
          (hasAccess('document_tracker')) &&
            <li>
              <Link
                href="/tracker"
                className={`app__menu_link ${currentRoute === '/tracker' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Document Tracker</span>
              </Link>
          </li>
        }
      </ul>
    </>
  )
}

export default TrackerSideBar