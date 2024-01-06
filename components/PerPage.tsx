import React from 'react'

interface PropTypes {
  perPageCount: number
  setPerPageCount: (keyword: number) => void
  showingCount: number
  resultsCount: number
}

const PerPage = ({ perPageCount, showingCount, resultsCount, setPerPageCount }: PropTypes) => {
  return (
    <div className='flex items-center py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500'>
      <div className='flex-1 text-xs'>{`Showing ${showingCount} of ${resultsCount} results`}</div>
      <div className='flex items-center space-x-2 text-xs'>
        <span>Results per page: </span>
        <select
          value={perPageCount}
          onChange={e => setPerPageCount(Number(e.target.value))}
          className='py-1 border border-gray-300 rounded-md'>
          <option value='10'>10</option>
          <option value='20'>20</option>
          <option value='50'>50</option>
          <option value='100'>100</option>
        </select>
      </div>
    </div>
  )
}

export default PerPage
