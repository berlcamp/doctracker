/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { CustomButton, OneColLayoutLoading } from '@/components'
import axios from 'axios'

// Types
import type { AccountTypes, DepartmentTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchDepartments } from '@/utils/fetchApi'

interface ModalProps {
  hideModal: () => void
  editData: AccountTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [departments, setDepartments] = useState<DepartmentTypes[] | []>([])
  const [departmentId, setDepartmentId] = useState(editData ? (editData.department_id ? editData.department_id : '') : '')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<AccountTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: AccountTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: AccountTypes) => {
    try {
      const newData = {
        name: formdata.name,
        department_id: formdata.department_id,
        status: 'Active',
        email: formdata.email,
        temp_password: tempPassword.toString(),
        org_id: process.env.NEXT_PUBLIC_ORG_ID
      }

      // Sign up the user on the server side to fix pkce issue https://github.com/supabase/auth-helpers/issues/569
      axios.post('/api/signup', {
        item: newData
      }).then(async function (response) {
        if (response.data.error_message === '') {
          const { error: error2 } = await supabase
            .from('dum_users')
            .insert({ ...newData, id: response.data.insert_id })

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          if (error2) throw new Error(error2.message)

          const dept: any = departments.find((item: DepartmentTypes) => item.id.toString() === formdata.department_id)

          // Append new data in redux
          const updatedData = { ...newData, id: response.data.insert_id, dum_departments: { name: dept.name } }
          dispatch(updateList([updatedData, ...globallist]))

          // pop up the success message
          setToast('success', 'Successfully saved.')

          // Updating showing text in redux
          dispatch(updateResultCounter({ showing: Number(resultsCounter.showing) + 1, results: Number(resultsCounter.results) + 1 }))

          setSaving(false)

          // hide the modal
          hideModal()
          setErrorMessage('')

          // reset all form fields
          reset()
        } else {
          setErrorMessage(response.data.error_message)
          setSaving(false)
        }
      }).catch(function (error) {
        console.error(error)
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: AccountTypes) => {
    if (!editData) return

    const newData = {
      name: formdata.name,
      department_id: formdata.department_id
    }

    try {
      const { error } = await supabase
        .from('dum_users')
        .update(newData)
        .eq('id', editData.id)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (error) throw new Error(error.message)

      const dept: any = departments.find((item: DepartmentTypes) => item.id.toString() === formdata.department_id)

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: editData.id, dum_departments: { name: dept.name } }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : '',
      department_id: editData ? editData.department_id : ''
    })
  }, [editData, reset])

  useEffect(() => {
    const fetchDepartmentsData = async () => {
      const result = await fetchDepartments({}, 300, 0)
      setDepartments(result.data.length > 0 ? result.data : [])
    }

    void fetchDepartmentsData()
  }, [])

  const tempPassword = Math.floor(Math.random() * 8999) + 1000

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

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            {
              !saving
                ? <>
                  {
                    errorMessage !== '' && <div className='mb-3 mt-1 text-xs text-red-600 font-bold'>{errorMessage}</div>
                  }
                  <div className='app__form_field_container'>
                    <div className='w-full'>
                      <div className='app__label_standard'>Name</div>
                      <div>
                        <input
                          {...register('name', { required: true })}
                          type='text'
                          className='app__select_standard'/>
                        {errors.name && <div className='app__error_message'>Name is required</div>}
                      </div>
                    </div>
                  </div>
                  <div className='app__form_field_container'>
                    <div className='w-full'>
                      <div className='app__label_standard'>Department:</div>
                      <div>
                        <select
                          {...register('department_id', { required: true })}
                          value={departmentId}
                          onChange={e => setDepartmentId(e.target.value)}
                          className='app__select_standard'>
                            <option value=''>Choose Department</option>
                            {
                              departments?.map((item, index) => (
                                <option key={index} value={item.id}>{item.name}</option>
                              ))
                            }
                        </select>
                        {errors.department_id && <div className='app__error_message'>Department is required</div>}
                      </div>
                    </div>
                  </div>
                  {
                    !editData &&
                    <>
                      <div className='app__form_field_container'>
                        <div className='w-full'>
                          <div className='app__label_standard'>Email</div>
                          <div>
                            <input
                              {...register('email', { required: true })}
                              type='email'
                              className='app__select_standard'/>
                            {errors.email && <div className='app__error_message'>Email is required</div>}
                          </div>
                        </div>
                      </div>
                      <div className='app__form_field_container'>
                        <div className='w-full'>
                          <div className='app__label_standard'>Temporary Password: <span className='font-bold'>{tempPassword}</span></div>
                        </div>
                      </div>
                    </>
                  }
                  </>
                : <OneColLayoutLoading/>
            }
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
                    isDisabled={saving}
                    title={saving ? 'Saving...' : 'Submit'}
                    containerStyles="app__btn_green"
                  />
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
  )
}

export default AddEditModal
