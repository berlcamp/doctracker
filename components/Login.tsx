'use client'
import React, { useState } from 'react'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'
import { useRouter } from 'next/navigation'

// Supabase auth needs to be triggered client-side
export default function Login () {
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

    // Check if the user is on asenso_users table
    const { data: user, error: userError } = await supabase
      .from('asenso_users')
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
        router.push('/')
      }
    } else {
      setError('This is account is currently inactive.')
      setSigningIn(false)
    }
  }

  return !session && (
        <div className='mx-4 pb-10'>
          {/* Cover and Login box */}
          <div className='md:flex items-start justify-center space-x-4 md:mt-12 md:py-10'>
            <div className='flex items-start justify-center'>
              <div className='bg-white p-4 rounded-lg shadow-lg px-12'>
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
                      id="exampleFormControlInput1"
                      placeholder="Email"
                      />
                  </div>
                  <div className="mb-4">
                      <input
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      type="password"
                      className="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                      id="exampleFormControlInput1"
                      placeholder="Password"
                      />
                  </div>
                  <div className="text-center pt-1 mb-12 pb-1">
                    <CustomButton
                        containerStyles="inline-block px-6 py-2.5 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg transition duration-150 ease-in-out w-full mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                        btnType="submit"
                        title={signingIn ? 'Signing In...' : 'Login'}
                        />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
  )
}
