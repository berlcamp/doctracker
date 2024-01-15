import type { DocumentTypes, RemarksTypes } from '@/types'
import { useEffect, useState } from 'react'
import RemarkBox from './RemarkBox'
import RemarksList from './RemarksList'
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import { useSupabase } from '@/context/SupabaseProvider'

interface ModalProps {
  document: DocumentTypes
}

export default function Remarks ({ document }: ModalProps) {
  //
  const [repliesData, setRepliesData] = useState<RemarksTypes[] | []>([])

  const { supabase } = useSupabase()

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  const fetchRemarks = async () => {
    // Fetch Document Replies
    const { data: repliesData } = await supabase
      .from('dum_remarks')
      .select('*,dum_users:sender_id(*),dum_remarks_comments(*, dum_users:sender_id(name,avatar_url))')
      .eq('document_tracker_id', document.id)
      .order('id', { ascending: false })

    // Update remarks in redux
    dispatch(updateRemarksList(repliesData))
  }

  // Update remarks list whenever list in redux updates
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setRepliesData(globalremarks)
  }, [globalremarks])

  useEffect(() => {
    void fetchRemarks()
  }, [])

  return (
    <div className='w-full relative'>
      <div className='mt-4 mx-2 outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'>
          <RemarkBox
            document={document}
          />
          {
            repliesData?.map((reply, index) => (
              <RemarksList
                key={index}
                document={document}
                reply={reply}/>
            ))
          }
      </div>
    </div>
  )
}
