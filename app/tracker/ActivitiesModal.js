'use client'
import uuid from 'react-uuid'
import { format } from 'date-fns'

export default function ActivitiesModal ({ hideModal, activitiesData }) {
  return (
    <>
      <div className="z-30 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Upcoming Activities
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <div className="modal-body relative p-4 overflow-x-scroll">

              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="py-2 px-2 w-32">
                            Routing&nbsp;No
                        </th>
                        <th className="py-2 px-2 w-32"></th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Activity&nbsp;Date
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Particulars
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Remarks
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
                        key={uuid()}
                        className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600">
                        <th
                          className="py-2 px-2 text-gray-900 dark:text-white">
                          <div className="font-semibold">
                            {item.routing_slip_no}
                          </div>

                          {/* Mobile View */}
                          <div>
                            <div className="md:hidden py-2">
                              <span className='font-light'>Activity&nbsp;Date: </span>
                              <span className='font-semibold'>{format(new Date(item.activity_date), 'dd MMM yyyy hh:mm')}</span>
                            </div>
                          </div>
                          <div>
                            <div className="md:hidden py-2">
                              <span className='font-light'>Particulars: </span>
                              <span className='font-semibold'>{item.particulars}</span>
                            </div>
                          </div>
                          <div>
                            <div className="md:hidden py-2">
                              <span className='font-light'>Remarks: </span>
                              <div>
                                {item.id < 100209 && <div>{item.remarks}</div>}
                                {
                                  item.dum_document_tracker_replies?.map(reply => (
                                    <div key={uuid()}>
                                      {
                                        (!reply.is_private && reply.reply_type !== 'system') &&
                                          reply.message
                                      }
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          </div>
                          {/* End - Mobile View */}

                        </th>
                        <td className="py-2 px-2">
                          {/* {
                            (item.dum_document_tracker_stickies.length > 0 && item.dum_document_tracker_stickies.user_id === session.user.id)
                              ? <StarIcon className='w-4 h-4 text-yellow-500'/>
                              : <button
                                  onClick={() => handleAddToStickies(item, index)}
                                  className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm">
                                  <StarIcon className='w-4 h-4 mr-1 text-yellow-400'/>
                                  <span>Add&nbsp;to&nbsp;Stickes</span>
                                </button>
                          } */}
                        </td>
                        <td className="hidden md:table-cell py-2 px-2">
                          {format(new Date(item.activity_date), 'dd MMM yyyy')}
                        </td>
                        <td className="hidden md:table-cell py-2 px-2">
                          {item.particulars}
                        </td>
                        <td className="hidden md:table-cell py-2 px-2">
                          <div>
                            {item.id < 100209 && <div>{item.remarks}</div>}
                            {
                              item.dum_document_tracker_replies?.map(reply => (
                                <div key={uuid()}>
                                  {
                                    (!reply.is_private && reply.reply_type !== 'system') &&
                                      reply.message
                                  }
                                </div>
                              ))
                            }
                          </div>
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
