'use client'

import { fetchDocuments, fetchActivities } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon, PrinterIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, DeleteModal, TableRowLoading, CustomButton, ShowMore, TrackerSideBar, Title, Unauthorized, UserBlock } from '@/components'
import AddDocumentModal from './AddDocumentModal'
import DetailsModal from './DetailsModal'
import ActivitiesModal from './ActivitiesModal'
import uuid from 'react-uuid'
import Filters from './Filters'
import { format } from 'date-fns'
import { Pdf } from './Pdf'

// Types
import type { AccountTypes, DocumentTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { statusList, superAdmins } from '@/constants/TrackerConstants'
import { useSupabase } from '@/context/SupabaseProvider'
import { useFilter } from '@/context/FilterContext'
import DownloadExcelButton from './DownloadExcel'
import { useSearchParams } from 'next/navigation'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [viewActivity, setViewActivity] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterTypes, setFilterTypes] = useState<any[] | []>([])
  const [filterAgency, setFilterAgency] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [list, setList] = useState<DocumentTypes[]>([])
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [showingCount, setShowingCount] = useState<number>(0)
  const [resultsCount, setResultsCount] = useState<number>(0)
  const [activitiesData, setActivitiesData] = useState<DocumentTypes[]>([])

  const searchParams = useSearchParams()

  const { session, systemUsers } = useSupabase()
  const { hasAccess } = useFilter()

  const user: AccountTypes = systemUsers.find((user: AccountTypes) => user.id === session.user.id)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const filterUrl = searchParams.get('filter')
      const result = await fetchDocuments({ filterDateFrom, filterDateTo, filterKeyword, filterTypes, filterAgency, filterStatus }, filterUrl, user, perPageCount, 0)

      // update the list in redux
      dispatch(updateList(result.data))

      setResultsCount(result.count ? result.count : 0)
      setShowingCount(result.data.length)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true)

    try {
      const filterUrl = searchParams.get('filter')
      const result = await fetchDocuments({ filterDateFrom, filterDateTo, filterKeyword, filterTypes, filterAgency, filterStatus }, filterUrl, user, perPageCount, list.length)

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      setResultsCount(result.count ? result.count : 0)
      setShowingCount(newList.length)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }

  const handleShowDetailsModal = (item: DocumentTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  const handleViewActivities = () => {
    setViewActivity(true)
  }

  const handlePrintPdf = (item: DocumentTypes) => {
    void Pdf(item)
  }

  const getStatusColor = (status: string): string => {
    const statusArr = statusList.filter(item => item.status === status)
    if (statusArr.length > 0) {
      return statusArr[0].color
    } else {
      return '#000000'
    }
  }

  // Upcoming activities
  const fetchActivitiesData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const today2 = new Date()
    const endDate = new Date()
    endDate.setDate(today2.getDate() + 20)

    const result = await fetchActivities(today, endDate)

    setActivitiesData(result.data)
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDateFrom, filterDateTo, filterKeyword, filterTypes, filterAgency, searchParams, filterStatus, perPageCount])

  useEffect(() => {
    void fetchActivitiesData()
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list
  const email: string = session.user.email

  // Check access from permission settings or Super Admins
  if (!hasAccess('document_tracker') && !superAdmins.includes(email)) return <Unauthorized/>

  return (
    <>
    <Sidebar>
      <TrackerSideBar/>
    </Sidebar>
    <div className="app__main">
      <div>
          {/* Header */}
          <TopBar/>
          <div className='app__title'>
            <Title title='Document Tracker'/>
            <CustomButton
              containerStyles='app__btn_orange'
              title='Upcoming Activities'
              btnType='button'
              handleClick={handleViewActivities}
            />
            <CustomButton
              containerStyles='app__btn_green'
              title='Add New Document'
              btnType='button'
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterDateFrom={setFilterDateFrom}
              setFilterDateTo={setFilterDateTo}
              setFilterKeyword={setFilterKeyword}
              setFilterAgency={setFilterAgency}
              setFilterStatus={setFilterStatus}
              setFilterTypes={setFilterTypes}/>
          </div>

          {/* Download Excel */}
          {
            !isDataEmpty && <div className='flex justify-end mb-2'><DownloadExcelButton documents={list}/></div>
          }

          {/* Per Page */}
          <PerPage
            showingCount={showingCount}
            resultsCount={resultsCount}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}/>

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                  <tr>
                        <th className="py-2 pl-4"></th>
                        <th className="py-2 px-2 w-32">
                            Routing&nbsp;No
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                          Status
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Name&nbsp;/&nbsp;Payee
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Agency
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Particulars
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Origin
                        </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: DocumentTypes) => (
                    <tr
                      key={uuid()}
                      className="app__tr">
                      <td
                        className="w-6 pl-4 app__td">
                        <Menu as="div" className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
                              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute left-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  <div
                                      onClick={() => handlePrintPdf(item)}
                                      className='flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs'
                                    >
                                      <PrinterIcon className='w-4 h-4'/>
                                      <span>Print</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={ () => handleDelete(item.id) }
                                      className='flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs'
                                    >
                                      <TrashIcon className='w-4 h-4'/>
                                      <span>Delete</span>
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th
                        className="py-2 px-2 text-gray-900 dark:text-white">
                        <div className="font-semibold">
                          <span>
                            {item.routing_slip_no}
                          </span>
                        </div>
                        <div className='mt-2'>
                          <button
                            onClick={() => handleShowDetailsModal(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                            >Tracker</button>
                        </div>

                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden py-2">
                            <span className='font-light'>Type: </span>
                            <span className='font-semibold'>{item.type}</span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden py-2">
                            <span className='font-light'>Status: </span>
                            <span className='' style={{ color: `${getStatusColor(item.current_status)}` }}>{item.current_status} {item.current_status === 'Forwarded' ? 'to' : 'at'}  {item.current_department.name}</span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden py-2">
                          <span className='font-light'>Name:</span>
                            <span className='font-semibold'>{item.name}</span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden py-2">
                            <span className='font-light'>Agency: </span>
                            <span className='font-semibold'>{item.agency}</span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden py-2">
                            <span className='font-light'>Particulars: </span>
                            <span className='font-semibold'>{item.particulars}</span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden py-2">
                            <span className='font-light'>Origin: </span>
                            <div className='font-bold'>{item.dum_departments.name}</div>
                            <div className='text-gray-500 text-[10px]'>{format(new Date(item.created_at), 'dd MMM yyyy h:mm a')}</div>
                            <UserBlock user={item.dum_users}/>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td className="hidden md:table-cell py-2 px-2">
                        <span className='font-bold' style={{ color: `${getStatusColor(item.current_status)}` }}>{item.current_status} {item.current_status === 'Forwarded' ? 'to' : 'at'} {item.current_department.name}</span>
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        <div>{item.name}</div>
                        {
                          (item.amount && item.amount !== '') &&
                            <div className='font-bold'>Amount: {Number(item.amount).toLocaleString()}</div>
                        }
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.agency}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.particulars}
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-bold'>{item.dum_departments.name}</div>
                        <div className='text-gray-500 text-[10px]'>{format(new Date(item.created_at), 'dd MMM yyyy h:mm a')}</div>
                        <UserBlock user={item.dum_users}/>
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={7} rows={2}/> }
              </tbody>
            </table>
            {
              (!loading && isDataEmpty) &&
                <div className='app__norecordsfound'>No records found.</div>
            }
          </div>

          {/* Show More */}
          {
            (resultsCount > showingCount && !loading) &&
              <ShowMore
                handleShowMore={handleShowMore}/>
          }

          {/* Add/Edit Modal */}
          {
            showAddModal && (
              <AddDocumentModal
                hideModal={() => setShowAddModal(false)}/>
            )
          }

          {/* Details Modal */}
          {
              (showDetailsModal && selectedItem) && (
                <DetailsModal
                  documentData={selectedItem}
                  hideModal={() => setShowDetailsModal(false)}/>
              )
            }

          {/* Confirm Delete Modal */}
          {
            showDeleteModal && (
              <DeleteModal
                table='dum_document_trackers'
                selectedId={selectedId}
                showingCount={showingCount}
                setShowingCount={setShowingCount}
                resultsCount={resultsCount}
                setResultsCount={setResultsCount}
                hideModal={() => setShowDeleteModal(false)}/>
            )
          }

          {/* Activities Modal */}
          {
              viewActivity && (
                <ActivitiesModal
                  activitiesData={activitiesData}
                  hideModal={() => setViewActivity(false)}/>
              )
            }

      </div>
    </div>
  </>
  )
}
export default Page
