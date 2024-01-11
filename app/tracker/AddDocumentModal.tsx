/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useDropzone } from 'react-dropzone'
import { docTypes } from '@/constants/TrackerConstants'
import uuid from 'react-uuid'
import { XCircleIcon } from '@heroicons/react/24/solid'
import { useSupabase } from '@/context/SupabaseProvider'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

import type { AccountTypes, DocumentTypes } from '@/types'
import { generateRandomNumber } from '@/utils/text-helper'

interface ModalProps {
  hideModal: () => void
}

export default function AddDocumentModal ({ hideModal }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()

  const [selectedImages, setSelectedImages] = useState<any>([])
  const [saving, setSaving] = useState(false)
  const [routingSlipNo, setRoutingSlipNo] = useState('')
  const [type, setType] = useState('')

  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const dateString = year + '-' + month + '-' + day

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImages(acceptedFiles.map(file => (
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const { register, formState: { errors }, reset, handleSubmit } = useForm<DocumentTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: DocumentTypes) => {
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
      setRoutingSlipNo(routingSlipNo)

      const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

      const newData = {
        type: formdata.type,
        cheque_no: formdata.cheque_no,
        amount: formdata.amount,
        activity_date: formdata.activity_date,
        agency: formdata.agency,
        name: formdata.name,
        date: dateString,
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
      selectedImages.map(async (file: { name: string }) => {
        const { error } = await supabase.storage
          .from('dum_documents')
          .upload(`${id}/${file.name}`, file)
        if (error) console.log(error)
      })
    )
  }

  const deleteFile = (file: { path: string }) => {
    const files = selectedImages.filter((f: { path: string }) => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any) => (
    <div key={uuid()} className="inline-flex relative align-top mx-6">
      <XCircleIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-gray-500 absolute top-0 -right-5'/>
      <img src={file.preview} className='w-28' alt=""/>
    </div>
  ))

  return (

  <>
    <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
        <div className="max-h-full overflow-hidden border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Document Details
              </h5>
              <button disabled={saving} onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body relative p-4 overflow-x-scroll">
              {
                routingSlipNo &&
                  <div className='grid grid-cols-1 gap-4 px-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Routing Slip No:</div>
                      <div>
                        <span className='font-bold text-emerald-700'>{routingSlipNo}</span>
                      </div>
                    </div>
                  </div>
              }
              <div className='flex items-start justify-between space-x-2'>
                {/* Begin First Column */}
                <div className='w-full px-4'>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Type:</div>
                      <div>
                        <select
                          {...register('type', { required: true })}
                          value={type}
                          onChange={e => setType(e.target.value)}
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                          <option value=''>Select Type</option>
                          {
                            docTypes?.map(item => (
                                <option key={uuid()} value={item.type}>{item.type}</option>
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
                    type === 'Letters' &&
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
                  }
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
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Agency / Department:</div>
                      <div>
                        <input
                          {...register('agency')}
                          type="text"
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Name / Payee:</div>
                      <div>
                        <input
                          {...register('name')}
                          type="text"
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Particulars:</div>
                      <div>
                        <textarea
                          {...register('particulars')}
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                      </div>
                    </div>
                  </div>
                </div>
                {/* End First Column */}

                {/* Begin Second Column */}
                <div className='w-full px-4'>
                  <div className='grid grid-cols-1 gap-4 px-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Attachments:</div>
                    </div>
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
                    >Close
                    </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  )
}
