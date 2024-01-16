import Link from 'next/link'
import React from 'react'
import uuid from 'react-uuid'

const items = [
  {
    id: 1,
    title: 'Teacher I - Elementary',
    school: 'Alegeria Elementary School'
  },
  {
    id: 2,
    title: 'Teacher II - Elementary',
    school: 'A. Romero Elementary School'
  }
]
export default function Jobs () {
  return (
    <div className=''>
      <h4 className="text-xl font-semibold mb-6">Vacant Items:</h4>
      {
        items.map((item, index) => (
          <div key={uuid()} className='flex items-start text-sm space-x-4 mb-8'>
            <div>{index + 1}.</div>
            <div className='flex flex-col space-y-1'>
              <div className='font-bold'>{item.title}</div>
              <div>{item.school}</div>
              <div className='pt-2'>
                <Link href="#" className="app__btn_green">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  )
}
