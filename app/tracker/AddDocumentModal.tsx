/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { type FileWithPath, useDropzone } from 'react-dropzone'
import { useSupabase } from '@/context/SupabaseProvider'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

import type { AccountTypes, DocTypes, DocumentTypes } from '@/types'
import { generateRandomNumber } from '@/utils/text-helper'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { CustomButton } from '@/components'

interface ModalProps {
  hideModal: () => void
}

export default function AddDocumentModal ({ hideModal }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()

  const [selectedImages, setSelectedImages] = useState<any>([])
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState('')
  const [docTypes, setDocTypes] = useState<DocTypes[] | []>([])

  const wrapperRef = useRef<HTMLDivElement>(null)

  const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const dateString = year + '-' + month + '-' + day

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

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

  const { register, formState: { errors }, reset, handleSubmit } = useForm<DocumentTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: DocumentTypes) => {
    if (saving) return

    await handleCreate(formdata)
  }

  const handleCreate = async (formdata: DocumentTypes) => {
    setSaving(true)

    try {
      let shortcut = ''
      const typeArr = docTypes.find(item => item.type === formdata.type)
      if (typeArr === undefined) {
        setToast('error', 'An error occurred while generating routing slip number, please contact Arfel.')
        throw new Error('An error occurred while generating routing slip number, please contact Arfel.')
      } else {
        shortcut = typeArr.shortcut
      }

      const routingNo = generateRandomNumber()
      const routingSlipNo = shortcut + '-' + routingNo

      const newData = {
        type: formdata.type,
        cheque_no: formdata.cheque_no,
        amount: formdata.amount,
        activity_date: formdata.activity_date,
        date_delivered: formdata.date_delivered,
        supplier_name: formdata.supplier_name,
        purchase_request_number: formdata.purchase_request_number,
        agency: formdata.agency,
        name: formdata.name,
        date_created: dateString,
        particulars: formdata.particulars,
        user_id: session.user.id,
        origin_department_id: user.department_id,
        current_department_id: user.department_id,
        current_status: 'Tracker Created',
        routing_no: routingNo,
        routing_slip_no: routingSlipNo
      }

      const { data, error }: { data: any, error: any } = await supabase
        .from('dum_document_trackers')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      const { error: error2 } = await supabase
        .from('dum_tracker_flow')
        .insert({
          tracker_id: data[0].id,
          department_id: user.department_id,
          user_id: user.id,
          status: 'Tracker Created'
        })

      if (error2) throw new Error(error2.message)

      // Upload files
      await handleUploadFiles(data[0].id)

      // Append new data in redux
      const updatedData = { id: data[0].id, dum_users: user, created_at: data[0].created_at, dum_departments: { name: user.dum_departments.name }, current_department: { name: user.dum_departments.name }, document_tracker_replies: [], document_tracker_stickies: [], ...newData }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (error) {
      console.error('error', error)
    }

    setSaving(false)
  }

  const handleUploadFiles = async (id: string) => {
    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: File) => {
        const { error } = await supabase.storage
          .from('dum_documents')
          .upload(`${id}/${file.name}`, file)
        if (error) console.log(error)
      })
    )
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

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileRejections])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideModal()
    }
  }

  useEffect(() => {
    const fetchDocTypes = async () => {
      const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

      const { data }: { data: DocTypes[] } = await supabase
        .from('dum_document_types')
        .select()

      // filter only allowed doc types
      const dTypes: DocTypes[] = [...data]
      const filterDTypes = dTypes.map(item => {
        const find = [...user.dum_departments.document_types].find(i => i.toString() === item.id.toString())
        if (find) {
          return { ...item, isChecked: true }
        } else {
          return { ...item, isChecked: false }
        }
      })
      setDocTypes(filterDTypes)
    }

    void fetchDocTypes()
  }, [])

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
            <div className="app__modal_header">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Document Details
              </h5>
              <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                btnType='button'
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body relative p-4 overflow-x-scroll">
              <div className='flex items-start justify-between space-x-2'>
                {/* Begin First Column */}
                <div className='w-full px-4'>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Type<span className='italic text-xs text-gray-500'>(Required)</span>:</div>
                      <div>
                        <select
                          {...register('type', { required: true })}
                          value={type}
                          onChange={e => setType(e.target.value)}
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                          <option value=''>Select Type</option>
                          {
                            docTypes?.map((item, index) => (
                                <React.Fragment key={index}>
                                  {
                                    item.isChecked && <option value={item.type}>{item.type}</option>
                                  }
                                </React.Fragment>
                            ))
                          }
                        </select>
                        {errors.type && <div className='mt-1 text-xs text-red-600 font-bold'>Type is required</div>}
                      </div>
                    </div>
                  </div>
                  {
                    type === 'Cheque' &&
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Queque No:</div>
                          <div>
                            <input
                              {...register('cheque_no')}
                              type="text"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                          </div>
                        </div>
                      </div>
                  }
                  {
                    ['Letters', 'Memorandum Order for Activities'].includes(type) &&
                      <>
                        <div className='grid grid-cols-1 gap-4 mb-4'>
                          <div className='w-full'>
                            <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Activity Date:</div>
                            <div>
                              <input
                                {...register('activity_date')}
                                type="date"
                                className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                            </div>
                          </div>
                        </div>
                        <div className='grid grid-cols-1 gap-4 mb-4'>
                          <div className='w-full'>
                            <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Contact #:</div>
                            <div>
                              <input
                                {...register('contact_number')}
                                type="text"
                                className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                            </div>
                          </div>
                        </div>
                      </>
                  }
                  {
                    ['Cheque', 'Contract of Service', 'Disbursement Voucher', 'IPCR/OPCR', 'Liquidation', 'Retirement', 'Office Order', 'Order of Payment', 'OBR', 'Purchase Request', 'Proposal', 'Purchase Order', 'Reports', 'Salary Loan', 'Show Cause', 'Travel Order'].includes(type) &&
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Requesting Department:</div>
                          <div>
                            <input
                              {...register('agency')}
                              type="text"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                          </div>
                        </div>
                      </div>
                  }
                  {
                    ['Cheque', 'Contract of Service', 'IPCR/OPCR', 'Liquidation', 'OBR', 'Retirement', 'Salary Loan', 'Show Cause', 'Travel Order'].includes(type) &&
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Name:</div>
                          <div>
                            <input
                              {...register('name')}
                              type="text"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                          </div>
                        </div>
                      </div>
                  }
                  {
                    ['Cheque', 'Disbursement Voucher', 'Order of Payment', 'OBR', 'Purchase Request', 'Purchase Order', 'Salary Loan'].includes(type) &&
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Amount:</div>
                          <div>
                            <input
                              {...register('amount')}
                              type="number"
                              step='any'
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                          </div>
                        </div>
                      </div>
                  }
                  {
                    type === 'Purchase Order' &&
                      <>
                        {
                          // GSO only
                          user.department_id.toString() === '4' &&
                            <>
                              <div className='grid grid-cols-1 gap-4 mb-4'>
                                <div className='w-full'>
                                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Supplier Name:</div>
                                  <div>
                                    <input
                                      {...register('supplier_name')}
                                      type="text"
                                      className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                                  </div>
                                </div>
                              </div>
                              <div className='grid grid-cols-1 gap-4 mb-4'>
                                <div className='w-full'>
                                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>PR No:</div>
                                  <div>
                                    <input
                                      {...register('purchase_request_number')}
                                      type="text"
                                      className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                                  </div>
                                </div>
                              </div>
                              <div className='grid grid-cols-1 gap-4 mb-4'>
                                <div className='w-full'>
                                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Date Delivered:</div>
                                  <div>
                                    <input
                                      {...register('date_delivered')}
                                      type="date"
                                      className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                                  </div>
                                </div>
                              </div>
                            </>
                        }
                      </>
                  }
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Particulars<span className='italic text-xs text-gray-500'>(Required)</span>:</div>
                      <div>
                        <textarea
                          {...register('particulars', { required: true })}
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        {errors.particulars && <div className='mt-1 text-xs text-red-600 font-bold'>Particulars is required</div>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* End First Column */}

                {/* Begin Second Column */}
                <div className='w-full px-4'>
                  <div className="flex-auto overflow-y-auto relative px-4">
                    <div className='grid grid-cols-1 gap-4'>
                      <div className='w-full'>
                        <div {...getRootProps()} className='cursor-pointer border-2 border-dashed border-gray-300 bg-gray-100 text-gray-600 px-4 py-10'>
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
                  </div>
                </div>
                {/* End Second Column */}
              </div>
              <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >
                      {
                        saving
                          ? <span>Saving...</span>
                          : <span>Save</span>
                      }
                    </button>
                    <button
                      onClick={hideModal}
                      type="button"
                      disabled={saving}
                      className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >Cancel
                    </button>
              </div>
            </form>

          </div>
        </div>
      </div>
  )
}
