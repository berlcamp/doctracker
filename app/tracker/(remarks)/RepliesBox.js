'use client'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisHorizontalIcon, PencilIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useEffect, useState } from 'react'
import uuid from 'react-uuid'
import { TrashIcon } from '@heroicons/react/24/outline'
import CommentsBox from './CommentsBox'
import CommentBox from './CommentBox'
import { format } from 'date-fns'
import DeleteModal from '@/components/DeleteModal'
import { useSupabase } from '@/context/SupabaseProvider'
import ConfirmModal from '@/components/ConfirmModal'
import { useFilter } from '@/context/FilterContext'

export default function RepliesBox ({ handleRemoveFromList, handleUpdateRemarksList, reply }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [viewSystemLogs, setViewSystemLogs] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [remarks, setRemarks] = useState(reply.message)

  // Only display private note to author
  if (reply.is_private && reply.sender_id !== session.user.id) return

  // Only enable Edit/delete to author
  const isAuthor = reply.sender_id === session.user.id

  const [comments, setComments] = useState(reply.new ? [] : null)
  const systemLogs = reply.reply_type === 'system' ? JSON.parse(reply.message) : null

  // const [loading, setLoading] = useState(false)

  // fetch comments
  const fetchComments = async () => {
    const { data: repliesData } = await supabase
      .from('document_tracker_replies')
      .select('*,asenso_users:sender_id(*)')
      .eq('parent_document_reply_id', reply.id)
      .order('id', { ascending: false })

    const formattedData = repliesData?.map(item => {
      return { ...item, created_at: format(new Date(item.created_at), 'dd MMM yyyy HH:mm') }
    })

    setComments(formattedData)
  }

  // Delete confirmation
  const deleteReply = (id) => {
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

  const handleRemoveCommentFromList = async (id) => {
    // Update the replies list on DOM
    setComments(prevList => prevList.filter(item => item.id !== id))
  }

  const handleInsertToList = (newData) => {
    setComments([newData, ...comments])
  }

  const handleUpdateRemarks = async () => {
    try {
      const { error } = await supabase
        .from('document_tracker_replies')
        .update({
          message: remarks
        })
        .eq('id', reply.id)

      if (error) throw error

      const updatedData = { message: remarks, id: reply.id }
      handleUpdateRemarksList(updatedData)

      setEditMode(false)
    } catch (error) {
      console.error('Thrown Error:', error.message)
    }
  }

  useEffect(() => {
    if (!reply.new) {
      fetchComments()
    }
  }, [])

  return (
    <div className={`w-full flex-col space-y-1 px-4 ${reply.reply_type !== 'system' ? 'py-4 border-t' : 'py-px'} text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400`}>
      <div className='w-full group'>
        <div className='flex items-center space-x-2'>
          <div className='flex flex-1 items-center space-x-2'>
            {reply.reply_type !== 'system' && <UserCircleIcon className='w-10 h-10'/>}
            <div>
              {
                reply.reply_type !== 'system' &&
                  <>
                    <div className='font-bold'>
                      <span>{reply.asenso_users.firstname}: </span>
                    </div>
                    <div
                      className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                        { reply.created_at }
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
          <div className={`${(reply.reply_type !== 'system' && isAuthor) ? 'hidden group-hover:flex' : 'hidden'} items-center space-x-2`}>
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
                          onClick={() => setEditMode(true)}
                          className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                        >
                          <PencilIcon className='w-4 h-4'/>
                          <span>Edit</span>
                      </div>
                    </Menu.Item>
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
          {
            reply.reply_type !== 'system' &&
              <div className='mt-1'>
                <div className={`mt-2 ${reply.is_private && ' bg-orange-100 p-2 border border-orange-200 rounded-sm'}`}>
                  {!editMode && <span>{remarks}</span>}
                  {
                    editMode &&
                      <div className='mb-4'>
                        <textarea
                          onChange={e => setRemarks(e.target.value)}
                          value={remarks}
                          className='w-full h-20 border focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'></textarea>
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
          }
          {
            (reply.reply_type === 'system') &&
              <>
                <div className='text-gray-500 text-[10px] italic'>
                  {reply.asenso_users.firstname} made changes on { reply.created_at }
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
                        systemLogs?.map(log => (
                          <React.Fragment key={uuid()}>
                            {
                              log.new_value &&
                                <div>Updated {log.field} from {'"'}{log.old_value}{'"'} to {'"'}{log.new_value}{'"'}</div>
                            }
                          </React.Fragment>
                        ))
                      }
                    </div>
                }
              </>
          }

        </div>
      </div>

      <div className='border-l ml-20'>

        {/* Reply To Reply Box */}
        {
          (!reply.is_private && reply.reply_type !== 'system') &&
            <CommentBox
              handleInsertToList={handleInsertToList}
              replyId={reply.id}
            />
        }

        {/* Comments */}
        {
          comments?.map((rep) => (
            <CommentsBox
              handleRemoveFromList={handleRemoveFromList}
              reply={rep}
              key={uuid()}/>
          ))
        }
        {/* Confirm Delete Modal */}
        {
          showDeleteModal && (
            <DeleteModal
              title='Are you sure you want to remove this remarks?'
              table='document_tracker_replies'
              handleRemoveFromList={handleRemoveFromList}
              selectedId={selectedId}
              hideModal={e => setShowDeleteModal(false)}/>
          )
        }

        {
          showConfirmation && (
            <ConfirmModal
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
