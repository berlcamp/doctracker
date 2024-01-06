'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useDropzone } from 'react-dropzone'
import { documentTypes, statusList } from '@/constants/TrackerConstants'
import uuid from 'react-uuid'
import { ArrowDownTrayIcon, XCircleIcon } from '@heroicons/react/24/solid'
import ConfirmModal from '@/components/ConfirmModal'
import { useSupabase } from '@/context/SupabaseProvider'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

export default function AddEditModal ({ editData, hideModal }) {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const [selectedImages, setSelectedImages] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [attachments, setAttachments] = useState(null)
  const [type, setType] = useState(editData ? editData.type : '')
  const [status, setStatus] = useState(editData ? editData.status : 'Received at OCM')
  const [routingNo, setRoutingNo] = useState(null)
  const [routingSlipNo, setRoutingSlipNo] = useState(editData ? editData.routing_slip_no : null)

  // Redux staff
  const globallist = useSelector((state) => state.list.value)
  const dispatch = useDispatch()

  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const timeString = hours + ':' + minutes
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const dateString = year + '-' + month + '-' + day

  const onDrop = useCallback(acceptedFiles => {
    setSelectedImages(acceptedFiles.map(file => (
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const { register, formState: { errors }, reset, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      cheque_no: editData ? editData.cheque_no : '',
      amount: editData ? editData.amount : '',
      activity_date: editData ? editData.activity_date : '',
      agency: editData ? editData.agency : '',
      name: editData ? editData.name : '',
      particulars: editData ? editData.particulars : '',
      date: editData ? editData.date : dateString,
      time: editData ? editData.time : timeString,
      received_by: editData ? editData.received_by : '',
      received_from: editData ? editData.received_from : '',
      date_endorsed: editData ? editData.date_endorsed : '',
      time_endorsed: editData ? editData.time_endorsed : ''
    }
  })

  const onSubmit = async (formdata) => {
    if (editData) {
      await handleUpdate(formdata)
    } else {
      await handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata) => {
    setSaving(true)

    try {

      let shortcut = ''
      const typeArr = documentTypes.find(item => item.type === formdata.type)
      if (typeArr === undefined) {
        setToast('error', 'An error occurred while generating routing slip number, please contact Berl.')
        throw new Error('An error occurred while generating routing slip number, please contact Berl.')
      } else {
        shortcut = typeArr.shortcut
      }
      const routingNo = await getLatestRoutingNo(shortcut)
      const routingSlipNo = shortcut + '-' + routingNo.toString().padStart(4, '0')
      setRoutingSlipNo(routingSlipNo)

      const newData = {
        type: formdata.type,
        cheque_no: formdata.cheque_no,
        amount: formdata.amount,
        activity_date: formdata.activity_date,
        agency: formdata.agency,
        name: formdata.name,
        particulars: formdata.particulars,
        status: formdata.status,
        date: formdata.date,
        time: formdata.time,
        received_by: formdata.received_by,
        received_from: formdata.received_from,
        date_endorsed: formdata.date_endorsed,
        time_endorsed: formdata.time_endorsed,
        user_id: session.user.id,
        routing_no: routingNo,
        routing_slip_no: routingSlipNo,
        date_received_cadm: formdata.status === 'Forwarded to CADM' ? 'true' : ''
      }

      const { data, error } = await supabase
        .from('document_trackers')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      // Upload files
      await handleUploadFiles(data[0].id)

      // Append new data in redux
      const updatedData = { id: data[0].id, document_tracker_replies: [], document_tracker_stickies: [], ...newData }
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

  const getLatestRoutingNo = async (shortcut) => {
    const { data, error } = await supabase
      .from('document_trackers')
      .select('routing_no')
      .not('routing_no', 'is', null)
      .neq('is_archive', 'true')
      .eq('is_deleted', false)
      .like('routing_slip_no', `%${shortcut}-%`)
      .order('routing_no', { ascending: false })
      .limit(10)

    if (!error) {
      if (data.length > 0) {
        const rn = !isNaN(data[0].routing_no) ? (Number(data[0].routing_no) + 1) : 1
        return rn
      } else {
        return 1
      }
    }
  }

  const handleUploadFiles = async (id) => {
    // Upload attachments
    await Promise.all(
      selectedImages.map(async file => {
        const { error } = await supabase.storage
          .from('documents')
          .upload(`${id}/${file.name}`, file)
        if (error) console.log(error)
      })
    )
  }

  const deleteFile = (file) => {
    const files = selectedImages.filter(f => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map(file => (
    <div key={uuid()} className="inline-flex relative align-top mx-6">
      <XCircleIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-gray-500 absolute top-0 -right-5'/>
      <img src={file.preview} className='w-28' alt=""/>
    </div>
  ))

  const handleDownloadFile = async (file) => {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .download(`${editData.id}/${file}`)

    if (error) console.error(error)

    const url = window.URL.createObjectURL(new Blob([data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleConfirm = () => {
    setShowConfirmation(false)
    handleDeleteFile()
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const handleDeleteClick = (file) => {
    setSelectedFile(file)
    setShowConfirmation(true)
  }

  const handleDeleteFile = async () => {
    const { error } = await supabase
      .storage
      .from('documents')
      .remove([`${editData.id}/${selectedFile}`])

    if (error) {
      console.error(error)
    } else {
      const newAttachments = attachments.filter(item => item.name !== selectedFile)
      setAttachments(newAttachments)
      setToast('success', 'Successfully deleted.')
    }
  }

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list(`${editData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)

    setAttachments(data)
  }

  useEffect(() => {
    if (editData) fetchAttachments()
  }, [])

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
                          type="text"
                          value={type}
                          onChange={e => setType(e.target.value)}
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                          <option value=''>Select Type</option>
                          {
                            documentTypes?.map(item => (
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
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Status:</div>
                      <div>
                        <select
                          {...register('status')}
                          type="text"
                          value={status}
                          onChange={e => setStatus(e.target.value)}
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                          <option value=''>Select Type</option>
                          {
                            statusList?.map(item =>
                              <option key={uuid()} value={item.status}>{item.status}</option>
                            )
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Date Received:</div>
                      <div>
                        <input
                          {...register('date', { required: true })}
                          type="date"
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        {errors.date && <div className='mt-1 text-xs text-red-600 font-bold'>Date received is required</div>}
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Time Received:</div>
                      <div>
                        <input
                          {...register('time')}
                          type="time"
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Received By:</div>
                      <div>
                        <input
                          {...register('received_by')}
                          type="text"
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 gap-4 mb-4'>
                    <div className='w-full'>
                      <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Received From:</div>
                      <div>
                        <input
                          {...register('received_from')}
                          type="text"
                          className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                      </div>
                    </div>
                  </div>
                  {
                    editData &&
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Date Returned:</div>
                          <div>
                            <input
                              {...register('date_endorsed')}
                              type="date"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                          </div>
                        </div>
                      </div>
                  }
                  {
                    editData &&
                      <div className='grid grid-cols-1 gap-4 mb-4'>
                        <div className='w-full'>
                          <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Time Returned:</div>
                          <div>
                            <input
                              {...register('time_endorsed')}
                              type="time"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                          </div>
                        </div>
                      </div>
                  }
                </div>
                {/* End Second Column */}
              </div>

              <div className='grid grid-cols-1 gap-4 px-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Attachments:</div>
                  <div>
                    {
                      attachments?.map((file, index) => (
                        <div key={uuid()} className='flex items-center space-x-2 justify-start p-1'>
                          <div
                            onClick={() => handleDownloadFile(file.name)}
                            className='flex space-x-2 items-center cursor-pointer'>
                            <ArrowDownTrayIcon
                              className='w-4 h-4'/>
                            <span className='text-xs'>{file.name.slice(-40)}</span>
                          </div>
                          {
                            editData &&
                              <span
                                onClick={() => handleDeleteClick(file.name)}
                                className='text-red-600 cursor-pointer text-xs font-bold'>
                                [Delete This File]
                              </span>
                          }
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
              <div className="flex-auto overflow-y-auto relative p-4">
                <div className='grid grid-cols-1 gap-4 mb-4'>
                  <div className='w-full'>
                    <div {...getRootProps()} className='border border-dashed bg-gray-100 text-gray-600 px-4 py-8'>
                      <input {...getInputProps()} />
                      <p>Drag and drop some files here, or click to select files</p>
                    </div>
                    <div className='py-4'>
                      {selectedFiles}
                    </div>
                  </div>
                </div>
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
      {
        showConfirmation && (
          <ConfirmModal
            message="Are you sure you want to perform this action?"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )
      }
    </>
  )
}
