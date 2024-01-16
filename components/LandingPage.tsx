'use client'
import { StatusFlow, TopBarDark } from '@/components'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LandingPage () {
  const [routingNo, setRoutingNo] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [notFound, setNotFound] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleTrack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (routingNo.trim() === '') {
      setRoutingNo('')
      setDocumentId('')
      return
    }

    const { data } = await supabase
      .from('dum_document_trackers')
      .select()
      .eq('routing_slip_no', routingNo)
      .limit(1)
      .single()

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setDocumentId(data.id.toString())
      setNotFound(false)
    } else {
      setDocumentId('')
      setNotFound(true)
    }
  }

  return (
    <>
      <div className="app__landingpage">
        <TopBarDark isGuest={true}/>
        <div className='mt-20 flex flex-col space-y-2 items-center justify-center'>
          <div className='text-3xl'>Track and Trace</div>
          <div className='flex items-center space-x-2'>
            <form onSubmit={handleTrack}>
              <input
                type='text'
                value={routingNo}
                onChange={e => setRoutingNo(e.target.value)}
                className='border outline-none px-2 py-2 text-sm'
                placeholder='Enter valid Routing No'/>
              <button
                className='bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-500 border border-emerald-600 font-bold px-8 py-2 text-sm text-white rounded-sm'
                type='submit'>Track</button>
            </form>
          </div>
        </div>
        {
          notFound &&
            <div className='my-10 text-center text-gray-700'>No document matched to this Routing No.</div>
        }
        <div className='w-full px-10 my-10'>
          {
            documentId !== '' && <StatusFlow documentId={documentId} updateStatusFlow={true}/>
          }
        </div>
        <div className='mt-auto bg-gray-800 p-4 text-white fixed bottom-0 w-full'>
          <div className='text-white text-center text-xs'>&copy; DOC-TRACKER v2.0</div>
        </div>
      </div>
    </>
  )
}
