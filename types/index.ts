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
  rightIcon?: any
  handleClick?: MouseEventHandler<HTMLButtonElement>
}

export interface NotificationTypes {
  id?: string
  message: string
  created_at?: string
  url: string
  type: string
  user_id: string
  dum_document_tracker_id?: string
  reference_table?: string
  is_read?: boolean
}

export interface AccountDetailsForm {
  firstname: string
  middlename: string
  lastname: string
}

export interface StickiesTypes {
  id: string
  document_tracker_id: string
  user_id: string
  note: string
  color: string
  dum_document_trackers: DocumentTypes
}

export interface FollowersTypes {
  tracker_id: string
  user_id: string
}

export interface DocumentTypes {
  id: string
  type: string
  cheque_no?: string
  amount?: string
  activity_date: string
  agency: string
  name: string
  particulars: string
  contact_number: string
  status: string
  current_status: string
  current_department_id: string
  dum_document_trackers: string
  supplier_name: string
  purchase_request_number: string
  date_received: string
  created_at: string
  user_id: string
  date_delivered: string
  routing_no: string
  routing_slip_no: string
  dum_remarks: any
  dum_users: AccountTypes
  received_by_user: AccountTypes
  origin_department_id: string
  dum_departments: DepartmentTypes
  current_department: DepartmentTypes
  dum_document_followers: FollowersTypes[]
  dum_document_tracker_stickies: StickiesTypes[]
}

export interface RemarksTypes {
  id: string
  created_at: string
  document_tracker_id: string
  sender_id: string
  message: string
  is_private: boolean
  reply_type: string
  dum_users: AccountTypes
  dum_remarks_comments: CommentsTypes[]
}

export interface CommentsTypes {
  id: string
  created_at: string
  remarks_id: string
  sender_id: string
  message: string
  dum_users: AccountTypes
  dum_remarks: RemarksTypes
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

export interface DocTypes {
  id: string
  type: string
  shortcut: string
  isChecked?: boolean
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
  document_types: string[]
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
  dum_tracker_logs: TrackerLogsTypes[]
}

export interface TrackerLogsTypes {
  tracker_flow_id: string
  created_at: string
  user_id: string
  message: string
  dum_user: AccountTypes
}
