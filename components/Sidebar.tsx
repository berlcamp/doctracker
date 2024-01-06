'use client'
import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

function Sidebar ({ children }: { children: React.ReactNode }) {
  const [viewSidebar, setViewSidebar] = useState(true)

  return (
    <div>
      <button
        onClick={ () => setViewSidebar(!viewSidebar) }
        type="button"
        className="fixed top-0 left-0 z-30 inline-flex items-center p-2 mt-2 ml-3 text-sm rounded-lg focus:outline-none focus:ring-2  text-gray-600 hover:bg-gray-300 focus:ring-gray-200">
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
        </svg>
      </button>

      <aside className={`${!viewSidebar ? '' : '-translate-x-full lg:translate-x-0'} fixed top-0 left-0 z-30 w-64 h-screen transition-transform`} aria-label="Sidebar">
        <div className="h-full px-1 py-4 overflow-y-auto bg-gray-800">
            <ul className="space-y-2">
              <li>
                  <div className='flex justify-end'>
                    <XMarkIcon
                      className="lg:hidden mr-2 w-6 h-6 cursor-pointer text-white bg-gray-700 hover:bg-gray-600"
                      onClick={ () => setViewSidebar(!viewSidebar)}
                    />
                  </div>

              </li>
            </ul>
            {
              children
            }
        </div>
      </aside>
    </div>
  )
}

export default Sidebar
