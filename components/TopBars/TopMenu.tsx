'use client'
import React, { useEffect, useRef, useState } from 'react'
import { MainMenu } from '@/components'
import { Squares2X2Icon } from '@heroicons/react/20/solid'

interface propTypes {
  darkMode?: boolean
}

const TopMenu = ({ darkMode }: propTypes) => {
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
      <div ref={wrapperRef} className='relative inline-block mr-4'>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className='flex items-center py-1 cursor-pointer text-gray-500 focus:ring-0 focus:outline-none'>
            <span className={`inline-flex items-center justify-center rounded-full ${darkMode ? 'bg-white' : 'bg-gray-500 bg-opacity-30'} w-8 h-8`}>
              <Squares2X2Icon className='w-4 h-4 text-gray-800'/>
            </span>
        </div>

        <div className={`${showDropdown ? '' : 'hidden'} absolute -right-8 md:right-0 z-30 mt-2 origin-top-right rounded-md bg-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
          <MainMenu/>
        </div>

      </div>
    </>
  )
}
export default TopMenu
