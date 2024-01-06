'use client'
import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Remarks from './(remarks)/Remarks'
import { useSupabase } from '@/context/SupabaseProvider'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'

export default function RemarksModal ({ hideModal, documentId }) {
  const { supabase } = useSupabase()
  const [documentData, setDocumentData] = useState(null)
  const [formattedData, setFormattedData] = useState(null)
  const [routingSlipNo, setRoutingSlipNo] = useState(null)

  const fetchData = async () => {
    // Fetch Document Data
    const { data: documents } = await supabase
      .from('dum_document_trackers')
      .select('*, dum_document_tracker_replies(*), asenso_users:user_id(firstname)')
      .eq('id', documentId)
      .limit(1)
      .single()

    // Fetch Document Replies
    const { data: repliesData } = await supabase
      .from('dum_document_tracker_replies')
      .select('*,asenso_users:sender_id(*)')
      .eq('document_tracker_id', documentId)
      .order('id', { ascending: false })

    const formatted = repliesData?.map(item => {
      return { ...item, created_at: format(new Date(item.created_at), 'dd MMM yyyy HH:mm') }
    })

    setFormattedData(formatted)
    setDocumentData(documents)
    setRoutingSlipNo(documents.routing_slip_no)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                {routingSlipNo}
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <div className="modal-body relative overflow-x-scroll">
              {
                (!documentData && !formattedData) &&
                  <TwoColTableLoading/>
              }
              {
                (documentData && formattedData) &&
                  <Remarks
                    documentData={documentData}
                    hideModal={hideModal}
                    repliesData={formattedData}
                    modalTitle={(newTitle) => setRoutingSlipNo(newTitle)}
                    />
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
