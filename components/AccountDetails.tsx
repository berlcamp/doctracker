/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import React, { type ChangeEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import OneColLayoutLoading from './Loading/OneColLayoutLoading'
import Avatar from 'react-avatar'
import Image from 'next/image'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

import { generateReferenceCode } from '@/utils/text-helper'
import { useRouter } from 'next/navigation'

interface ModalProps {
  hideModal: () => void
  id: string
  shouldUpdateRedux: boolean
}

interface FormTypes {
  name: string
  password: string
  password2: string
}

const AccountDetails = ({ hideModal, shouldUpdateRedux, id }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: FormTypes) => {
    if (loading || saving) return

    void handleUpdate(formdata)
  }

  const handleUpdate = async (formdata: FormTypes) => {
    setSaving(true)

    const newData = {
      name: formdata.name
    }
    try {
      const { error } = await supabase
        .from('dum_users')
        .update(newData)
        .eq('id', id)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      if (shouldUpdateRedux) {
        console.log('redux updated')
        const items = [...globallist]
        const updatedData = { ...newData, id }
        const foundIndex = items.findIndex(x => x.id === updatedData.id)
        items[foundIndex] = { ...items[foundIndex], ...updatedData }
        dispatch(updateList(items))
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()
    }
  }

  const handleUploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        setUploading(true)

        // delete the existing user avatar on supabase storage
        const { data: files, error: error3 } = await supabase.storage.from('dum').list(`user_avatar/${id}`)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (error3) throw new Error(error3.message)
        if (files.length > 0) {
          const filesToRemove = files.map((x: { name: string }) => `user_avatar/${id}/${x.name}`)
          const { error: error4 } = await supabase.storage.from('dum').remove(filesToRemove)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          if (error4) throw new Error(error4.message)
        }

        // upload the new avatar
        const file = e.target.files?.[0]
        const newFileName = generateReferenceCode()
        // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
        const customFilePath = `user_avatar/${id}/${newFileName}.` + (file.name.split('.').pop() as string)
        const { error } = await supabase
          .storage
          .from('dum')
          .upload(`${customFilePath}`, file, {
            cacheControl: '3600',
            upsert: true
          })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (error) throw new Error(error.message)

        // get the newly uploaded file public path
        await handleFetchAvatar(customFilePath)
      } catch (error) {
        console.error('Error uploading file:', error)
      } finally {
        router.refresh()
        setUploading(false)
      }
    }
  }

  const handleFetchAvatar = async (path: string) => {
    try {
      // get the public avatar url
      const { data, error } = await supabase
        .storage
        .from('dum')
        .getPublicUrl(`${path}`)

      if (error) throw new Error(error.message)

      // update avatar url on dum_users table
      const { error2 } = await supabase
        .from('dum_users')
        .update({ avatar_url: data.publicUrl })
        .eq('id', id)

      if (error2) throw new Error(error2.message)

      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('dum_users')
          .select()
          .eq('id', id)
          .limit(1)
          .maybeSingle()

        if (error) throw new Error(error.message)

        setAvatarUrl(data.avatar_url)

        reset({
          name: data ? data.name : ''
        })
      } catch (e) {
        console.error('fetch error: ', e)
      } finally {
        setLoading(false)
      }
    }

    void fetchAccountDetails()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Account Details
              </h5>
              <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
            </div>

            {/* Modal Content */}
            <div className='app__modal_body'>
              { loading && <OneColLayoutLoading/> }
              {
                !loading &&
                  <form onSubmit={handleSubmit(onSubmit)} className="">
                    <div className='text-center'>
                      {
                        (avatarUrl && avatarUrl !== '')
                          ? <Image src={avatarUrl} width={60} height={60} alt="alt" className='mx-auto'/>
                          : <Avatar round={false} size="60" name={session.user.email.split('@')[0]} />
                      }
                      <div className="relative">
                        <input type="file" onChange={handleUploadPhoto} className="hidden" id="file-input" accept="image/*"/>
                        {
                          !uploading
                            ? <label htmlFor="file-input" className="cursor-pointer py-px px-1 text-xs text-blue-600">
                                Change Profile Photo
                              </label>
                            : <span className='py-px px-1 text-xs text-blue-600'>Uploading...</span>
                        }
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Name:</div>
                        <div>
                          <input
                            {...register('name', { required: true })}
                            type="text"
                            className='app__input_standard'/>
                          {errors.name && <div className='app__error_message'>Name is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className="app__modal_footer">
                          <button
                            type="submit"
                            className="app__btn_green_sm"
                          >
                            {saving ? 'Saving..' : 'Save'}
                          </button>
                    </div>
                  </form>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountDetails
