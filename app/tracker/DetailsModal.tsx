/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { format } from 'date-fns'
import Remarks from './(remarks)/Remarks'
import { useSupabase } from '@/context/SupabaseProvider'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import React, { useCallback, useEffect, useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/24/solid'
import { useDropzone } from 'react-dropzone'

import type { RepliesDataTypes, DocumentTypes, AttachmentTypes, DepartmentTypes, AccountTypes } from '@/types'
import SystemLogs from './SystemLogs'
import StatusFlow from './StatusFlow'
import { fetchDepartments } from '@/utils/fetchApi'
import { ConfirmModal, CustomButton } from '@/components'
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useFilter } from '@/context/FilterContext'
import { XCircleIcon } from '@heroicons/react/20/solid'
import { generateRandomNumber } from '@/utils/text-helper'

interface ModalProps {
  hideModal: () => void
  documentData: DocumentTypes
}

export default function DetailsModal ({ hideModal, documentData: originalData }: ModalProps) {
  const [documentData, setDocumentData] = useState<DocumentTypes>(originalData)
  const [repliesData, setRepliesData] = useState<RepliesDataTypes[] | []>([])
  const [logs, setLogs] = useState<RepliesDataTypes[] | []>([])
  const [attachments, setAttachments] = useState<AttachmentTypes[] | []>([])
  const { supabase, session, systemUsers } = useSupabase()
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [departments, setDepartments] = useState<DepartmentTypes[] | []>([])
  const [departmentId, setDepartmentId] = useState('')
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false)
  const [showConfirmForwardModal, setShowConfirmForwardModal] = useState(false)
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [updateStatusFlow, setUpdateStatusFlow] = useState(false)

  const [selectedFile, setSelectedFile] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedImages, setSelectedImages] = useState<any>([])

  const { setToast } = useFilter()

  const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

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
      return { ...item, created_at: format(new Date(item.created_at), 'dd MMM yyyy HH:mm') }
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

  const handleConfirmedComplete = async () => {
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

      setUpdateStatusFlow(!updateStatusFlow)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConfirmedReceived = async () => {
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

  const handleConfirm = () => {
    setShowConfirmation(false)
    void handleDeleteFile()
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const handleDeleteClick = (file: any) => {
    setSelectedFile(file)
    setShowConfirmation(true)
  }

  const handleDeleteFile = async () => {
    const { error } = await supabase
      .storage
      .from('dum_documents')
      .remove([`${documentData.id}/${selectedFile}`])

    if (error) {
      console.error(error)
    } else {
      const newAttachments = attachments.filter(item => item.name !== selectedFile)
      setAttachments(newAttachments)
      setToast('success', 'Successfully deleted.')
    }
  }

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
    <div key={index} className="inline-flex relative align-top mx-6">
      <XCircleIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-gray-500 absolute top-0 -right-5'/>
      <img src={file.preview} className='w-28' alt=""/>
    </div>
  ))

  useEffect(() => {
    void fetchReplies()
    void fetchAttachments()

    const fetchDepartmentsData = async () => {
      const result = await fetchDepartments({}, 300, 0)
      const d = result.data.length > 0 ? result.data : []
      const filteredResults = d.filter(item => item.id.toString() !== documentData.current_department_id.toString()) // exclude my
      setDepartments(filteredResults)
    }
    void fetchDepartmentsData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
      <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                {documentData.routing_slip_no}
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
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
                          <td className='px-2 py-2 font-semibold text-right'>Type:</td>
                          <td>{documentData.type}</td>
                        </tr>
                        {
                          documentData.activity_date &&
                            <tr>
                              <td className='px-2 py-2 font-semibold text-right'>Activity Date:</td>
                              <td>{documentData.activity_date}</td>
                            </tr>
                        }
                        {
                          documentData.cheque_no &&
                            <tr>
                              <td className='px-2 py-2 font-semibold text-right'>Cheque No:</td>
                              <td>{documentData.cheque_no}</td>
                            </tr>
                        }
                        {
                          documentData.amount &&
                            <tr>
                              <td className='px-2 py-2 font-semibold text-right'>Amount:</td>
                              <td>{documentData.amount}</td>
                            </tr>
                        }
                        <tr>
                          <td className='px-2 py-2 font-semibold text-right'>Agency / Department:</td>
                          <td>{documentData.agency}</td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-semibold text-right'>Name / Payee:</td>
                          <td>{documentData.name}</td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-semibold text-right align-top'>Particulars:</td>
                          <td>{documentData.particulars}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className='px-4 w-full'>
                    <table className='w-full'>
                      <thead><tr><th className='w-40'></th><th></th></tr></thead>
                      <tbody>
                        <tr>
                          <td className='px-2 py-2 font-semibold text-right'>Status:</td>
                          <td>
                            <div className='text-sm font-bold'>
                              {documentData.current_status} at {documentData.current_department.name}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className='px-2 py-2 font-semibold text-right align-top'>Attachments:</td>
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
                                    <span className='text-green-700 font-medium text-xs'>{file.name.substring(0, 10)}</span>
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
                                  <div {...getRootProps()} className='border border-dashed bg-gray-100 text-gray-600 px-4 py-10'>
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
              {/* User Actions */}
              {
                ((documentData.current_status === 'Received' || documentData.current_status === 'Tracker Created') && user.department_id === documentData.current_department_id) &&
                  <div className="flex-col space-x-2 items-center justify-center py-4 bg-blue-200 rounded-b-md">
                    <div className="flex space-x-2 items-center justify-center">
                        <span className='font-bold text-sm'>Forward&nbsp;To</span>
                        <select
                              value={departmentId}
                              onChange={e => setDepartmentId(e.target.value)}
                              className='text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none'>
                                <option value=''>Choose Department</option>
                                {
                                  departments?.map((item, index) => (
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
                    </div>
                    <div className="flex space-x-2 items-center justify-center italic font-medium my-2">
                      -- Or --
                    </div>
                    <div className="flex space-x-2 items-center justify-center italic font-medium my-2">
                    <CustomButton
                              containerStyles='app__btn_green'
                              btnType='button'
                              isDisabled={saving}
                              title={saving ? 'Saving...' : 'Mark as Completed'}
                              handleClick={() => setShowConfirmCompleteModal(true)}
                            />

                    </div>
                  </div>
              }
              {
                (documentData.current_status === 'Forwarded' && user.department_id === documentData.current_department_id) &&
                  <div className="flex-col space-x-2 items-center justify-center py-2 bg-blue-200 rounded-b-md">
                    <div className="flex space-x-2 items-center justify-center italic font-medium my-2">
                    <CustomButton
                              containerStyles='app__btn_green_large'
                              btnType='button'
                              isDisabled={saving}
                              title={saving ? 'Saving...' : 'Mark as Received'}
                              handleClick={() => setShowConfirmReceivedModal(true)}
                            />

                    </div>
                  </div>
              }
              {
                (user.department_id !== documentData.current_department_id || documentData.current_status === 'Completed') &&
                  <div className="flex-col space-x-2 items-center justify-center py-2 bg-blue-200 rounded-b-md">
                    <div className="flex space-x-2 items-center justify-center italic my-2">
                      <span>Current Status:</span> <span className='font-bold'>{documentData.current_status} {documentData.current_status === 'Forwarded' ? 'to' : 'at'} {documentData.current_department.name}</span>
                    </div>
                  </div>
              }
              <div className='py-2 md:flex'>
                <div className='md:w-1/2'>
                  <StatusFlow updateStatusFlow={updateStatusFlow} documentId={documentData.id.toString()}/>
                </div>
                <div className='flex-1'>
                  {
                    loadingReplies
                      ? <TwoColTableLoading/>
                      : <Remarks
                          documentId={documentData.id}
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
        {
          showConfirmation && (
            <ConfirmModal
              header='Delete Confirmation'
              btnText='Confirm'
              message="Are you sure you want to perform this action?"
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )
        }
      </div>
  )
}
