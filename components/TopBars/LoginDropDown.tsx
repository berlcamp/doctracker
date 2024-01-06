'use client'
import React, { useEffect, useRef, useState } from 'react'

import { LoginBox } from '@/components'
import { LockClosedIcon } from '@heroicons/react/24/solid'

interface propTypes {
  darkMode?: boolean
}

const LoginDropDown = ({ darkMode }: propTypes) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setShowDropdown(false)
    }
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [wrapperRef])

  return (
    <>
      <div ref={wrapperRef} className='relative inline-block mr-1'>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className='flex items-center space-x-2 py-1 cursor-pointer text-gray-300 focus:ring-0 focus:outline-none'>
            <span className={`inline-flex items-center justify-center rounded-full ${darkMode ? 'bg-white' : 'bg-gray-500 bg-opacity-30'} w-6 h-6`}>
              <LockClosedIcon className='w-4 h-4 text-gray-800'/>
            </span>
            <span className='font-semibold'>Login</span>
        </div>

        <div className={`${showDropdown ? '' : 'hidden'} absolute right-0 z-30 mt-2 origin-top-right rounded-md bg-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
          <LoginBox/>
        </div>
      </div>
    </>
  )
}
export default LoginDropDown
