'use client'
import React, { useEffect, useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import ReplyBox from './ReplyBox'
import uuid from 'react-uuid'
import { PaperClipIcon, XCircleIcon } from '@heroicons/react/24/solid'
import RepliesBox from './RepliesBox'
import { useFilter } from '@/context/FilterContext'
import { documentTypes, statusList } from '@/constants/TrackerConstants'
import ConfirmModal from '@/components/ConfirmModal'
import { format } from 'date-fns'
import { useSupabase } from '@/context/SupabaseProvider'

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

export default function Remarks ({ documentData, repliesData, modalTitle, hideModal }) {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState(null)
  const [replies, setReplies] = useState(repliesData || null)
  const [selectedImages, setSelectedImages] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  console.log(documentData)
  // Edit fields
  const [activityDate, setActivityDate] = useState(documentData.activity_date)
  const [agency, setAgency] = useState(documentData.agency)
  const [name, setName] = useState(documentData.name)
  const [receivedFrom, setReceivedFrom] = useState(documentData.received_from)
  const [particulars, setParticulars] = useState(documentData.particulars)
  const [status, setStatus] = useState(documentData.status)
  const [tracker, setTracker] = useState('')
  const [date, setDate] = useState(documentData.date)
  const [time, setTime] = useState(documentData.time)
  const [receivedBy, setReceivedBy] = useState(documentData.received_by)
  const [dateEndorsed, setDateEndorsed] = useState(documentData.date_endorsed)
  const [timeEndorsed, setTimeEndorsed] = useState(documentData.time_endorsed)
  const [chequeNo, setCheckNo] = useState(documentData.cheque_no)
  const [amount, setAmount] = useState(documentData.amount)

  const [type, setType] = useState(documentData.type)
  const [routingNo, setRoutingNo] = useState(documentData.routing_no)
  const [routingSlipNo, setRoutingSlipNo] = useState(documentData.routing_slip_no)

  const globallist = useSelector((state) => state.list.value)
  const dispatch = useDispatch()

  const onDrop = useCallback(acceptedFiles => {
    setSelectedImages(acceptedFiles.map(file => (
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const handleUploadFiles = async (id) => {
    // Upload attachments
    const newAttachments = []
    await Promise.all(
      selectedImages.map(async file => {
        const { error } = await supabase.storage
          .from('documents')
          .upload(`${id}/${file.name}`, file)
        if (error) {
          console.log(error)
        } else {
          newAttachments.push({ name: file.name })
        }
      })
    )
    setAttachments([...attachments, ...newAttachments])
  }

  const deleteFile = (file) => {
    const files = selectedImages.filter(f => f.path !== file.path)
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map(file => (
    <div key={uuid()} className="inline-flex relative align-top mx-4">
      <XCircleIcon
        onClick={() => deleteFile(file)}
        className='cursor-pointer w-5 h-5 text-gray-500 absolute top-0 -right-5'/>
      <img src={file.preview} className='w-10' alt=""/>
    </div>
  ))

  const handleDownloadFile = async (file) => {
    const { data, error } = await supabase
      .storage
      .from('documents')
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
      .remove([`${documentData.id}/${selectedFile}`])

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
      .list(`${documentData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) console.error(error)

    setAttachments(data)
  }

  const handleRemoveFromList = async (id) => {
    // Also remove from remarks column on document_trackers table if not 'private note'
    // const remarks = replies.filter(item => item.id === id)
    // console.log('remarks', remarks)

    // if (!remarks[0].is_private) {
    //   // Get latest document data from database
    //   const { data: latestDocument, error: latestError } = await supabase
    //     .from('document_trackers')
    //     .select('remarks')
    //     .eq('id', documentData.id)
    //     .limit(1)
    //     .single()
    //   if (latestError) console.error(latestError)

    //   const updatedRemarks = latestDocument.remarks.replace(remarks[0].message, '')

    //   const { error } = await supabase
    //     .from('document_trackers')
    //     .update({
    //       remarks: updatedRemarks
    //     })
    //     .eq('id', documentData.id)

    //   if (error) console.error(error)
    // }

    // Update the replies list on DOM
    setReplies(prevList => prevList.filter(item => item.id !== id))
  }

  const handleSaveChanges = async () => {
    setSaving(true)

    try {
      let routingNo = ''
      let routingSlipNo = ''

      if (documentData.type !== type) {
        let shortcut = ''
        const typeArr = documentTypes.find(item => item.type === type)
        if (typeArr === undefined) {
          setToast('error', 'An error occurred while generating routing slip number, please contact Berl.')
          throw new Error('An error occurred while generating routing slip number, please contact Berl.')
        } else {
          shortcut = typeArr.shortcut
        }
        routingNo = await getLatestRoutingNo(shortcut)
        routingSlipNo = shortcut + '-' + routingNo.toString().padStart(4, '0')
        setRoutingSlipNo(routingSlipNo)
      } else {
        routingNo = documentData.routing_no
        routingSlipNo = documentData.routing_slip_no
      }

      const newData = {
        cheque_no: chequeNo,
        amount,
        activity_date: activityDate,
        agency,
        name,
        particulars,
        status,
        date,
        type,
        time,
        received_by: receivedBy,
        received_from: receivedFrom,
        date_endorsed: dateEndorsed,
        time_endorsed: timeEndorsed,
        edited_by: session.user.id,
        routing_no: routingNo,
        routing_slip_no: routingSlipNo,
        date_received_cadm: status === 'Forwarded to CADM' ? 'true' : ''
      }

      const { error } = await supabase
        .from('document_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) throw new Error(error.message)

      // Upload files
      if (selectedImages.length > 0) {
        await handleUploadFiles(documentData.id)
      }

      const updatedData = { ...newData, id: documentData.id }

      handleUpdateList(updatedData)

      // Update modal title
      modalTitle(routingSlipNo)

      // Store change logs
      const changesData = [
        { field: 'cheque_no', new_value: chequeNo !== documentData.cheque_no ? chequeNo : false, old_value: documentData.cheque_no },
        { field: 'amount', new_value: amount !== documentData.amount ? amount : false, old_value: documentData.amount },
        { field: 'activity_date', new_value: activityDate !== documentData.activity_date ? activityDate : false, old_value: documentData.activity_date },
        { field: 'agency', new_value: agency !== documentData.agency ? agency : false, old_value: documentData.agency },
        { field: 'name', new_value: name !== documentData.name ? name : false, old_value: documentData.name },
        { field: 'particulars', new_value: particulars !== documentData.particulars ? particulars : false, old_value: documentData.particulars },
        { field: 'status', new_value: status !== documentData.status ? status : false, old_value: documentData.status },
        { field: 'date', new_value: date !== documentData.date ? date : false, old_value: documentData.date },
        { field: 'time', new_value: time !== documentData.time ? time : false, old_value: documentData.time },
        { field: 'received_by', new_value: receivedBy !== documentData.received_by ? receivedBy : false, old_value: documentData.received_by },
        { field: 'received_from', new_value: receivedFrom !== documentData.received_from ? receivedFrom : false, old_value: documentData.received_from },
        { field: 'date_endorsed', new_value: dateEndorsed !== documentData.date_endorsed ? dateEndorsed : false, old_value: documentData.date_endorsed },
        { field: 'time_endorsed', new_value: timeEndorsed !== documentData.time_endorsed ? timeEndorsed : false, old_value: documentData.time_endorsed }
      ]

      let hasChanges = false
      changesData.forEach(item => {
        if (item.new_value) hasChanges = true
      })

      if (hasChanges) {
        await supabase
          .from('document_tracker_replies')
          .insert({
            document_tracker_id: documentData.id,
            sender_id: session.user.id,
            message: changesData,
            reply_type: 'system',
            is_private: false
          })
      }

      setSelectedImages([])

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (error) {
      console.error(error)
      // setToast('error', error)
    }

    setSaving(false)
  }

  const handleUpdateList = (updatedData) => {
    const items = [...globallist]
    const foundIndex = items.findIndex(x => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    dispatch(updateList(items))
  }

  const handleUpdateRemarksList = (updatedData) => {
    const items = [...replies]
    const foundIndex = items.findIndex(x => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    setReplies(items)
  }

  const handleInsertToList = (newData) => {
    setReplies([newData, ...replies])
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
      .limit(5)

    if (!error) {
      if (data.length > 0) {
        const rn = !isNaN(data[0].routing_no) ? (Number(data[0].routing_no) + 1) : 1
        return rn
      } else {
        return 1
      }
    }
  }

  useEffect(() => {
    fetchAttachments()
  }, [])

  return (
    <>
            {/* Document Details */}
            <div className='mx-4 py-2'>
              <div className='flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400'>
                <div className='px-4 w-full'>
                  <table className='w-full'>
                    <thead><tr><th className='w-40'></th><th></th></tr></thead>
                    <tbody>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Type:</td>
                        <td>
                          <select
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
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Activity Date:</td>
                        <td>
                        <input
                          value={activityDate}
                          onChange={e => setActivityDate(e.target.value)}
                          type="date"
                          className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Cheque No:</td>
                        <td>
                          <input
                            value={chequeNo}
                            onChange={e => setCheckNo(e.target.value)}
                            type="text"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Amount:</td>
                        <td>
                          <input
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            type="number"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Agency / Department:</td>
                        <td>
                          <input
                            value={agency}
                            onChange={e => setAgency(e.target.value)}
                            type="text"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Name / Payee:</td>
                        <td>
                          <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            type="text"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Received From:</td>
                        <td>
                          <input
                            value={receivedFrom}
                            onChange={e => setReceivedFrom(e.target.value)}
                            type="text"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right align-top'>Particulars:</td>
                        <td>
                        <textarea
                          value={particulars}
                          onChange={e => setParticulars(e.target.value)}
                          className='w-full text-sm h-24 py-0 px-1 resize-none text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className='px-4 w-full'>
                  <table className='w-full'>
                    <thead><tr><th className='w-40'></th><th></th></tr></thead>
                    <tbody>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Document Status:</td>
                        <td>
                          <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                            <option value=''>Select Type</option>
                            {
                              statusList?.map(item =>
                                <option key={uuid()} value={item.status}>{item.status}</option>
                              )
                            }
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Date Received:</td>
                        <td>
                          <input
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            type="date"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Time Received:</td>
                        <td>
                          <input
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            type="time"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Received By:</td>
                        <td>
                          <input
                            value={receivedBy}
                            onChange={e => setReceivedBy(e.target.value)}
                            type="text"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Date Endorsed:</td>
                        <td>
                          <input
                            value={dateEndorsed}
                            onChange={e => setDateEndorsed(e.target.value)}
                            type="date"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right'>Time Endorsed:</td>
                        <td>
                          <input
                            value={timeEndorsed}
                            onChange={e => setTimeEndorsed(e.target.value)}
                            type="time"
                            className='w-full text-sm py-0 px-1 text-gray-600 border border-gray-200 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                        </td>
                      </tr>
                      <tr>
                        <td className='px-2 py-2 font-semibold text-right align-top'>Attachments:</td>
                        <td>
                          <div>
                          {
                            attachments?.map((file, index) => (
                              <div key={uuid()} className='flex items-center space-x-2 justify-start p-1'>
                                <div
                                  onClick={() => handleDownloadFile(file.name)}
                                  className='flex space-x-2 items-center cursor-pointer'>
                                  <PaperClipIcon
                                    className='w-4 h-4 text-green-700 '/>
                                  <span className='text-green-700 font-medium text-xs'>{file.name.substring(0, 10)}</span>
                                </div>
                                <span
                                  onClick={() => handleDeleteClick(file.name)}
                                  className='text-red-600 cursor-pointer text-xs font-bold'>
                                  [Delete This File]
                                </span>
                              </div>
                            ))
                          }
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td></td>
                        <td>
                        <div className='w-full'>
                          <div {...getRootProps()} className='border border-dashed bg-gray-100 text-gray-600 px-4 py-8'>
                            <input {...getInputProps()} />
                            <p>Drag and drop some files here, or click to select files</p>
                          </div>
                          <div className='py-4'>
                            {selectedFiles}
                          </div>
                        </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex space-x-2 items-center justify-end mt-2 pt-4 border-t border-gray-200 rounded-b-md">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                >
                  {
                    saving
                      ? <span>Saving...</span>
                      : <span>Save Changes</span>
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
            </div>

            {/* Begin Main Content */}
            <div className='px-4 lg:px-0 w-full relative border-t'>
              <div className='lg:w-10/12 mt-4 mx-auto outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'>
                  <ReplyBox
                    handleInsertToList={handleInsertToList}
                    document={documentData}
                  />
                  {
                    replies?.map((reply) => (
                      <RepliesBox
                        key={uuid()}
                        handleRemoveFromList={handleRemoveFromList}
                        handleUpdateRemarksList={handleUpdateRemarksList}
                        reply={reply}/>
                    ))
                  }
                  {
                    documentData?.id < 100209 &&
                    <div className='w-full border-b flex-col space-y-1 px-4 py-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
                      <div className='w-full group mb-5'>
                        <div className='flex items-center space-x-2'>
                          <div className='flex flex-1 items-center space-x-2'>
                            <div>
                              <div className='font-bold'>
                                <span>System:&nbsp;</span>
                              </div>
                              <div className='mt-1'>
                                <div className='mt-2 bg-blue-100 p-2 border border-blue-200 rounded-sm'>
                                  <p><span className='font-bold'>Remarks:</span> {documentData?.remarks}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  <div className='w-full border-b flex-col space-y-1 px-4 py-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
                    <div className='w-full group mb-5'>
                      <div className='flex items-center space-x-2'>
                        <div className='flex flex-1 items-center space-x-2'>
                          <div className='text-gray-500 text-[10px] italic'>
                            {documentData?.asenso_users?.firstname} added this document to the system on {format(new Date(documentData.created_at), 'dd MMM yyyy')}.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
            {/* End Main Content */}
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
