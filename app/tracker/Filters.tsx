import React, { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon, TagIcon, UsersIcon } from '@heroicons/react/20/solid'
import { CustomButton, FilterDateRange } from '@/components'
import { documentTypes, statusList } from '@/constants/TrackerConstants'
import DownloadExcelButton from './DownloadExcel'

interface PropTypes {
  setFilterKeyword: (keyword: string) => void
  setFilterAgency: (agency: string) => void
  setFilterTypes: (type: any[]) => void
  setFilterDateFrom: (date: string) => void
  setFilterDateTo: (date: string) => void
  setFilterStatus: (date: string) => void
}

const Filters = ({ setFilterKeyword, setFilterAgency, setFilterTypes, setFilterStatus, setFilterDateFrom, setFilterDateTo }: PropTypes) => {
  const [selectedTypes, setSelectedTypes] = useState<any[] | []>([])
  const [status, setStatus] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [agency, setAgency] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const handleApply = () => {
    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterAgency(agency)
    setFilterTypes(selectedTypes)
    setFilterStatus(status)
    setFilterDateFrom(dateFrom)
    setFilterDateTo(dateTo)
  }

  const handleEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      // pass filter values to parent
      setFilterKeyword(keyword)
      setFilterAgency(agency)
      setFilterTypes(selectedTypes)
      setFilterStatus(status)
      setFilterDateFrom(dateFrom)
      setFilterDateTo(dateTo)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (keyword.trim() === '' && agency.trim() === '') return

    // pass filter values to parent
    setFilterKeyword(keyword)
    setFilterAgency(agency)
  }

  // clear all filters
  const handleClear = () => {
    setFilterKeyword('')
    setKeyword('')
    setFilterTypes([])
    setSelectedTypes([])
    setFilterStatus('')
    setStatus('')
    setFilterAgency('')
    setAgency('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className=''>
      <div className='items-center space-y-2 space-x-1'>
        <form onSubmit={handleSubmit} className='inline-flex items-center'>
          <div className='app__filter_container'>
            <MagnifyingGlassIcon className="w-4 h-4 mr-1"/>
            <input
              placeholder='Search keyword, router no, amount, etc...'
              value={keyword}
              type="text"
              onChange={(e) => setKeyword(e.target.value)}
              className="app__filter_input"/>
          </div>
        </form>
        <div className="inline-flex">
          <div className='app__filter_container'>
            <UsersIcon className="w-4 h-4 text-gray-500 mr-1"/>
            <input
              placeholder='Agency'
              value={agency}
              type="text"
              onKeyPress={handleEnter}
              onChange={(e) => setAgency(e.target.value)}
              className="app__filter_input"/>
          </div>
        </div>
        <FilterDateRange
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo} />
        <div className="inline-flex">
          <Listbox value={selectedTypes} onChange={setSelectedTypes} multiple>
            <div className="relative w-48">
              <Listbox.Button className="app__listbox_btn">
                <span><TagIcon className="w-4 h-4"/></span>
                <span className="block truncate text-xs">
                  Type: {selectedTypes.map(type => type).join(', ')}
                </span>
                <span className="app__listbox_icon">
                  <ChevronDownIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="app__listbox_options">
                  {documentTypes.map((item, itemIdx) => (
                    <Listbox.Option
                      key={itemIdx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                        }`
                      }
                      value={item.type}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate text-xs ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {item.type}
                          </span>
                          {
                            selected
                              ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                )
                              : null
                          }
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
        <div className="inline-flex">
          <Listbox value={status} onChange={setStatus}>
            <div className="relative w-56">
              <Listbox.Button className="app__listbox_btn">
                <span><TagIcon className="w-4 h-4"/></span>
                <span className="block truncate text-xs">
                  Status: {status}
                </span>
                <span className="app__listbox_icon">
                  <ChevronDownIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="app__listbox_options">
                  {statusList.map((item, itemIdx) => (
                    <Listbox.Option
                      key={itemIdx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                        }`
                      }
                      value={item.status}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate text-xs ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {item.status}
                          </span>
                          {
                            selected
                              ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                )
                              : null
                          }
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>
      <div className='flex items-center space-x-2 mt-4'>
        <CustomButton
              containerStyles='app__btn_green'
              title='Apply Filter'
              btnType='button'
              handleClick={handleApply}
            />
        <CustomButton
            containerStyles='app__btn_gray'
            title='Clear Filter'
            btnType='button'
            handleClick={handleClear}
          />
        <DownloadExcelButton
          filterKeyword={keyword}
          filterAgency={agency}
          filterDateFrom={dateFrom}
          filterDateTo={dateTo}
          filterTypes={selectedTypes}
          filterStatus={status}
        />
      </div>
    </div>
  )
}

export default Filters
