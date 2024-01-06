import React from 'react'
import Notifications from '@/components/TopBars/Notifications'
import UserDropdown from '@/components/TopBars/UserDropdown'
import TopMenu from '@/components/TopBars/TopMenu'

function TopBar () {
  return (
    // <div className='absolute top-1 z-10 right-4 flex space-x-2'>
    //     <TopMenu/>
    //     <Notifications/>
    //     <UserDropdown/>
    // </div>
    <div className='fixed top-0 right-0 z-20 p-2 flex items-center w-full bg-gray-50 shadow-md'>
      <div className='flex-1'>
      </div>
      <div className='flex space-x-2'>
        <TopMenu darkMode={false}/>
        <Notifications darkMode={false}/>
        <UserDropdown darkMode={false}/>
      </div>
    </div>
  )
}

export default TopBar
