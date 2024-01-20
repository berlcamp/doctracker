/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { Menu, Transition } from '@headlessui/react'
import { EyeIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useCallback, useEffect, useState } from 'react'
// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { AccountTypes, DepartmentTypes, DocumentTypes, FollowersTypes, NotificationTypes } from '@/types'
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useDropzone, type FileWithPath } from 'react-dropzone'
import { CustomButton } from '@/components'

interface ModalProps {
  document: DocumentTypes
}

export default function RemarkBox ({ document }: ModalProps) {
  const { supabase, session, systemUsers, departments } = useSupabase()
  const { setToast } = useFilter()
  const [selectedImages, setSelectedImages] = useState<any>([])
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  const user: AccountTypes = systemUsers.find((u: { id: string }) => u.id === session.user.id)
  const dept: any = departments.find((item: DepartmentTypes) => item.id.toString() === user.department_id.toString())

  const [replyType, setReplyType] = useState('Public')
  const [remarks, setRemarks] = useState('')

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(acceptedFiles.map(file => (
      Object.assign(file, {
        filename: file.name
      })
    )))
  }, [])

  const maxSize = 5242880 // 5 MB in bytes
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.docx'],
      'application/vnd.ms-excel': ['.xlsx']
    },
    maxSize
  })

  const handleSubmit = async () => {
    if (saving) return

    if (remarks.trim() === '') {
      setRemarks('')
      return
    }

    setSaving(true)

    //
    try {
      const attachments: string[] = []
      selectedImages.forEach((file: { name: string }) => {
        attachments.push(file.name)
      })

      const newData = {
        document_tracker_id: document.id,
        sender_id: session.user.id,
        message: remarks,
        is_private: replyType === 'Private Note',
        files: attachments
      }
      // Insert into replies database table
      const { data, error } = await supabase
        .from('dum_remarks')
        .insert(newData)
        .select()

      if (error) {
        console.error('naai error', error)
        return
      }

      // Upload attachments
      await Promise.all(
        selectedImages.map(async (file: { name: string }) => {
          const { error } = await supabase.storage
            .from('dum_document_remarks')
            .upload(`${data[0].id}/${file.name}`, file)

          if (error) {
            console.log(error)
          }
        })
      )

      // Append new remarks to remarks redux
      const updatedData = { id: data[0].id, dum_remarks_comments: [], dum_users: user, created_at: data[0].created_at, ...newData }
      dispatch(updateRemarksList([updatedData, ...globalremarks]))

      setRemarks('')

      // Notify followers and departments
      void handleNotify()

      setSaving(false)
      setSelectedImages([])

      // pop up the success message
      setToast('success', 'Remarks successfully added.')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileRejections])

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

      const deptIds: string[] = [document.current_department_id, document.origin_department_id]

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
          message: `${user.name} from ${dept.name} office added remarks to Document ${document.routing_slip_no}.`,
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

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter((f: FileWithPath) => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div key={index} className="flex space-x-1 py-px items-center justify-start relative align-top">
      <XMarkIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-red-400'/>
      <span className='text-xs text-blue-700'>{file.filename}</span>
    </div>
  ))

  return (
    <div className='w-full flex-col space-y-2 px-4 mb-5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
      <textarea
        onChange={e => setRemarks(e.target.value)}
        value={remarks}
        disabled={saving}
        className='w-full h-20 border resize-none focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'></textarea>
      <div className='flex items-start'>

        {/* Public/Private */}
        <div className='flex items-center px-2'>
          <Menu as="div" className="relative inline-block text-left mr-2">
            <Menu.Button className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
              <EyeIcon className="w-4 h-4 mr-1"/>
              { replyType }
            </Menu.Button>
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

        {/* Attachment */}
        {
          (replyType === 'Public' && !saving) &&
            <div>
              <div {...getRootProps()} className='cursor-pointer flex items-center text-xs text-gray-500'>
                <input {...getInputProps()} />
                <PaperClipIcon className='w-4 h-4 text-gray-600'/>
                <div>Attach files</div>
              </div>
            </div>
        }

        <span className='flex-1'>&nbsp;</span>

        <CustomButton
          containerStyles='app__btn_green'
          title={saving ? 'Saving...' : 'Submit'}
          isDisabled={saving}
          btnType='button'
          handleClick={handleSubmit}
        />
      </div>
      {
        saving
          ? <div className='text-xs font-medium mb-2'>Uploading...</div>
          : (
              (fileRejections.length === 0 && selectedImages.length > 0) &&
                <div className='py-2'>
                  <div className='text-xs font-medium mb-2'>Files to upload:</div>
                  {selectedFiles}
                </div>
            )
      }

    </div>
  )
}
