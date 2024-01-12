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
        .select('*, dum_user:user_id(*),dum_department:department_id(id,name)', { count: 'exact' })
        .eq('tracker_id', documentId)

      setFlowList(data)
    }
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateStatusFlow])

  return (
    <div className='w-full'>
        <div className='mx-2 mt-4 px-4 py-4 text-xs text-gray-600 bg-gray-100'>
          <div className='mb-6 px-4'>
            <span className='font-semibold text-sm'>Tracker</span>
          </div>
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
                      <span className='rounded-full px-1 text-white text-xs'>3</span>
                    </span>
                  </div>
                  <div className={`${flowList.length > 1 && (index + 1) < flowList.length ? 'text-gray-500' : 'text-gray-700 text-sm'} ml-8 pb-4`}>
                    <div className='font-bold'>{item.status}</div>
                    <div className='text-xs'>{item.status === 'Forwarded' ? 'to' : 'at'}  {item.dum_department.name}</div>
                    <div className='text-xs'>by {item.dum_user.name}</div>
                  </div>
                </div>
              ))
            )
          }
        </div>
      </div>
  )
}

export default StatusFlow
