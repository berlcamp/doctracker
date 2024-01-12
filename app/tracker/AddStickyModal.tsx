'use client'
import React, { useState } from 'react'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import type { DocumentTypes } from '@/types'

interface ModalProps {
  hideModal: () => void
  hideAddStickButton: () => void
  item: DocumentTypes | null
}

export default function AddStickyModal ({ item, hideAddStickButton, hideModal }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const [color, setColor] = useState('#fb913c')
  const [note, setNote] = useState('')

  const handleAdd = async () => {
    if (!item) return

    const { error } = await supabase
      .from('dum_document_tracker_stickies')
      .insert({
        document_tracker_id: item.id,
        color,
        note,
        user_id: session.user.id
      })

    if (error) {
      console.error(error)
    } else {
      setToast('success', 'Successfully added to stickies')
    }
    hideModal()
    hideAddStickButton()
  }

  const handleChooseColor = (color: string) => {
    setColor(color)
  }

  if (!item) return

  return (

      <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] max-w-lg my-6 mx-auto relative w-auto pointer-events-none">
          <div className="max-h-full overflow-hidden border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800" id="exampleModalScrollableLabel">
                Add to Stickies
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>
            <div className="modal-body relative p-4">
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <span>Routing No: </span>
                  <span className='font-bold text-emerald-700'>{item.routing_slip_no}</span>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <span>Type: </span>
                  <span className='font-bold text-emerald-700'>{item.type}</span>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <span>Particulars: </span>
                  <span className='font-medium text-xs'>{item.particulars}</span>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <span>Notes:</span>
                </div>
                <div className='w-full'>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <span>Color:</span>
                </div>
                <div className='w-full flex items-center justify-start space-x-4'>
                  <div
                    onClick={() => handleChooseColor('#f87171')}
                    className='cursor-pointer bg-red-400 w-10 h-10 flex justify-end'>
                    {
                      color === '#f87171' &&
                        <CheckCircleIcon className='h-5 w-5 text-white'/>
                    }
                  </div>
                  <div
                    onClick={() => handleChooseColor('#fb913c')}
                    className='cursor-pointer bg-orange-400 w-10 h-10 flex justify-end'>
                    {
                      color === '#fb913c' &&
                        <CheckCircleIcon className='h-5 w-5 text-white'/>
                    }
                  </div>
                  <div
                    onClick={() => handleChooseColor('#49de80')}
                    className='cursor-pointer bg-green-400 w-10 h-10 flex justify-end'>
                    {
                      color === '#49de80' &&
                        <CheckCircleIcon className='h-5 w-5 text-white'/>
                    }
                  </div>
                  <div
                    onClick={() => handleChooseColor('#5fa5fa')}
                    className='cursor-pointer bg-blue-400 w-10 h-10 flex justify-end'>
                    {
                      color === '#5fa5fa' &&
                        <CheckCircleIcon className='h-5 w-5 text-white'/>
                    }
                  </div>
                  <div
                    onClick={() => handleChooseColor('#e5d21c')}
                    className='cursor-pointer bg-yellow-300 w-10 h-10 flex justify-end'>
                    {
                      color === '#e5d21c' &&
                        <CheckCircleIcon className='h-5 w-5 text-white'/>
                    }
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                    <button
                      onClick={handleAdd}
                      type="button"
                      className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={hideModal}
                      type="button"
                      className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >
                      Cancel
                    </button>
              </div>
            </div>
          </div>
        </div>
      </div>

  )
}
