'use client'
import React, { useState } from 'react'

import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'
import { useRouter } from 'next/navigation'

// Supabase auth needs to be triggered client-side
export default function LoginBox () {
  const { supabase, session } = useSupabase()
  const [signingIn, setSigningIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (email.trim() === '' || password.trim() === '') return

    setSigningIn(true)

    // Check if the user is on hrm_users table
    const { data: user, error: userError } = await supabase
      .from('dum_users')
      .select()
      .eq('email', email)
      .eq('status', 'Active')
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    if (userError) console.error(userError)

    if (user.length > 0) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError('Credentials provided is incorrect.')
        setSigningIn(false)
      } else {
        router.refresh()
      }
    } else {
      setError('This is account is currently inactive.')
      setSigningIn(false)
    }
  }

  return !session && (
    <div className=''>
      <div className='flex items-start justify-center'>
        <div className='bg-white p-4 w-96 rounded-lg shadow-lg'>
          <form onSubmit={handleEmailLogin}>
            <div className="text-center">
              <h4 className="text-xl font-semibold mt-1 mb-12 pb-1">Login to your Account</h4>
            </div>
            { error && <p className="mb-2 text-red-600 bg-red-100 text-sm px-2 py-1 font-medium">{error}</p> }
            <div className="mb-4">
                <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                type="email"
                className="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Email"
                />
            </div>
            <div className="mb-4">
                <input
                value={password}
                onChange={event => setPassword(event.target.value)}
                type="password"
                className="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Password"
                />
            </div>
            <div className="text-center pt-1 mb-12 pb-1">
              <CustomButton
                  containerStyles="app__btn_green_sm w-full"
                  btnType="submit"
                  isDisabled={signingIn}
                  title={signingIn ? 'Signing In...' : 'Login'}
                  />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
