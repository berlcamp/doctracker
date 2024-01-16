'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import type { FlowListTypes } from '@/types'
import { format } from 'date-fns'
import React, { useEffect, useState } from 'react'

function StatusFlow ({ documentId, updateStatusFlow }: { documentId: string, updateStatusFlow: boolean }) {
  const [flowList, setFlowList] = useState<FlowListTypes[] | []>([])
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      const { data }: { data: FlowListTypes[] } = await supabase
        .from('dum_tracker_flow')
        .select('*, dum_user:user_id(name,dum_departments:department_id(name)),dum_department:department_id(id,name),dum_tracker_logs(*, dum_user:user_id(name))', { count: 'exact' })
        .eq('tracker_id', documentId)

      setFlowList(data)
    }
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateStatusFlow])

  return (
    <div className='w-full text-xs'>
      {
        flowList.length > 0 && (
          flowList.map((item, index) => (
            <div key={index} className='flex'>
              <div className={`px-4 ${index === 0 || (index + 1) < flowList.length ? 'border-r-2 border-gray-600 border-dashed' : ''}`}>
                <div>{format(new Date(item.created_at), 'dd MMM yyyy')}</div>
                <div>{format(new Date(item.created_at), 'h:mm a')}</div>
              </div>
              <div className='relative'>
                <span className={`absolute -top-1 ${index === 0 || (index + 1) < flowList.length ? '-left-[11px]' : '-left-[9px]'} inline-flex items-center justify-center border border-gray-600 rounded-full bg-white w-5 h-5`}>
                  <span className='rounded-full px-1 text-white text-xs'></span>
                </span>
              </div>
              <div className={`${flowList.length > 1 && (index + 1) < flowList.length ? 'text-gray-500' : 'text-gray-700 text-sm'} flex-1 ml-8 pb-4`}>
                <div className='font-bold'>{item.status}</div>
                <div className='text-xs'>{item.status === 'Forwarded' ? 'to' : 'at'}  {item.dum_department.name}</div>
                <div className='text-xs'>by {item.dum_user.name} ({item.dum_user.dum_departments.name})</div>
                <div className='ml-12'>
                  {
                    item.dum_tracker_logs.length > 0 && item.dum_tracker_logs.map((log, index) => (
                      <div key={index} className='text-[11px]'>
                        <span className='font-semibold'>{log.dum_user.name} </span>
                        <span>{log.message}</span>
                        <span> on {format(new Date(log.created_at), 'dd MMM yyyy h:mm a')}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          ))
        )
      }
    </div>
  )
}

export default StatusFlow
