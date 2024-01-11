import type { RepliesDataTypes } from '@/types'
import { useState } from 'react'
import ReplyBox from './ReplyBox'
import RepliesBox from './RepliesBox'

interface ModalProps {
  repliesData: RepliesDataTypes[] | []
  documentId: string
}

export default function Remarks ({ repliesData, documentId }: ModalProps) {
  //
  const [replies, setReplies] = useState<RepliesDataTypes[] | []>(repliesData)

  const handleUpdateRemarksList = (updatedData: RepliesDataTypes) => {
    const items = [...replies]
    const foundIndex = items.findIndex((x: RepliesDataTypes) => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    setReplies(items)
  }

  const handleInsertToList = (newData: RepliesDataTypes) => {
    setReplies([newData, ...replies])
  }

  const handleRemoveFromList = async (id: string) => {
    setReplies(prevList => prevList.filter(item => item.id.toString() !== id))
  }

  return (
    <div className='w-full relative'>
      <div className='mt-4 mx-2 outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'>
          <ReplyBox
            handleInsertToList={handleInsertToList}
            documentId={documentId}
          />
          {
            replies?.map((reply, index) => (
              <RepliesBox
                key={index}
                handleRemoveFromList={handleRemoveFromList}
                handleUpdateRemarksList={handleUpdateRemarksList}
                reply={reply}/>
            ))
          }
      </div>
    </div>
  )
}
