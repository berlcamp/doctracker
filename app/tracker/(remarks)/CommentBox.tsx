/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import React, { Fragment, useState } from 'react'
import { format } from 'date-fns'
import { useSupabase } from '@/context/SupabaseProvider'
import type { AccountTypes, DepartmentTypes, DocumentTypes, FlowListTypes, FollowersTypes, NotificationTypes } from '@/types'

interface ModalProps {
  replyId: string
  handleInsertToList: (d: any) => void
  document: DocumentTypes
}

export default function CommentBox ({ replyId, handleInsertToList, document }: ModalProps) {
  const { supabase, session, systemUsers, departments } = useSupabase()

  const [reply, setReply] = useState('')
  const [showCommentInput, setShowCommentInput] = useState(false)

  const user: AccountTypes = systemUsers.find((u: { id: string }) => u.id === session.user.id)
  const dept: any = departments.find((item: DepartmentTypes) => item.id.toString() === user.department_id.toString())

  const handleSubmitReply = async () => {
    // Insert into reply to database table
    const newData = {
      parent_document_reply_id: replyId,
      sender_id: session.user.id,
      message: reply,
      is_private: false
    }
    const { data, error } = await supabase
      .from('dum_document_tracker_replies')
      .insert(newData)
      .select()

    if (error) {
      console.error(error)
      return
    }

    const user: AccountTypes = systemUsers.find((u: { id: string }) => u.id === session.user.id)

    // Insert the list from parent component
    const updatedNewData = {
      ...newData,
      id: data[0].id,
      created_at: format(Date.now(), 'dd MMM yyyy HH:mm'),
      dum_users: { name: user.name, avatar_url: user.avatar_url }
    }
    handleInsertToList(updatedNewData)

    // Notify followers and departments
    void handleNotify()

    setReply('')
    setShowCommentInput(false)
  }

  const handleNotify = async () => {
    //
    try {
      const userIds: string[] = []

      // Followers
      const { data: followers } = await supabase
        .from('dum_document_followers')
        .select('user_id')
        .eq('tracker_id', document.id)

      followers.forEach((user: FollowersTypes) => {
        userIds.push(user.user_id.toString())
      })

      // Get Department ID within Tracker Flow
      const { data: trackerFlow } = await supabase
        .from('dum_tracker_flow')
        .select('department_id')
        .eq('tracker_id', document.id)

      const deptIds: string[] = []
      trackerFlow.forEach((item: FlowListTypes) => {
        deptIds.push(item.department_id)
      })

      // Get the User assigned to these Department IDs
      const { data: dumUsers } = await supabase
        .from('dum_users')
        .select('id')
        .in('department_id', deptIds)

      dumUsers.forEach((item: AccountTypes) => {
        userIds.push(item.id.toString())
      })

      // Remove the duplicated IDs
      const uniqueIds = userIds.reduce((accumulator: string[], currentValue: string) => {
        if (!accumulator.includes(currentValue)) {
          accumulator.push(currentValue)
        }
        return accumulator
      }, [])

      const notificationData: NotificationTypes[] = []

      uniqueIds.forEach((userId) => {
        notificationData.push({
          message: `${user.name} from ${dept.name} office added comment to Document ${document.routing_slip_no}.`,
          url: `/tracker?code=${document.routing_slip_no}`,
          type: 'Remarks',
          user_id: userId,
          dum_document_tracker_id: document.id,
          reference_table: 'dum_document_trackers'
        })
      })

      if (notificationData.length > 0) {
        // insert to notifications
        const { error: error3 } = await supabase
          .from('dum_notifications')
          .insert(notificationData)

        if (error3) {
          throw new Error(error3.message)
        }
      }
    } catch (e) {
      console.error(e)
    }
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
