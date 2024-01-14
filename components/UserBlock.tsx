'use client'
import React from 'react'
import Image from 'next/image'
import Avatar from 'react-avatar'

// types
import type { AccountTypes } from '@/types'

interface PropTypes {
  user: AccountTypes | undefined
}

const UserBlock = ({ user }: PropTypes) => {
  const name = user ? user.name : ''
  return (
    <div className='flex items-center space-x-1'>
      {
        (user?.avatar_url && user?.avatar_url !== '')
          ? <div className='relative w-6 h-6 bg-black overflow-hidden'>
              <Image src={user?.avatar_url} fill={true} sizes="(max-width: 28px) 100vw, (max-width: 28px) 50vw, 33vw" className='object-cover' alt=''/>
            </div>
          : <Avatar round={false} size="20" name={name}/>
      }
      <div className='font-medium capitalize'>{name}</div>
    </div>
  )
}
export default UserBlock
