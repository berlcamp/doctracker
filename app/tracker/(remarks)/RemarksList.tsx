/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisHorizontalIcon, PencilIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useState } from 'react'
import uuid from 'react-uuid'
import { TrashIcon } from '@heroicons/react/24/outline'
import CommentsList from './CommentsList'
import CommentBox from './CommentBox'
import { format } from 'date-fns'
import { useSupabase } from '@/context/SupabaseProvider'
import ConfirmModal from '@/components/ConfirmModal'
import { useFilter } from '@/context/FilterContext'
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import type { DocumentTypes, RemarksTypes } from '@/types'
import Image from 'next/image'
import Avatar from 'react-avatar'

interface ModalProps {
  reply: RemarksTypes
  document: DocumentTypes
}

export default function RemarksList ({ reply, document }: ModalProps) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [remarks, setRemarks] = useState(reply.message)

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  // Delete confirmation
  const deleteReply = (id: string) => {
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
        .from('dum_remarks')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      // Remove remarks from redux
      const items = [...globalremarks]
      const updatedData = items.filter(item => item.id !== selectedId)
      dispatch(updateRemarksList(updatedData))
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateRemarks = async () => {
    try {
      const newData = {
        message: remarks
      }
      const { error }: { error: { message: string } } = await supabase
        .from('dum_remarks')
        .update(newData)
        .eq('id', reply.id)

      if (error) throw new Error(error.message)

      // Update data in remarks redux
      const items = [...globalremarks]
      const updatedData = { ...newData, id: reply.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateRemarksList(items))

      setEditMode(false)
    } catch (e) {
      console.error(e)
    }
  }

  // Only enable Edit/delete to author
  const isAuthor = reply.sender_id === session.user.id

  // Only display private note to author
  if (reply.is_private && reply.sender_id !== session.user.id) return

  return (
    <div className={`w-full flex-col space-y-1 px-4 ${reply.reply_type !== 'system' ? 'py-4 border-t' : 'py-px'} text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400`}>
      <div className='w-full group'>
        <div className='flex items-center space-x-2'>
          <div className='flex flex-1 items-center space-x-2'>
            {
              reply.dum_users.avatar_url !== null
                ? <div className='relative flex items-center justify-center bg-black overflow-hidden'>
                    <Image src={reply.dum_users?.avatar_url} width={30} height={30} alt='user'/>
                  </div>
                : <Avatar round={false} size="30" name={reply.dum_users.name}/>
            }
            <div>
              {
                reply.reply_type !== 'system' &&
                  <>
                    <div className='font-bold'>
                      <span>{reply.dum_users.name}: </span>
                    </div>
                    <div
                      className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                        { format(new Date(reply.created_at), 'dd MMM yyyy h:mm a') }
                    </div>
                  </>
              }
              {
                reply.is_private &&
                <div className='mt-1'>
                  <span className='bg-orange-300 text-orange-900 px-1 py-px rounded-sm'>Private Note (Only you can view this)</span>
                </div>
              }

            </div>
          </div>
          <div className={`${(isAuthor) ? 'hidden group-hover:flex' : 'hidden'} items-center space-x-2`}>
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
                    {/* <Menu.Item>
                      <div
                          onClick={() => setEditMode(true)}
                          className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                        >
                          <PencilIcon className='w-4 h-4'/>
                          <span>Edit</span>
                      </div>
                    </Menu.Item> */}
                    <Menu.Item>
                      <div
                          onClick={() => deleteReply(reply.id)}
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

        <div className='ml-12'>
          {/* Message */}
          <div className='mt-1'>
            <div className={`mt-2 ${reply.is_private && ' bg-orange-100 p-2 border border-orange-200 rounded-sm'}`}>
              {!editMode && <span>{reply.message}</span>}
              {
                editMode &&
                  <div className='mb-4'>
                    <textarea
                      onChange={e => setRemarks(e.target.value)}
                      value={remarks}
                      className='w-full h-20 border focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'/>
                    <div className='flex space-x-2 items-center justify-start'>
                      <button
                        className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                        type="button"
                        onClick={handleUpdateRemarks}
                        >Save</button>
                      <button
                        onClick={() => setEditMode(false)}
                        type="button"
                        className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-xs text-white rounded-sm"
                      >Cancel
                      </button>
                    </div>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div className='border-l ml-20'>
        {/* Reply To Reply Box */}
        {
          (!reply.is_private) &&
            <CommentBox
              document={document}
              reply={reply}
            />
        }

        {/* Comments */}
        {
          (!reply.is_private) &&
            reply.dum_remarks_comments?.map((comment) => (
              <CommentsList
                comment={comment}
                reply={reply}
                key={uuid()}/>
            ))
        }
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
      </div>
    </div>
  )
}
