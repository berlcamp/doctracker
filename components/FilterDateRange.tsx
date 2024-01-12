'use client'
import { CalendarDaysIcon } from '@heroicons/react/20/solid'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import React, { useEffect, useRef, useState } from 'react'

interface PropTypes {
  dateFrom: string
  dateTo: string
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
}

export default function FilterDateRange ({ dateFrom, dateTo, setDateFrom, setDateTo }: PropTypes) {
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
      <div ref={wrapperRef} className='inline-flex relative border rounded-lg border-gray-300 mt-0 mr-2 py-1 bg-white dark:bg-gray-300'>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className='mx-2 py-1 cursor-pointer text-gray-500 focus:ring-0 focus:outline-none text-xs text-left flex items-center'>
          <CalendarDaysIcon className="w-4 h-4 mr-2"/>
          <span>Date Created: { dateFrom !== '' && `From: ${dateFrom} `} { dateTo !== '' && `To: ${dateTo}`}</span>
          <ChevronDownIcon className="w-4 h-4 ml-2"/>
        </div>

        <div className={`${!showDropdown ? 'hidden' : ''} border absolute z-40 top-9 left-0 bg-white divide-y divide-gray-100 dark:bg-gray-700`}>
          <div className="flex items-center">
            <div className='flex-1 px-2 text-xs font-bold'>Filter Date Range</div>
            <button
              onClick={() => setShowDropdown(false) }
              type="button"
              className="text-xl px-2 justify-end btn-close box-content p-1 text-gray-600">
                &times;
            </button>
          </div>
          <div className="flex items-center justify-center px-4 py-2 space-x-2">
            <div className="relative form-floating">
              <label className="text-gray-700 text-xs">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="form-control block w-full px-3 py-1.5 text-xs font-normal focus:ring-0 focus:outline-none text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600"/>
            </div>
            <div className="relative form-floating" data-mdb-toggle-button="false">
              <label className="text-gray-700 text-xs">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="form-control block w-full px-3 py-1.5 text-xs font-normal focus:ring-0 focus:outline-none text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600"/>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
