import { type MouseEventHandler } from 'react'

export interface SelectUserNamesProps {
  settingsData: any[]
  multiple: boolean
  type: string
  handleManagerChange: (newdata: any[], type: string) => void
  title: string
}

export interface searchUser {
  firstname: string
  middlename: string
  lastname: string
  uuid?: string
  id: string
}

export interface namesType {
  firstname: string
  middlename: string
  lastname: string
  uuid?: string
  id: string
}

export interface settingsDataTypes {
  access_type: string
  data: namesType
}

export interface CustomButtonTypes {
  isDisabled?: boolean
  btnType?: 'button' | 'submit'
  containerStyles?: string
  textStyles?: string
  title: string
  rightIcon?: string
  handleClick?: MouseEventHandler<HTMLButtonElement>
}

export interface NotificationTypes {
  id: string
  message: string
  created_at: string
  url: string
  type: string
  user_id: string
  reference_id?: string
  is_read: boolean
}

export interface AccountDetailsForm {
  firstname: string
  middlename: string
  lastname: string
}

export interface DocumentTypes {
  id: string
  no?: number
  type: string
  cheque_no?: string
  amount?: string
  activity_date: string
  agency?: string
  name: string
  particulars: string
  status: string
  current_status: string
  current_department_id: string
  remarks: string
  date: string
  time: string
  received_by: string
  received_from: string
  date_endorsed: string
  time_endorsed: string
  created_at: string
  user_id: string
  routing_no: string
  routing_slip_no: string
  date_received_cadm: string
  dum_document_tracker_replies: any
  dum_users: AccountTypes
  origin_department_id: string
  dum_departments: DepartmentTypes
  current_department: DepartmentTypes
}

export interface RepliesDataTypes {
  id: string
  new: boolean
  created_at: string
  document_tracker_id: string
  sender_id: string
  message: string
  is_private: boolean
  parent_document_tracker_id: string
  reply_type: string
  dum_users: AccountTypes
}

export interface CommentDataTypes {
  id: string
  created_at: string
  sender_id: string
  message: string
  dum_users: AccountTypes
}

export interface AccountTypes {
  id: string
  name: string
  firstname: string
  middlename: string
  lastname: string
  status: string
  password: string
  avatar_url: string
  email: string
  org_id: string
  created_by: string
  dum_users: AccountTypes
  temp_password: string
  department_id: string
  dum_departments: DepartmentTypes
}

export interface AttachmentTypes {
  id: string
  name: string
}

interface LogMessageTypes {
  field: string
  old_value: string
  new_value: string
}

export interface LogTypes {
  id: string
  created_at: string
  document_tracker_id: string
  sender_id: string
  message: LogMessageTypes[]
  is_private: boolean
  parent_document_tracker_id: string
  reply_type: string
  dum_users: AccountTypes
}

export interface DepartmentTypes {
  status?: string
  id: string
  name: string
  dum_users?: AccountTypes
}

export interface FlowListTypes {
  id: string
  tracker_id: string
  department_id: string
  created_at: string
  user_id: string
  status: string
  dum_user: AccountTypes
  dum_department: DepartmentTypes
}
