'use client'
import React, { Fragment, useState } from 'react'
import { format } from 'date-fns'
import { useSupabase } from '@/context/SupabaseProvider'

export default function CommentBox ({ replyId, handleInsertToList }) {
  const { supabase, session } = useSupabase()

  const [reply, setReply] = useState('')
  const [showCommentInput, setShowCommentInput] = useState(false)

  const handleSubmitReply = async () => {
    // Insert into reply to database table
    const newData = {
      parent_document_reply_id: replyId,
      sender_id: session.user.id,
      message: reply,
      is_private: false
    }
    const { data, error } = await supabase
      .from('document_tracker_replies')
      .insert(newData)
      .select()

    if (error) {
      console.error(error)
      return
    }

    // Insert the list from parent component
    const updatedNewData = {
      ...newData,
      id: data[0].id,
      created_at: format(Date.now(), 'dd MMM yyyy HH:mm'),
      asenso_users: { firstname: session.user.email.split('@')[0] }
    }
    handleInsertToList(updatedNewData)

    setReply('')
    setShowCommentInput(false)
  }

  return (
    <div className='w-full flex-col space-y-2 px-4 mt-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
      {
        !showCommentInput &&
          <button
            onClick={() => setShowCommentInput(true)}
            className="text-xs mb-2 font-semibold underline text-green-700"
            type="button">
              Write Comment</button>
      }
      {
        showCommentInput &&
          <>
            <div className='flex space-x-2'>
              <span className='flex-1 font-bold'>Comment:</span>
            </div>
            <input
              type="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              className='w-full border focus:ring-0 focus:outline-none p-1 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'/>

              <div className='flex items-center space-x-2 justify-start'>
                <button
                  onClick={handleSubmitReply}
                  className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                  type="button"
                  >Submit</button>
                  <button
                  onClick={() => setShowCommentInput(false)}
                  className="bg-gray-500 hover:bg-gray-600 border border-gray-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                  type="button"
                  >Cancel</button>
              </div>
            </>
        }
    </div>
  )
}
