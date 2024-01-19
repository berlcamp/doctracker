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
    <div className='fixed top-0 right-0 z-20 lg:z-40 flex items-center w-full bg-gray-50 lg:bg-gray-800 shadow-md'>
      <div className='-translate-x-full lg:translate-x-0 z-30 w-64'>&nbsp;</div>
      <div className='flex flex-1 p-2 items-center bg-gray-50 justify-end'>
        <TopMenu darkMode={false}/>
        <Notifications darkMode={false}/>
        <UserDropdown darkMode={false}/>
      </div>
    </div>
  )
}

export default TopBar
