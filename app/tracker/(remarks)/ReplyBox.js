'use client'
import { Menu, Transition } from '@headlessui/react'
import { EyeIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useState } from 'react'
import { format } from 'date-fns'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'

// Redux staff
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

export default function ReplyBox ({ document, handleInsertToList }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const globallist = useSelector((state) => state.list.value)
  const dispatch = useDispatch()

  const [replyType, setReplyType] = useState('Public')
  const [remarks, setRemarks] = useState('')

  const handleSubmitReply = async () => {
    const newData = {
      document_tracker_id: document.id,
      sender_id: session.user.id,
      message: remarks,
      is_private: replyType === 'Private Note'
    }
    // Insert into replies database table
    const { data, error } = await supabase
      .from('dum_document_tracker_replies')
      .insert(newData)
      .select()

    if (error) {
      console.error('naai error', error)
      return
    }

    // Update the remarks context
    const newRemarks = [...document.dum_document_tracker_replies, { is_private: replyType === 'Private Note', reply_type: '', message: remarks }]
    const updatedList = { document_tracker_replies: newRemarks, id: document.id }
    handleUpdateList(updatedList)

    // Update the list from parent component
    const updatedNewData = {
      ...newData,
      id: data[0].id,
      new: true,
      created_at: format(Date.now(), 'dd MMM yyyy HH:mm'),
      asenso_users: { firstname: session.user.email.split('@')[0] }
    }
    handleInsertToList(updatedNewData)

    setRemarks('')

    // pop up the success message
    setToast('success', 'Remarks successfully added.')
  }

  const handleUpdateList = (updatedData) => {
    const items = [...globallist] // use spread operator to make array mutable
    const foundIndex = items.findIndex(x => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    // Update redux
    dispatch(updateList(items))
  }

  return (
    <div className='w-full flex-col space-y-2 px-4 py-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
      <div className='flex space-x-2'>
        <span className='font-bold'>Write remarks:</span>
      </div>

      <textarea
        onChange={e => setRemarks(e.target.value)}
        value={remarks}
        className='w-full h-20 border focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'></textarea>

      <div className='flex items-center'>

        {/* Public/Private */}
        <div className='flex items-center px-2'>
          <Menu as="div" className="relative inline-block text-left mr-2">
            <div>
              <Menu.Button className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                <EyeIcon className="w-4 h-4 mr-1"/>
                { replyType }
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-50 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    <div
                        onClick={e => setReplyType('Public')}
                        className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                      >
                        <span>Public</span>
                    </div>
                  </Menu.Item>
                  <Menu.Item>
                    <div
                        onClick={e => setReplyType('Private Note')}
                        className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                      >
                        <span>Private Note</span>
                    </div>
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        {/* End - Public/Private */}

        <button
          className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
          type="button"
          onClick={handleSubmitReply}
          >Submit</button>
      </div>

    </div>
  )
}
