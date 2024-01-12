/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { format } from 'date-fns'
import Remarks from './(remarks)/Remarks'
import { useSupabase } from '@/context/SupabaseProvider'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/24/solid'
import { useDropzone } from 'react-dropzone'

import type { RepliesDataTypes, DocumentTypes, AttachmentTypes, DepartmentTypes, AccountTypes, FollowersTypes, NotificationTypes, FlowListTypes } from '@/types'
import SystemLogs from './SystemLogs'
import StatusFlow from './StatusFlow'
import { ConfirmModal, CustomButton } from '@/components'
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { recount } from '@/GlobalRedux/Features/recountSlice'
import { useFilter } from '@/context/FilterContext'
import { BellAlertIcon, BellSlashIcon, StarIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { generateRandomNumber } from '@/utils/text-helper'
import { statusList } from '@/constants/TrackerConstants'
import AddStickyModal from './AddStickyModal'

interface ModalProps {
  hideModal: () => void
  documentData: DocumentTypes
}

export default function DetailsModal ({ hideModal, documentData: originalData }: ModalProps) {
  const [documentData, setDocumentData] = useState<DocumentTypes>(originalData)
  const [repliesData, setRepliesData] = useState<RepliesDataTypes[] | []>([])
  const [logs, setLogs] = useState<RepliesDataTypes[] | []>([])
  const [attachments, setAttachments] = useState<AttachmentTypes[] | []>([])

  const [loadingReplies, setLoadingReplies] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false)
  const [showConfirmForwardModal, setShowConfirmForwardModal] = useState(false)
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [updateStatusFlow, setUpdateStatusFlow] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)
  const [showAddStickyModal, setShowAddStickyModal] = useState(false)
  const [hideStickyButton, setHideStickyButton] = useState(false)
  const [hideFollowButton, setHideFollowButton] = useState(false)

  // const [selectedFile, setSelectedFile] = useState(null)
  // const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedImages, setSelectedImages] = useState<any>([])
  const { supabase, session, systemUsers, departments } = useSupabase()

  const { setToast } = useFilter()

  const wrapperRef = useRef<HTMLDivElement>(null)

  const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

  const forwardDepartments = departments.filter((department: DepartmentTypes) => department.id !== user.dum_departments.id)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchReplies = async () => {
    // Fetch Document Replies
    const { data: repliesData } = await supabase
      .from('dum_document_tracker_replies')
      .select('*,dum_users:sender_id(*)')
      .eq('document_tracker_id', documentData.id)
      .order('id', { ascending: false })

    const remarksFormatted: RepliesDataTypes[] = repliesData.map((item: RepliesDataTypes) => {
      return { ...item, created_at: format(new Date(item.created_at), 'dd MMM yyyy h:mm a') }
    })
    const remarksFiltered: RepliesDataTypes[] = remarksFormatted.filter((item: RepliesDataTypes) => item.reply_type !== 'system')

    const sysLogs: RepliesDataTypes[] = repliesData.filter((item: RepliesDataTypes) => {
      if (item.reply_type === 'system') {
        return true
      }
      return false
    })

    setRepliesData(remarksFiltered)
    setLogs(sysLogs)
  }

  const handleFollow = async () => {
    try {
      const { error } = await supabase
        .from('dum_document_followers')
        .insert({
          tracker_id: documentData.id,
          user_id: user.id
        })
      if (error) throw new Error(error.message)

      setToast('success', 'Successfully Followed.')
      setHideFollowButton(true)

      dispatch(recount())
    } catch (e) {
      console.error(e)
    }
  }

  const handleUnfollow = async () => {
    try {
      const { error } = await supabase
        .from('dum_document_followers')
        .delete()
        .eq('tracker_id', documentData.id)
        .eq('user_id', user.id)

      if (error) throw new Error(error.message)

      setToast('success', 'Successfully Unfollowed.')
      setHideFollowButton(false)

      dispatch(recount())
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotify = async (document: DocumentTypes, departmentId: string, actionType: string) => {
    //
    const dept: any = departments.find((item: DepartmentTypes) => item.id.toString() === departmentId)

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
          message: `The document ${document.routing_slip_no} has been ${actionType} ${actionType === 'Forwarded' ? 'to' : 'at'} ${dept.name}.`,
          url: `/tracker?code=${document.routing_slip_no}`,
          type: actionType,
          user_id: userId,
          reference_id: document.id,
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

  const handleConfirmedComplete = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      current_status: 'Completed'
    }
    try {
      const { error } = await supabase
        .from('dum_document_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) throw new Error(error.message)

      const { error: error2 } = await supabase
        .from('dum_tracker_flow')
        .insert({
          tracker_id: documentData.id,
          department_id: user.department_id,
          user_id: user.id,
          status: 'Completed'
        })

      if (error2) throw new Error(error2.message)

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id, current_department: { id: user.dum_departments.id, name: user.dum_departments.name } }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      setShowConfirmCompleteModal(false)

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConfirmedForward = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      current_status: 'Forwarded',
      current_department_id: departmentId
    }
    try {
      const { error } = await supabase
        .from('dum_document_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) throw new Error(error.message)

      const { error: error2 } = await supabase
        .from('dum_tracker_flow')
        .insert({
          tracker_id: documentData.id,
          department_id: departmentId,
          user_id: user.id,
          status: 'Forwarded'
        })

      if (error2) throw new Error(error2.message)

      const dept: any = departments.find((item: DepartmentTypes) => item.id.toString() === departmentId)

      // Notify followers and Departments
      void handleNotify(documentData, departmentId, 'Forwarded')

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id, current_department: { id: dept.id, name: dept.name } }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      setShowConfirmForwardModal(false)

      // Recount sidebar counter
      dispatch(recount())

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConfirmedReceived = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      current_status: 'Received',
      current_department_id: user.department_id
    }
    try {
      const { error } = await supabase
        .from('dum_document_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) throw new Error(error.message)

      const { error: error2 } = await supabase
        .from('dum_tracker_flow')
        .insert({
          tracker_id: documentData.id,
          department_id: user.department_id,
          user_id: user.id,
          status: 'Received'
        })

      if (error2) throw new Error(error2.message)

      // Notify followers and Departments
      void handleNotify(documentData, user.department_id.toString(), 'Received')

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id, current_department: { id: user.dum_departments.id, name: user.dum_departments.name } }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      setShowConfirmReceivedModal(false)

      // Recount sidebar counter
      dispatch(recount())

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadFile = async (file: string) => {
    const { data, error } = await supabase
      .storage
      .from('dum_documents')
      .download(`${documentData.id}/${file}`)

    if (error) console.error(error)

    const url = window.URL.createObjectURL(new Blob([data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const fetchAttachments = async () => {
    setLoadingReplies(true)

    const { data, error }: { data: AttachmentTypes[] | [], error: unknown } = await supabase
      .storage
      .from('dum_documents')
      .list(`${documentData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)
    setLoadingReplies(false)

    setAttachments(data)
  }

  // Upload files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImages(acceptedFiles.map(file => (
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  // const handleConfirm = () => {
  //   setShowConfirmation(false)
  //   void handleDeleteFile()
  // }

  // const handleCancel = () => {
  //   setShowConfirmation(false)
  // }

  // const handleDeleteClick = (file: any) => {
  //   setSelectedFile(file)
  //   setShowConfirmation(true)
  // }

  // const handleDeleteFile = async () => {
  //   const { error } = await supabase
  //     .storage
  //     .from('dum_documents')
  //     .remove([`${documentData.id}/${selectedFile}`])

  //   if (error) {
  //     console.error(error)
  //   } else {
  //     const newAttachments = attachments.filter(item => item.name !== selectedFile)
  //     setAttachments(newAttachments)
  //     setToast('success', 'Successfully deleted.')
  //   }
  // }

  const handleUploadFiles = async () => {
    const id = documentData.id.toString()
    const newAttachments: any = []

    setUploading(true)

    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: { name: string }) => {
        const { error } = await supabase.storage
          .from('dum_documents')
          .upload(`${id}/${file.name}-${generateRandomNumber()}`, file)

        if (error) {
          console.log(error)
        } else {
          newAttachments.push({ name: file.name })
        }
      })
    )

    setSelectedImages([])
    setUploading(false)
    setToast('success', 'Successfully uploaded.')

    setAttachments([...attachments, ...newAttachments])
  }

  const deleteFile = (file: { path: string }) => {
    const files = selectedImages.filter((f: { path: string }) => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div key={index} className="inline-flex relative align-top mx-px">
      <XCircleIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-gray-500 absolute top-0 right-0'/>
      <img src={file.preview} className='w-16 h-16' alt=""/>
    </div>
  ))

  const handleAddToStickies = async (item: DocumentTypes) => {
    setShowAddStickyModal(true)
    setSelectedItem(item)
  }

  const getStatusColor = (status: string): string => {
    const statusArr = statusList.filter(item => item.status === status)
    if (statusArr.length > 0) {
      return statusArr[0].color
    } else {
      return '#000000'
    }
  }

  useEffect(() => {
    void fetchReplies()
    void fetchAttachments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const checkedFollowStatus = async () => {
      const { count }: { count: number } = await supabase
        .from('dum_document_followers')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('tracker_id', documentData.id)

      if (count > 0) {
        setHideFollowButton(true)
      }
    }

    const checkedIfStickyStatus = async () => {
      const { count }: { count: number } = await supabase
        .from('dum_document_tracker_stickies')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('document_tracker_id', documentData.id)

      if (count > 0) {
        setHideStickyButton(true)
      }
    }

    void checkedFollowStatus()
    void checkedIfStickyStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideModal()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef])

  return (
      <div ref={wrapperRef} className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex space-x-2 items-center justify-start p-4 border-b bg-slate-200 border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                {documentData.routing_slip_no}
              </h5>
              <div className="flex flex-1 space-x-2 items-center justify-center">
                {
                  ((documentData.current_status === 'Received' || documentData.current_status === 'Tracker Created') && user.department_id === documentData.current_department_id) &&
                    <>
                      <span className='font-bold text-sm'>Forward&nbsp;To</span>
                      <select
                        value={departmentId}
                        onChange={e => setDepartmentId(e.target.value)}
                        className='text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none'>
                          <option value=''>Choose Department</option>
                          {
                            forwardDepartments?.map((item: DepartmentTypes, index: number) => (
                              <option key={index} value={item.id}>{item.name}</option>
                            ))
                          }
                      </select>
                      <CustomButton
                        containerStyles='app__btn_green'
                        title={saving ? 'Saving...' : 'Submit'}
                        btnType='button'
                        handleClick={() => setShowConfirmForwardModal(true)}
                      />
                    </>
                }
                {
                  (documentData.current_status === 'Forwarded' && user.department_id === documentData.current_department_id) &&
                    <CustomButton
                      containerStyles='app__btn_green'
                      btnType='button'
                      isDisabled={saving}
                      title={saving ? 'Saving...' : 'Mark as Received'}
                      handleClick={() => setShowConfirmReceivedModal(true)}
                    />
                }
              </div>
              {/* {
                ((documentData.current_status === 'Received' || documentData.current_status === 'Tracker Created') && user.department_id === documentData.current_department_id) &&
                  <CustomButton
                    containerStyles='app__btn_green'
                    btnType='button'
                    isDisabled={saving}
                    title={saving ? 'Saving...' : 'Mark as Completed'}
                    handleClick={() => setShowConfirmCompleteModal(true)}
                  />
              } */}
              {
                !hideStickyButton && <StarIcon onClick={() => handleAddToStickies(documentData)} className='cursor-pointer w-7 h-7 text-yellow-500'/>
              }
              {
                !hideFollowButton
                  ? <CustomButton
                      containerStyles='app__btn_blue flex space-x-2'
                      btnType='button'
                      isDisabled={saving}
                      title={saving ? 'Saving...' : 'Follow'}
                      handleClick={handleFollow}
                      rightIcon={<BellAlertIcon className='w-4 h-4 text-white'/>}
                    />
                  : <CustomButton
                      containerStyles='app__btn_blue flex space-x-2'
                      btnType='button'
                      isDisabled={saving}
                      title={saving ? 'Saving...' : 'Unfollow'}
                      handleClick={handleUnfollow}
                      rightIcon={<BellSlashIcon className='w-4 h-4 text-white'/>}
                    />
              }
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
            </div>

            <div className="modal-body relative overflow-x-scroll">
              {/* Document Details */}
              <div className='py-2'>
                <div className='flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400'>
                  <div className='px-4 w-full'>
                    <table className='w-full'>
                      <thead><tr><th className='w-40'></th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td className='px-2 py-2 font-medium text-right'>Current Status:</td>
                          <td>
                            <span className='font-bold text-sm' style={{ color: `${getStatusColor(documentData.current_status)}` }}>{documentData.current_status} {documentData.current_status === 'Forwarded' ? 'to' : 'at'}  {documentData.current_department.name}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-medium text-right'>Type:</td>
                          <td className='text-sm font-bold'>{documentData.type}</td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-medium text-right'>Activity Date:</td>
                          <td className='text-sm font-bold'>{documentData.activity_date}</td>
                        </tr>
                        {
                          documentData.cheque_no &&
                            <tr>
                              <td className='px-2 py-2 font-medium text-right'>Cheque No:</td>
                              <td className='text-sm font-bold'>{documentData.cheque_no}</td>
                            </tr>
                        }
                        <tr>
                          <td className='px-2 py-2 font-medium text-right'>Agency / Department:</td>
                          <td className='text-sm font-bold'>{documentData.agency}</td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-medium text-right'>Name / Payee:</td>
                          <td className='text-sm font-bold'>{documentData.name}</td>
                        </tr>
                        {
                          documentData.amount &&
                            <tr>
                              <td className='px-2 py-2 font-medium text-right'>Amount:</td>
                              <td className='text-sm font-bold'>{documentData.amount}</td>
                            </tr>
                        }
                        <tr>
                          <td className='px-2 py-2 font-medium text-right align-top'>Particulars:</td>
                          <td className='text-sm font-bold'>{documentData.particulars}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className='px-4 w-full'>
                    <table className='w-full'>
                      <thead><tr><th className='w-40'></th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td className='px-2 py-2 font-medium text-right align-top'>Attachments:</td>
                          <td>
                            <div>
                            {
                              attachments?.map((file, index) => (
                                <div key={index} className='flex items-center space-x-2 justify-start p-1'>
                                  <div
                                    onClick={() => handleDownloadFile(file.name)}
                                    className='flex space-x-2 items-center cursor-pointer'>
                                    <PaperClipIcon
                                      className='w-4 h-4 text-green-700 '/>
                                    <span className='text-green-700 font-medium text-xs'>{file.name}</span>
                                  </div>
                                  {/* <span
                                    onClick={() => handleDeleteClick(file.name)}
                                    className='text-red-600 cursor-pointer text-xs font-bold'>
                                    [Delete This File]
                                  </span> */}
                                </div>
                              ))
                            }
                            </div>
                            <div className="flex-auto overflow-y-auto relative p-4">
                              <div className='grid grid-cols-1 gap-4 mb-4'>
                                <div className='w-full'>
                                  <div {...getRootProps()} className='cursor-pointer border-dashed border-2 bg-gray-100 text-gray-600 px-4 py-10'>
                                    <input {...getInputProps()} />
                                    <p className='text-xs'>Drag and drop some files here, or click to select files</p>
                                  </div>
                                  <div className='py-4'>
                                    {selectedFiles}
                                  </div>
                                </div>
                              </div>
                              {
                                selectedImages.length > 0 &&
                                  <CustomButton
                                    containerStyles='app__btn_green'
                                    title={uploading ? 'Uploading...' : 'Upload'}
                                    btnType='button'
                                    handleClick={handleUploadFiles}
                                  />
                              }
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <hr/>
              <div className='py-2 md:flex'>
                <div className='md:w-1/2'>
                  <StatusFlow updateStatusFlow={updateStatusFlow} documentId={documentData.id.toString()}/>
                </div>
                <div className='flex-1'>
                  {
                    loadingReplies
                      ? <TwoColTableLoading/>
                      : <Remarks
                          document={documentData}
                          repliesData={repliesData}
                        />
                  }
                  {/* System Logs */}
                  {
                    logs.length > 0 &&
                      <SystemLogs logs={logs}/>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
        {
          showConfirmCompleteModal && (
            <ConfirmModal
              header='Confirmation'
              btnText='Confirm'
              message="Please confirm this action"
              onConfirm={handleConfirmedComplete}
              onCancel={() => setShowConfirmCompleteModal(false)}
            />
          )
        }
        {
          showConfirmForwardModal && (
            <ConfirmModal
              header='Confirmation'
              btnText='Confirm'
              message="Please confirm this action"
              onConfirm={handleConfirmedForward}
              onCancel={() => setShowConfirmForwardModal(false)}
            />
          )
        }
        {
          showConfirmReceivedModal && (
            <ConfirmModal
              header='Confirmation'
              btnText='Confirm'
              message="Please confirm this action"
              onConfirm={handleConfirmedReceived}
              onCancel={() => setShowConfirmReceivedModal(false)}
            />
          )
        }
        {/* {
          showConfirmation && (
            <ConfirmModal
              header='Delete Confirmation'
              btnText='Confirm'
              message="Are you sure you want to perform this action?"
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )
        } */}
        {/* Add to Sticky Modal */}
        {
            showAddStickyModal && (
              <AddStickyModal
                item={selectedItem}
                hideAddStickButton={() => setHideStickyButton(true)}
                hideModal={() => setShowAddStickyModal(false)}/>
            )
          }
      </div>
  )
}
