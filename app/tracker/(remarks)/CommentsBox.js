'use client'
import ConfirmModal from '@/components/ConfirmModal'
import DeleteModal from '@/components/DeleteModal'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Menu, Transition } from '@headlessui/react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { EllipsisHorizontalIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useState } from 'react'

export default function CommentsBox ({ reply, handleRemoveFromList }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  // Only enable Edit/delete to author
  const isAuthor = reply.sender_id === session.user.id

  // Delete confirmation
  const deleteComment = (id) => {
    setShowConfirmation(true)
    setSelectedId(id)
  }
  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedId(null)
  }
  const handleConfirm = async () => {
    await handleDeleteReply()
    setShowConfirmation(false)
  }
  const handleDeleteReply = async () => {
    try {
      const { error } = await supabase
        .from('document_tracker_replies')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      handleRemoveFromList(selectedId)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    }
  }

  return (
    <>
      <div className='w-full group flex-col space-y-2 px-4 pt-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
        <div className='flex items-center space-x-2'>
          <div className='flex flex-1 items-center space-x-2'>
            <UserCircleIcon className='w-10 h-10'/>
            <div>
            <div className='font-bold'>{reply.asenso_users?.firstname}:</div>
              <div
                className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center"
                data-bs-toggle="dropdown"
                type="button">
                  { reply.created_at }
              </div>
            </div>
          </div>
          <div className={`${isAuthor ? 'hidden group-hover:flex' : 'hidden'} items-center space-x-2`}>
              <Menu as="div" className="relative inline-block text-left mr-2">
                <div>
                  <Menu.Button className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                    <EllipsisHorizontalIcon className='w-8 h-8'/>
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
                  <Menu.Items className="absolute right-0 z-50 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        <div
                          onClick={() => deleteComment(reply.id)}
                          className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                          >
                            <TrashIcon className='w-4 h-4'/>
                            <span>Delete</span>
                        </div>
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        <div className='mt-2 ml-12'>{reply.message}</div>
      </div>
      {/* Confirm Delete Modal */}
      {
        showConfirmation && (
          <ConfirmModal
            message="Are you sure you want to perform this action?"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )
        }
    </>
  )
}
