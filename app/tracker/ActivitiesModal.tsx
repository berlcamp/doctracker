'use client'

import { format } from 'date-fns'
import type { DocumentTypes } from '@/types'
import { useEffect, useRef } from 'react'
import { CustomButton } from '@/components'
import { CalendarDaysIcon } from '@heroicons/react/20/solid'

interface ModalProps {
  hideModal: () => void
  activitiesData: DocumentTypes[]
}

export default function ActivitiesModal ({ hideModal, activitiesData }: ModalProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideModal()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef])

  return (
    <>
      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Upcoming Activities
              </h5>
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
            </div>

            <div className="modal-body relative p-4 overflow-x-scroll">

              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="py-2 px-2 w-32">
                            Routing&nbsp;No
                        </th>
                        <th className="py-2 px-2">
                            Activity&nbsp;Date
                        </th>
                        <th className="py-2 px-2">
                            Particulars
                        </th>
                    </tr>
                </thead>
                <tbody>
                  {
                    activitiesData?.length === 0 && <tr className='bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600'><td className='py-2 pl-4'>No records found.</td></tr>
                  }
                  {
                    activitiesData?.map((item, index) => (
                      <tr
                        key={index}
                        className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600">
                        <th
                          className="py-2 px-2 text-gray-900 dark:text-white">
                          <div className="font-semibold">
                            {item.routing_slip_no}
                          </div>

                        </th>
                        <td className="py-2 px-2">
                          <div className='flex items-center space-x-1'>
                            <CalendarDaysIcon className='w-5 h-5'/>
                            <span>{format(new Date(item.activity_date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {item.particulars}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
