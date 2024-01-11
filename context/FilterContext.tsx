'use client'
import React, { useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSupabase } from '@/context/SupabaseProvider'
import { OfflinePage } from '@/components'

const FilterContext = React.createContext<any | ''>('')

export function useFilter () {
  return useContext(FilterContext)
}

export function FilterProvider ({ children }: { children: React.ReactNode }) {
  const { systemSettings, session } = useSupabase()
  const [isOnline, setIsOnline] = useState(true)
  const [filters, setFilters] = useState({})
  const [perPage, setPerPage] = useState(10)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [ipcrfTotalScore, setIpcrfTotalScore] = useState([])

  const setToast = (type: string, message: string) => {
    if (type === 'success') {
      toast.success(message)
    }
    if (type === 'error') {
      toast.error(message)
    }
  }

  const hasAccess = (page: string) => {
    const systemAccess = systemSettings.filter((item: { type: string }) => item.type === 'system_access')
    const access = systemAccess[0].data.filter((item: { access_type: string }) => item.access_type === page)

    if (access.length === 0) return false

    const accessList = access[0].data
    if (!accessList.some((el: { id: string }) => el.id === session?.user.id)) {
      return false
    }
    return true
  }

  useEffect(() => {
    function handleOnlineStatus () {
      setIsOnline(true)
    }

    function handleOfflineStatus () {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOfflineStatus)

    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOfflineStatus)
    }
  }, [])

  const value = {
    filters,
    setFilters,
    hasAccess,
    setToast,
    perPage,
    setPerPage,
    isDarkMode,
    setIsDarkMode,
    ipcrfTotalScore,
    setIpcrfTotalScore
  }

  return (
      <FilterContext.Provider value={value}>
          {
            !isOnline
              ? <><OfflinePage/><div className='pointer-events-none'>{children}</div></>
              : children
          }
      </FilterContext.Provider>
  )
}
