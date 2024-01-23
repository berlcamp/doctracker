/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { format } from 'date-fns'
import Remarks from './Remarks/Remarks'
import { useSupabase } from '@/context/SupabaseProvider'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/24/solid'
import { type FileWithPath, useDropzone } from 'react-dropzone'

import type { DocumentTypes, AttachmentTypes, DepartmentTypes, AccountTypes, FollowersTypes, NotificationTypes } from '@/types'
import { ConfirmModal, CustomButton, StatusFlow, UserBlock } from '@/components'
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { recount } from '@/GlobalRedux/Features/recountSlice'
import { useFilter } from '@/context/FilterContext'
import { BellAlertIcon, BellSlashIcon, StarIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { generateRandomNumber } from '@/utils/text-helper'
import { statusList } from '@/constants/TrackerConstants'
import AddStickyModal from './AddStickyModal'
import { Tooltip } from 'react-tooltip'

interface ModalProps {
  hideModal: () => void
  documentData: DocumentTypes
}

function Attachment ({ id, file }: { id: string, file: string }) {
  const [downloading, setDownloading] = useState(false)
  const { supabase } = useSupabase()

  const handleDownloadFile = async (file: string) => {
    if (downloading) return

    setDownloading(true)

    const { data, error } = await supabase
      .storage
      .from('dum_documents')
      .download(`${id}/${file}`)

    if (error) console.error(error)

    const url = window.URL.createObjectURL(new Blob([data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()

    setDownloading(false)
  }

  return (
    <div
      onClick={() => handleDownloadFile(file)}
      className={`flex space-x-2 items-center ${downloading ? '' : 'cursor-pointer'}`}>
      <PaperClipIcon
        className='w-4 h-4 text-blue-700 '/>
      <span className='text-blue-700 font-medium text-[10px]'>
        {file}
        {downloading ? ' downloading...' : ''}
      </span>
    </div>
  )
}

export default function DetailsModal ({ hideModal, documentData: originalData }: ModalProps) {
  const [documentData, setDocumentData] = useState<DocumentTypes>(originalData)
  const [attachments, setAttachments] = useState<AttachmentTypes[] | []>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [showConfirmForwardModal, setShowConfirmForwardModal] = useState(false)
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [updateStatusFlow, setUpdateStatusFlow] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)
  const [showAddStickyModal, setShowAddStickyModal] = useState(false)
  const [hideStickyButton, setHideStickyButton] = useState(false)
  const [hideFollowButton, setHideFollowButton] = useState(false)

  // Edit fields
  const [supplier, setSupplier] = useState(documentData.supplier_name ? documentData.supplier_name : '')
  const [purchaseRequestNumber, setPurchaseRequestNumber] = useState(documentData.purchase_request_number ? documentData.purchase_request_number : '')
  const [dateDelivered, setDateDelivered] = useState(documentData.date_delivered ? documentData.date_delivered : '')

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

      const deptIds: string[] = [departmentId, document.origin_department_id]

      // Get Department ID within Tracker Flow
      // const { data: trackerFlow } = await supabase
      //   .from('dum_tracker_flow')
      //   .select('department_id')
      //   .eq('tracker_id', document.id)

      // trackerFlow.forEach((item: FlowListTypes) => {
      //   deptIds.push(item.department_id)
      // })

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

  const handleSaveChanges = async () => {
    try {
      const newData = {
        supplier_name: supplier,
        purchase_request_number: purchaseRequestNumber,
        date_delivered: dateDelivered
      }

      const { error } = await supabase
        .from('dum_document_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) throw new Error(error.message)

      // Added log to latest tracker flow
      const { data } = await supabase
        .from('dum_tracker_flow')
        .select()
        .eq('tracker_id', documentData.id)
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        let msg = ''
        if (supplier !== documentData.supplier_name) {
          msg += ' Supplier to ' + supplier + ','
        }
        if (purchaseRequestNumber !== documentData.purchase_request_number) {
          msg += ' PO # to ' + purchaseRequestNumber + ','
        }
        if (dateDelivered !== documentData.date_delivered) {
          msg += ' Date Delivered to ' + dateDelivered
        }

        if (msg !== '') {
          const newData = {
            message: 'Updated ' + msg,
            tracker_flow_id: data.id,
            user_id: user.id
          }

          const { error } = await supabase
            .from('dum_tracker_logs')
            .insert(newData)
            .eq('id', documentData.id)

          if (error) throw new Error(error.message)
        }
      }

      // Update data in redux
      const items: DocumentTypes[] = [...globallist]
      const updatedData = { ...newData, id: documentData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))
      setDocumentData(items[foundIndex]) // update ui with new data

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // update the flow UI
      setUpdateStatusFlow(!updateStatusFlow)
    } catch (e) {
      console.error(e)
    }
  }

  const handleForward = () => {
    if (departmentId === '') return
    setShowConfirmForwardModal(true)
  }

  const handleConfirmedForward = async () => {
    if (saving) return

    setSaving(true)

    const newData = {
      current_status: 'Forwarded',
      current_department_id: departmentId,
      forwarded_from_department_id: user.department_id
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
      const updatedData = { ...newData, id: documentData.id, current_department: { id: dept.id, name: dept.name, document_types: [] } }
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
      current_department_id: user.department_id,
      received_by: user.id,
      date_received: new Date()
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
      const updatedData = { ...newData, date_received: (new Date()).toString(), id: documentData.id, current_department: { id: user.dum_departments.id, name: user.dum_departments.name, document_types: [] } }
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

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter((f: FileWithPath) => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div key={index} className="flex space-x-1 py-px items-center justify-start relative align-top">
      <XMarkIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-red-400'/>
      <span className='text-xs'>{file.filename}</span>
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
    if (fileRejections.length > 0) {
      setSelectedImages([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileRejections])

  useEffect(() => {
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
      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header_tracker">
              <h5 className="app__modal_header_text">
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
                        handleClick={handleForward}
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
              {
                !hideStickyButton &&
                  <>
                    <StarIcon onClick={() => handleAddToStickies(documentData)} className='cursor-pointer w-7 h-7 text-yellow-500' data-tooltip-id="stickies-tooltip" data-tooltip-content="Add to Stickies"/>
                    <Tooltip id="stickies-tooltip" place='bottom-end'/>
                  </>
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
                          <td className='px-2 py-2 font-light text-right'>Current Status:</td>
                          <td>
                            <span className='font-medium text-sm' style={{ color: `${getStatusColor(documentData.current_status)}` }}>{documentData.current_status} {documentData.current_status === 'Forwarded' ? 'to' : 'at'}  {documentData.current_department.name}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-light text-right'>Type:</td>
                          <td className='text-sm font-medium'>{documentData.type}</td>
                        </tr>
                        {
                          (documentData.activity_date && documentData.activity_date.trim() !== '') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Activity Date:</td>
                              <td className='text-sm font-medium'>{documentData.activity_date}</td>
                            </tr>
                        }
                        {
                          (documentData.cheque_no && documentData.cheque_no.trim() !== '') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Cheque No:</td>
                              <td className='text-sm font-medium'>{documentData.cheque_no}</td>
                            </tr>
                        }
                        {
                          (documentData.agency && documentData.agency.trim() !== '') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Requesting Department:</td>
                              <td className='text-sm font-medium'>{documentData.agency}</td>
                            </tr>
                        }
                        {
                          (documentData.name && documentData.name.trim() !== '') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Name / Payee:</td>
                              <td className='text-sm font-medium'>{documentData.name}</td>
                            </tr>
                        }
                        {
                          (documentData.amount && documentData.amount.trim() !== '') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Amount:</td>
                              <td className='text-sm font-bold'>{documentData.amount}</td>
                            </tr>
                        }
                        <tr>
                          <td className='px-2 py-2 font-light text-right align-top'>Particulars:</td>
                          <td className='text-sm font-medium'>{documentData.particulars}</td>
                        </tr>
                        {
                          ((documentData.supplier_name && documentData.supplier_name.trim() !== '') || user.department_id.toString() === '4') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Supplier Name:</td>
                              <td className='text-sm font-medium'>
                                {
                                  // GSO only
                                  (documentData.current_status === 'Received' && documentData.current_department_id.toString() === user.department_id.toString() && user.department_id.toString() === '4')
                                    ? <input value={supplier} onChange={e => setSupplier(e.target.value)} type="text" className='w-full font-normal text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                                    : <span>{documentData.supplier_name}</span>
                                }
                              </td>
                            </tr>
                        }
                        {
                          ((documentData.purchase_request_number && documentData.purchase_request_number.trim() !== '') || user.department_id.toString() === '4') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>PR No:</td>
                              <td className='text-sm font-medium'>
                                {
                                  // GSO only
                                  (documentData.current_status === 'Received' && documentData.current_department_id.toString() === user.department_id.toString() && user.department_id.toString() === '4')
                                    ? <input value={purchaseRequestNumber} onChange={e => setPurchaseRequestNumber(e.target.value)} type="text" className='w-full font-normal text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                                    : <span>{documentData.purchase_request_number}</span>
                                }
                              </td>
                            </tr>
                        }
                        {
                          ((documentData.date_delivered && documentData.date_delivered.trim() !== '') || user.department_id.toString() === '4') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'>Date Delivered:</td>
                              <td className='text-sm font-medium'>
                                {
                                  // GSO only
                                  (documentData.current_status === 'Received' && documentData.current_department_id.toString() === user.department_id.toString() && user.department_id.toString() === '4')
                                    ? <input value={dateDelivered} onChange={e => setDateDelivered(e.target.value)} type="text" className='w-full font-normal text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                                    : <span>{documentData.date_delivered}</span>
                                }
                              </td>
                            </tr>
                        }
                        {
                          (documentData.purchase_request_number || user.department_id.toString() === '4') &&
                            <tr>
                              <td className='px-2 py-2 font-light text-right'></td>
                              <td className='text-sm font-medium'>
                                {
                                  // GSO only
                                  (documentData.current_status === 'Received' && documentData.current_department_id.toString() === user.department_id.toString() && user.department_id.toString() === '4') &&
                                    <CustomButton
                                      containerStyles='app__btn_green'
                                      title={saving ? 'Saving...' : 'Save Changes'}
                                      btnType='button'
                                      handleClick={handleSaveChanges}
                                    />
                                }
                              </td>
                            </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div className='px-2 w-full'>
                    <table className='w-full'>
                      <thead><tr><th className='w-40'></th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td className='px-2 font-light text-right align-top'>Origin:</td>
                          <td className='font-medium align-top'>
                            <div>{documentData.dum_departments.name}</div>
                            <div className='text-gray-500 text-[10px]'>{format(new Date(documentData.created_at), 'dd MMM yyyy h:mm a')}</div>
                            <UserBlock user={documentData.dum_users}/>
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 pt-2 font-light text-right align-top'>Attachments:</td>
                          <td className='pt-2'>
                            <div>
                              {
                                attachments?.length === 0 && <span>No attachments</span>
                              }
                            {
                              attachments?.map((file, index) => (
                                <div key={index} className='flex items-center space-x-2 justify-start'>
                                  <Attachment file={file.name} id={documentData.id} />
                                </div>
                              ))
                            }
                            </div>
                            <div className="hidden flex-auto overflow-y-auto relative mt-4">
                              <div className='grid grid-cols-1 gap-4'>
                                <div className='w-full'>
                                  <div {...getRootProps()} className='cursor-pointer border-dashed border-2 bg-gray-100 text-gray-600 px-4 py-10'>
                                    <input {...getInputProps()} />
                                    <p className='text-xs'>Drag and drop some files here, or click to select files</p>
                                  </div>
                                  {
                                    (fileRejections.length === 0 && selectedImages.length > 0) &&
                                      <div className='py-4'>
                                        <div className='text-xs font-medium mb-2'>Files to upload:</div>
                                        {selectedFiles}
                                      </div>
                                  }
                                  {
                                    fileRejections.length > 0 &&
                                      <div className='py-4'>
                                          <p className='text-red-500 text-xs'>
                                            File rejected. Please make sure its an image, PDF, DOC, or Excel file and less than 5MB.
                                          </p>
                                      </div>
                                  }
                                </div>
                              </div>
                              {
                                (selectedFiles.length > 0 && fileRejections.length === 0) &&
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
                  <div className='mx-2 mt-4 px-4 py-4 text-gray-600 bg-gray-100'>
                    <div className='mb-6 px-4'>
                      <span className='font-bold text-xs'>Tracker:</span>
                    </div>
                    <StatusFlow updateStatusFlow={updateStatusFlow} documentId={documentData.id.toString()}/>
                  </div>
                </div>
                <div className='flex-1'>
                  {
                    loadingReplies
                      ? <TwoColTableLoading/>
                      : <Remarks
                          document={documentData}/>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
        {
          showConfirmForwardModal && (
            <ConfirmModal
              header='Forward Confirmation'
              btnText='Confirm'
              message="Are you sure you want to forward this document?"
              onConfirm={handleConfirmedForward}
              onCancel={() => setShowConfirmForwardModal(false)}
            />
          )
        }
        {
          showConfirmReceivedModal && (
            <ConfirmModal
              header='Received Confirmation'
              btnText='Confirm'
              message="Are you sure you want to receive this document?"
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
