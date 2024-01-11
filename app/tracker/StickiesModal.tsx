/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import React, { useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseProvider'
import { XMarkIcon } from '@heroicons/react/24/solid'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { ConfirmModal } from '@/components'
import type { StickiesTypes } from '@/types'
import { useFilter } from '@/context/FilterContext'

interface ModalProps {
  hideModal: () => void
}

export default function StickiesModal ({ hideModal }: ModalProps) {
  const [selectedId, setSelectedId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [list, setList] = useState<StickiesTypes[] | []>([])

  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const handleNoteChange = async (value: string, id: string, index: number) => {
    const { error } = await supabase
      .from('dum_document_tracker_stickies')
      .update({
        note: value
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      return
    }

    const newData = [...list]
    newData[index].note = value
    setList(newData)
  }

  const handleDelete = (id: string) => {
    setShowConfirmation(true)
    setSelectedId(id)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedId('')
  }
  const handleConfirm = async () => {
    await handleDeleteReply()
    setShowConfirmation(false)
  }
  const handleDeleteReply = async () => {
    try {
      const { error }: { error: { message: string } } = await supabase
        .from('dum_document_tracker_stickies')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      setList(prevList => prevList.filter(item => item.id !== selectedId))

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    } catch (e) {
      console.error(e)
    }
  }

  const fetchData = async () => {
    const { data } = await supabase
      .from('dum_document_tracker_stickies')
      .select('*, dum_document_trackers:document_tracker_id(*)')
      .eq('user_id', session.user.id)
      .order('id', { ascending: true })

    // Store list to redux
    setList(data)
  }

  useEffect(() => {
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Stickies
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <div className="modal-body relative p-4 overflow-x-scroll">
              <div className='items-center mx-4'>
                {
                  !list &&
                    <TwoColTableLoading/>
                }
                { list?.length === 0 &&
                  <div>
                    <h3 className='text-sm text-gray-700'>No items added to stickies yet.</h3>
                  </div>
                }
                {
                  list?.map((item, index) => (
                    <div key={index} style={{ backgroundColor: `${item.color}` }} className='relative max-w-xs mr-4 mb-4 shadow-lg inline-flex flex-col rounded-sm p-2 text-xs'>
                      <XMarkIcon
                        onClick={() => handleDelete(item.id)}
                        className='w-5 h-5 cursor-pointer text-gray-700 absolute z-30 top-1 right-1'/>
                      <div className='grid grid-cols-1 gap-2 mb-4'>
                        <div className='w-full'>
                          <span>Routing No: </span>
                          <span className='text-green-900'>
                            <span className='font-bold'>{item.dum_document_trackers.routing_slip_no}</span>
                          </span>
                        </div>
                      </div>
                      <div className='grid grid-cols-1 gap-2 mb-4'>
                        <div className='w-full'>
                          <span>Type: </span>
                          <span className='font-bold'>{item.dum_document_trackers.type}</span>
                        </div>
                      </div>
                      <div className='grid grid-cols-1 gap-2 mb-4'>
                        <div className='w-full'>
                          <span>Particulars: </span>
                          <span className='font-bold'>{item.dum_document_trackers.particulars}</span>
                        </div>
                      </div>
                      <div className='grid grid-cols-1 gap-1 mb-4'>
                        <div className='w-full'>
                          <span>Note: </span>
                        </div>
                        <textarea
                            defaultValue={item.note}
                            onBlur={e => handleNoteChange(e.target.value, item.id, index)}
                            className='w-full text-sm py-1 px-2 text-gray-600 resize-none rounded-sm focus:ring-0 focus:outline-none'/>
                      </div>
                    </div>
                  ))
                }
                {/* Confirm Delete Modal */}
                {
                  showConfirmation && (
                    <ConfirmModal
                      btnText='Yes'
                      header='Delete Sticky'
                      message="Are you sure you want to delete this Sticky?"
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                    />
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
