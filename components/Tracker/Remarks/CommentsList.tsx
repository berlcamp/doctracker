'use client'
import ConfirmModal from '@/components/ConfirmModal'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { AccountTypes, CommentsTypes, DocumentTypes, RemarksTypes } from '@/types'
import { Menu, Transition } from '@headlessui/react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import Image from 'next/image'
import React, { Fragment, useState } from 'react'
import Avatar from 'react-avatar'

interface ModalProps {
  comment: CommentsTypes
  reply: RemarksTypes
  document: DocumentTypes
}

export default function CommentsList ({ document, comment, reply }: ModalProps) {
  const [selectedId, setSelectedId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { supabase, systemUsers, session } = useSupabase()
  const { setToast } = useFilter()

  // Only enable Edit/delete to author
  const isAuthor = comment.sender_id === session.user.id

  const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  // Delete confirmation
  const deleteComment = (id: string) => {
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
      const { error } = await supabase
        .from('dum_remarks_comments')
        .delete()
        .eq('id', selectedId)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (error) throw new Error(error.message)

      // Update data in remarks redux
      const items = [...globalremarks]
      const updatedCommentData = reply.dum_remarks_comments.filter(item => item.id !== selectedId)
      const updatedData = { dum_remarks_comments: [...updatedCommentData], id: reply.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateRemarksList(items))

      // pop up the success message
      setToast('success', 'Successfully Deleted!')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className='w-full group flex-col space-y-2 px-4 pt-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
        <div className='flex items-start space-x-2'>
          <div className='flex flex-1 items-start space-x-2'>
            {
              comment.dum_users.avatar_url !== null
                ? <div className='relative flex items-center justify-center bg-black overflow-hidden'>
                    <Image src={comment.dum_users?.avatar_url} width={30} height={30} alt='user'/>
                  </div>
                : <Avatar round={false} size="30" name={comment.dum_users.name}/>
            }
            <div>
            <div className='font-bold'>{comment.dum_users?.name}:</div>
              <div
                className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                  { format(new Date(comment.created_at), 'dd MMM yyyy h:mm a') }
              </div>
            </div>
          </div>
          {/* Only receiving department can delete comments */}
          {
            ((document.current_status === 'Received' || document.current_status === 'Tracker Created') && document.current_department_id === user.department_id) &&
              <div className={`${isAuthor ? 'hidden group-hover:flex' : 'hidden'} items-start space-x-2`}>
                <Menu as="div" className="relative inline-block text-left mr-2">
                  <div>
                    <Menu.Button className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                      <EllipsisHorizontalIcon className='w-6 h-6'/>
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
                            onClick={() => deleteComment(comment.id)}
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
          }
        </div>
        <div className='mt-2 ml-12'>{comment.message}</div>
      </div>
      {/* Confirm Delete Modal */}
      {
        showConfirmation && (
          <ConfirmModal
            btnText='Yes'
            header='Confirmation'
            message="Are you sure you want to perform this action?"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )
        }
    </>
  )
}
