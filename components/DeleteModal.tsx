'use client'
import React, { useState } from 'react'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

interface ModalProps {
  hideModal: () => void
  selectedId: string
  table: string
  title?: string
  resultsCount: number
  setResultsCount: (count: number) => void
  showingCount: number
  setShowingCount: (count: number) => void
}

export default function DeleteModal ({ selectedId, title, table, hideModal, setResultsCount, resultsCount, setShowingCount, showingCount }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [deleting, setDeleting] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleDelete = async () => {
    if (deleting) return

    setDeleting(true)

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedList = items.filter(item => item.id !== selectedId)
      dispatch(updateList(updatedList))

      // Updating showing text
      setResultsCount(resultsCount - 1)
      setShowingCount(showingCount - 1)

      setDeleting(false)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      // hide the modal
      hideModal()
    }
  }

  return (

      <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] max-w-lg my-6 mx-auto relative w-auto pointer-events-none">
          <div className="max-h-full overflow-hidden border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800" id="exampleModalScrollableLabel">
                { title ?? 'Delete confirmation' }
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>
            <div className="modal-body relative p-4">
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Please confirm this </div>
                </div>
              </div>

              <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                    <button
                      onClick={handleDelete}
                      type="button"
                      className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >
                      Delete
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
