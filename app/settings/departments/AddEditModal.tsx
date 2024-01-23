/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { CustomButton, OneColLayoutLoading } from '@/components'

// Types
import type { AccountTypes, DepartmentTypes, DocTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useSupabase } from '@/context/SupabaseProvider'

interface ModalProps {
  hideModal: () => void
  editData: DepartmentTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [docTypes, setDocTypes] = useState<DocTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<DepartmentTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: DepartmentTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: DepartmentTypes) => {
    try {
      const ids: string[] = []
      docTypes.forEach(docType => {
        if (docType.isChecked) {
          ids.push(docType.id)
        }
      })

      const newData = {
        name: formdata.name,
        created_by: session.user.id,
        status: 'Active',
        document_types: ids,
        org_id: process.env.NEXT_PUBLIC_ORG_ID
      }

      const { data, error: error2 } = await supabase
        .from('dum_departments')
        .insert(newData)
        .select()

      if (error2) throw new Error(error2.message)

      // Append new data in redux
      const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)
      const updatedData = { ...newData, id: data[0].id, dum_users: { name: user.name, avatar_url: user.avatar_url } }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: Number(resultsCounter.showing) + 1, results: Number(resultsCounter.results) + 1 }))

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: DepartmentTypes) => {
    if (!editData) return

    const ids: string[] = []
    docTypes.forEach(docType => {
      if (docType.isChecked) {
        ids.push(docType.id)
      }
    })

    const newData = {
      name: formdata.name,
      document_types: ids
    }

    try {
      const { error } = await supabase
        .from('dum_departments')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: editData.id }
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
    }
  }

  const handleCheckType = (id: string) => {
    const filterDTypes = docTypes.map(item => {
      if (item.id.toString() === id) {
        return { ...item, isChecked: !item.isChecked }
      } else {
        return item
      }
    })
    setDocTypes(filterDTypes)
  }

  useEffect(() => {
    const fetchDocTypes = async () => {
      const { data }: { data: DocTypes[] } = await supabase
        .from('dum_document_types')
        .order('type', { ascending: true })
        .select()

      // set checked types
      if (editData?.document_types) {
        const dTypes: DocTypes[] = [...data]
        const filterDTypes = dTypes.map(item => {
          const find = [...editData.document_types].find(i => i.toString() === item.id.toString())
          if (find) {
            return { ...item, isChecked: true }
          } else {
            return { ...item, isChecked: false }
          }
        })
        setDocTypes(filterDTypes)
      } else {
        const filterDTypes = data.map(item => {
          return { ...item, isChecked: false }
        })
        setDocTypes(filterDTypes)
      }
    }

    void fetchDocTypes()
  }, [])

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : ''
    })
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Department Details
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            {
              !saving
                ? <>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Department Name</div>
                        <div>
                          <input
                            {...register('name', { required: true })}
                            type='text'
                            className='app__select_standard'/>
                          {errors.name && <div className='app__error_message'>Department Name is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Users of this department can create the following Document Types:</div>
                        <div className='mt-4'>
                          <ul className="grid grid-cols-2 gap-2">
                          {
                            docTypes?.map((item, index) => (
                              <li key={index} className="text-xs"><label><input type='checkbox' checked={item.isChecked} onChange={() => handleCheckType(item.id.toString())}/> {item.type}</label></li>
                            ))
                          }
                          </ul>
                        </div>
                      </div>
                    </div>
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
