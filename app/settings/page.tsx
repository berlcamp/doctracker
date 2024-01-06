'use client'
import TopBar from '@/components/TopBar'
import { Sidebar, SettingsSideBar } from '@/components'
import { BookmarkIcon } from '@heroicons/react/24/solid'

export default function page () {
  return (
    <>
      <Sidebar>
        <SettingsSideBar/>
      </Sidebar>
      <div className="app__main">
        <TopBar/>
        <div>
          <div className="p-4 pt-20 text-gray-800 dark:text-gray-300 dark:bg-gray-900 h-screen">
            <div className="flex items-center justify-center space-x-2">
              <BookmarkIcon className='h-5 w-5 '/>
              <h1 className='text-3xl'>Settings and Permissions</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
