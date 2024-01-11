'use client'

import type { LogTypes, RepliesDataTypes } from '@/types'
import { format } from 'date-fns'
import React, { useState } from 'react'

interface ModalProps {
  logs: RepliesDataTypes[]
}

export default function SystemLogs ({ logs }: ModalProps) {
  const [viewSystemLogs, setViewSystemLogs] = useState(false)

  const formattedData: LogTypes[] = logs.map((item) => {
    return { ...item, created_at: format(new Date(item.created_at), 'dd MMM yyyy HH:mm'), message: JSON.parse(item.message) }
  })

  return (
    <div className='px-4 lg:px-0 w-full relative my-2'>
      <div className='py-2 mx-4 outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100'>
        <div className='px-4 font-medium my-2'>Changed Logs:</div>
        {
          formattedData.map((log, index) => (
            <div key={index} className='w-full flex-col space-y-1 px-4 py-px text-xs text-gray-600'>
              <div className='w-full'>
                <div className=''>
                  <div className='text-gray-500 text-[10px] italic'>
                    {log.dum_users.name} made changes on { log.created_at }
                    <span
                      onClick={() => setViewSystemLogs(!viewSystemLogs)}
                      className='cursor-pointer text-green-700 font-semibold'>
                      &nbsp;View Changes
                    </span>
                  </div>
                  {
                    viewSystemLogs &&
                      <div className='mt-2 bg-blue-100 p-2 border border-blue-200 rounded-sm'>
                        {
                          log.message.map((log, index) => (
                            <React.Fragment key={index}>
                              {
                                log.new_value &&
                                  <div>Updated {log.field} from {'"'}{log.old_value}{'"'} to {'"'}{log.new_value}{'"'}</div>
                              }
                            </React.Fragment>
                          ))
                        }
                      </div>
                  }
                </div>
              </div>
            </div>
          ))
        }
      </div>

    </div>
  )
}
