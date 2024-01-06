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

export interface AsensoUserTypes {
  id: string
  firstname: string
  middlename: string
  lastname: string
  email: string
}

export interface DistrictTypes {
  name: string
  head_user_id: string
  id: string
  asenso_users?: any
}

export interface Office {
  name: string
  head_user_id: string
  id: string
  asenso_users?: any
}

export interface SchoolTypes {
  name: string
  type: string
  school_class: string
  size: string
  school_id: string
  district_id: string
  head_user_id: string
  id: string
  asenso_users?: any
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

export interface Employee {
  id: string
  firstname: string
  middlename: string
  lastname: string
  email: string
  org_id: string
  assignment: string
}

export interface AccountDetailsForm {
  firstname: string
  middlename: string
  lastname: string
}

export interface Assignment {
  designation: string
  hrm_user_id: string
  id: string
  area_assigned: string
  from: string
  to: string
  type?: string
  add_to_service_record: boolean
  asenso_users?: any
}

export interface Designation {
  designation: string
  hrm_user_id: string
  id: string
  area_assigned: string
  from: string
  to: string
  type?: string
  add_to_service_record: boolean
}

export interface DocumentType {
  id: string
  no?: number
  type: string
  cheque_no: string
  amount: string
  activity_date: string
  agency: string
  name: string
  particulars: string
  status: string
  remarks: string
  date: string
  time: string
  received_by: string
  received_from: string
  date_endorsed: string
  time_endorsed: string
  user_id: string
  routing_no: string
  routing_slip_no: string
  date_received_cadm: string
  dum_document_tracker_replies: any
}

export interface RequirementTypes {
  isComplete: boolean
  label: string
}

export interface OfopChangeLogTypes {
  message: string
  id: string
  created_at: string
  asenso_user_id: string
  asenso_users: AsensoUserTypes
}

export interface OfopTypes {
  no: number
  fullname: string
  lastname: string
  firstname: string
  number: string
  payroll_number: string
  address: string
  school: string
  gender: string
  course: string
  year: string
  middlename: string
  remarks: string
  requirements: RequirementTypes[]
  barangay: string
  contact_number: string
  birthday: string
  scholarship: string
  parents: string
  id: string
  batch: string
  status: string
  is_present: string
  is_hold: string
  ofop_change_logs: OfopChangeLogTypes[]
}

export interface BarangayTypes {
  id: string
  barangay: string
  municipality: string
}

export interface DistrictAssistanceTypes {
  id: string
  fullname: string
  patient_previous_name: string
  requester_category: string
  patient_category: string
  patient_profession: string
  guarantee_no: string
  guarantee_no_text: string
  patient_barangay_id: string
  requester_barangay_id: string
  bill_type: string
  request_type: string
  request_type_others: string
  address: string
  reason: string
  gender: string
  age: string
  status: string
  referral: string
  referral_address: string
  referral_profession: string
  referral_gender: string
  referral_previous_name: string
  referral_age: string
  referral_remarks: string
  is_patient_registered: string
  is_referral_registered: string
  is_maip: string
  relationship: string
  sp: string
  referral_sp: string
  philhealth: string
  room_type: string
  category: string
  hospital: string
  pcso_amount: string
  dswd_amount: string
  amount: string
  include_on_bill: string
  granted_amount: string
  lgu_amount: string
  families: FamilyCompositionTypes[]
  doctors: DoctorTypes[]
  professional_fee: string
  remarks: string
  patient_remarks: string
  diagnosis: string
  cause_of_death: string
  deleted: string
  date: string
  date_approved: string
  date_death: string
  purpose: string
  funeral: string
  requested_amount: string
  hospital_or_funeral: string
  total_professional_fee: string
  professional_fee_remarks: string
  professional_fee_discount_senior: string
  professional_fee_discount_philhealth: string
  professional_fee_discount_others: string
  reason_not_ward: string
  reason_not_mhars: string
  from_lgu: string
  sffo_amounts: string
  others_amounts: string
  other_expenses: string
  date_admitted: string
  date_discharged: string
  pwd_discount: string
  total_bill: string
  excess_bill: string
  phc_status: string
  patient_barangay: BarangayTypes
}

export interface FamilyCompositionTypes {
  fullname: string
  category: string
  remarks: string
  ref: number
}

export interface DoctorTypes {
  fullname: string
  professional_fee: string
  ref: number
}

export interface VoterTypes {
  id?: string
  fullname: string
  address?: string
  category?: string
  category_recommended: string
  service_provider?: ServiceProviderTypes
}

export interface PatientTypes {
  fullname: string
}

export interface ServiceProviderTypes {
  id: string
  new: string
  name: string
  new_number: string
  contact_number: string
}

export interface VoterBarangayTypes {
  id: string
  address: string
}

export interface AccountTypes {
  id: string
  name: string
  status: string
  password: string
  avatar_url: string
  email: string
  org_id: string
  created_by: string
  asenso_users: AccountTypes
  temp_password: string
}

export interface PurchaseOrderTypes {
  id: string
  date: string
  quantity: string
  po_no: string
  description: string
  subsidy: string
  type: string
  amount: string
  price: string
  remarks: string
}
