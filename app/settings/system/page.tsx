/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import TopBar from '@/components/TopBar'
import { Sidebar, SettingsSideBar, Title, Unauthorized } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import React, { useEffect, useState } from 'react'
import SelectUserNames from './SelectUserNames'
import { useFilter } from '@/context/FilterContext'

import type { settingsDataTypes } from '@/types'
import { superAdmins } from '@/constants/TrackerConstants'

const Page: React.FC = () => {
  const { supabase, session } = useSupabase()
  const [settingsData, setSettingsData] = useState<settingsDataTypes[] | []>([])
  const [results, setResults] = useState(false)
  const [settingsId, setSettingsId] = useState(null)
  const { setToast } = useFilter()

  const handleSave = async () => {
    let query = supabase
      .from('system_settings')

    if (settingsId) {
      query = query.upsert({ id: settingsId, type: 'system_access', data: settingsData })
    } else {
      query = query.insert({ type: 'system_access', org_id: process.env.NEXT_PUBLIC_ORG_ID, data: settingsData })
    }
    query = query.select()

    const { error } = await query

    if (error) {
      console.error(error)
    } else {
      // pop up the success message
      setToast('success', 'Successfully saved.')
    }
  }

  const handleManagerChange = (newdata: any, type: string) => {
    const tempSettings = Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type !== type) : []
    const updatedSettings: settingsDataTypes[] = [...tempSettings, { access_type: type, data: newdata }]
    console.log(updatedSettings)
    setSettingsData(updatedSettings)
  }

  const fetchData = async () => {
    const { data: res, error } = await supabase
      .from('system_settings')
      .select()
      .eq('type', 'system_access')
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)
      .limit(1)
      .single()

    if (error) console.error(error)

    if (res) {
      setResults(true)
      setSettingsData(res.data)
      setSettingsId(res.id)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  // Check access from permission settings or Super Admins
  if (!superAdmins.includes(session.user.email)) return <Unauthorized/>

  return (
    <>
      <Sidebar>
        <SettingsSideBar/>
      </Sidebar>
      <div className="app__main">
        <div>
            {/* Header */}
            <TopBar/>
            <div className='app__title'>
              <Title title='System Permissions'/>
            </div>

            <div className='app__content'>
              {
                results && (
                  <>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='document_tracker' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'document_tracker') : []} title='Who can Manage Entire Document Tracker System'/>
                  </>
                )
              }
              <button
                onClick={handleSave}
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm">
                Save Settings
              </button>
            </div>

        </div>
      </div>
    </>
  )
}
export default Page
