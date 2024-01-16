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
export default function Announcements () {
  return (
    <div className=''>
      <h4 className="text-xl font-semibold mb-6">Announcements:</h4>
      {
        items.map((item, index) => (
          <div key={uuid()} className='mb-8'>
            <div className='font-bold'>Taiwan presidential frontrunner says no plans to change islands formal name</div>
            <div className='text-sm'>TAIPEI (Reuters) - The leading candidate to be Taiwans new president, Vice President William Lai, said in an interview on Tuesday that he has no plans to change the islands formal name, but reiterated that Taiwan is not subordinate to China.</div>
          </div>
        ))
      }
    </div>
  )
}
