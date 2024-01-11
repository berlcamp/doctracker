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
          ? <div className='relative flex items-center justify-center bg-black overflow-hidden'>
              <Image src={user?.avatar_url} width={20} height={20} alt='user'/>
            </div>
          : <Avatar round={false} size="20" name={name}/>
      }
      <div className='font-medium capitalize'>{name}</div>
    </div>
  )
}
export default UserBlock
