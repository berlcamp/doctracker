'use client'

import { fetchDocuments, fetchActivities } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon, PrinterIcon, StarIcon, CalendarDaysIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, DeleteModal, TableRowLoading, CustomButton, ShowMore, TrackerSideBar, Title, Unauthorized, UserBlock } from '@/components'
import AddDocumentModal from './AddDocumentModal'
import DetailsModal from '@/components/Tracker/DetailsModal'
import ActivitiesModal from './ActivitiesModal'
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
import StickiesModal from './StickiesModal'
import { Tooltip } from 'react-tooltip'
import { useSearchParams } from 'next/navigation'
import DownloadPdf from './DownloadPdf'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStickiesModal, setShowStickiesModal] = useState(false)
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
    endDate.setDate(today2.getDate() + 60)

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
            <StarIcon onClick={() => setShowStickiesModal(true)} className='cursor-pointer w-7 h-7 text-yellow-500' data-tooltip-id="stickies-tooltip" data-tooltip-content="Stickies"/>
            <Tooltip id="stickies-tooltip" place='bottom-end'/>
            <CalendarDaysIcon onClick={handleViewActivities} className='cursor-pointer w-7 h-7' data-tooltip-id="calendar-tooltip" data-tooltip-content="Upcoming Activities"/>
            <Tooltip id="calendar-tooltip" place='bottom-end'/>
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
            !isDataEmpty &&
              <div className='flex justify-end space-x-4 mb-2'>
                <DownloadExcelButton documents={list}/>
                <DownloadPdf documents={list}/>
              </div>
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
                        <th className="app__th pl-4"></th>
                        <th className="app__th w-16">
                        </th>
                        <th className="app__th">
                          Routing
                        </th>
                        <th className="app__th">
                          Details
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Origin
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Current&nbsp;Location
                        </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: DocumentTypes, index: number) => (
                    <tr key={index} className='app__tr'>
                      <td className='w-6 pl-4 app__td'>
                        <Menu as="div" className="app__menu_container font-normal text-gray-600">
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
                                      <span>Print Slip</span>
                                  </div>
                                </Menu.Item>
                                {
                                  session.user.id.toString() === item.user_id.toString() &&
                                    <Menu.Item>
                                      <div
                                          onClick={ () => handleDelete(item.id) }
                                          className='flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs'
                                        >
                                          <TrashIcon className='w-4 h-4'/>
                                          <span>Delete</span>
                                      </div>
                                    </Menu.Item>
                                }
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <td className='pl-4 app__td'>
                        <div>
                          <button
                            onClick={() => handleShowDetailsModal(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                            >Tracker</button>
                        </div>
                      </td>
                      <td className='app__td'>
                        <div className='font-medium'>{item.routing_slip_no}</div>
                        <div className='font-medium' style={{ color: `${getStatusColor(item.current_status)}` }}>{item.current_status} {item.current_status === 'Forwarded' ? 'to' : 'at'} {item.current_department.name}</div>
                      </td>
                      <td className='app__td'>
                        {
                          (item.agency && item.agency.trim() !== '') &&
                            <div><span className='font-light'>Requesting Department:</span> <span className='font-medium'>{item.agency}</span></div>
                        }
                        {
                          (item.purchase_request_number && item.purchase_request_number.trim() !== '') &&
                            <div><span className='font-light'>PO No:</span> <span className='font-medium'>{item.purchase_request_number}</span></div>
                        }
                        {
                          (item.supplier_name && item.supplier_name.trim() !== '') &&
                            <div><span className='font-light'>Supplier:</span> <span className='font-medium'>{item.supplier_name}</span></div>
                        }
                        {
                          (item.date_delivered && item.date_delivered.trim() !== '') &&
                            <div><span className='font-light'>Date Delivered:</span> <span className='font-medium'>{item.date_delivered}</span></div>
                        }
                        <div><span className='font-light'>Particulars:</span> <span className='font-medium'>{item.particulars}</span></div>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                          <div>{item.dum_departments.name}</div>
                          <div className='font-normal text-gray-500 text-[10px]'>{format(new Date(item.created_at), 'dd MMM yyyy h:mm a')}</div>
                          <UserBlock user={item.dum_users}/>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                        {
                          item.current_status === 'Received' && (
                            <>
                              <div className='font-medium'>{item.current_department.name}</div>
                              {
                                item.date_received && <div className='font-normal text-gray-500 text-[10px]'>{format(new Date(item.date_received), 'dd MMM yyyy h:mm a')}</div>
                              }
                              {
                                item.received_by_user && <UserBlock user={item.received_by_user}/>
                              }
                            </>
                          )
                        }
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={6} rows={2}/> }
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

          {/* Add Document Modal */}
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
          {/* Stickies Modal */}
          {
            showStickiesModal && (
              <StickiesModal
                hideModal={() => setShowStickiesModal(false)}/>
            )
          }
      </div>
    </div>
  </>
  )
}
export default Page
