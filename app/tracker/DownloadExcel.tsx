'use client'
import React from 'react'
import Excel from 'exceljs'
import { useFilter } from '@/context/FilterContext'
import { saveAs } from 'file-saver'
import { createBrowserClient } from '@supabase/ssr'

// types
import type { DocumentType } from '@/types'

interface PropTypes {
  filterKeyword: string
  filterAgency: string
  filterDateFrom: string
  filterDateTo: string
  filterTypes: any[]
  filterStatus: string
}

const DownloadExcelButton = ({ filterKeyword, filterAgency, filterDateFrom, filterDateTo, filterTypes, filterStatus }: PropTypes) => {
  const { filters, setToast } = useFilter()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleDownload = async () => {
    if (filterDateFrom === '' || filterDateTo === '') {
      // pop up the error message
      setToast('error', 'Please select Date Range')
      return
    }
    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')

    // Add data to the worksheet
    worksheet.columns = [
      { header: '#', key: 'no', width: 20 },
      { header: 'Routing No', key: 'routing_no', width: 20 },
      { header: 'Name/Payee', key: 'name', width: 20 },
      { header: 'Amount', key: 'amount', width: 20 },
      { header: 'Agency/Department', key: 'agency', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Particulars', key: 'particulars', width: 20 }
      // Add more columns based on your data structure
    ]

    const results: DocumentType[] | null = await fetchData()

    // Data for the Excel file
    const data: any[] = []
    results?.forEach((item: DocumentType, index) => {
      data.push({
        no: index + 1,
        routing_no: item.routing_slip_no,
        name: item.name,
        amount: item.amount,
        agency: item.agency,
        status: item.status,
        particulars: item.particulars
      })
    })

    data.forEach((item) => {
      worksheet.addRow(item)
    })

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, 'Summary.xlsx')
    })
  }

  const fetchData = async () => {
    // Data for the Excel file
    let query = supabase
      .from('dum_document_trackers')
      .select()
      .eq('is_deleted', false)

    // Full text search
    if (filterKeyword.trim() !== '') {
      query = query.or(`particulars.ilike.%${filterKeyword}%,name.ilike.%${filterKeyword}%,routing_slip_no.ilike.%${filterKeyword}%,amount.ilike.%${filterKeyword}%`)
    }

    // Filter agency
    if (filterAgency.trim() !== '') {
      query = query.or(`agency.ilike.%${filterAgency}%`)
    }

    // Filter Status
    if (filterStatus.trim() !== '') {
      query = query.or(`status.ilike.%${filterStatus}%`)
    }

    // Filter Date
    query = query.gte('date', filterDateFrom)
    query = query.lte('date', filterDateTo)

    // Filter type
    if (typeof filters.types !== 'undefined' && filters.types.length > 0) {
      const statement: string[] = []
      filterTypes.forEach((type: string) => {
        const str = `type.eq.${type}`
        statement.push(str)
      })
      query = query.or(statement.join(', '))
    }

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error } = await query

    if (error) console.error(error)

    return data
  }

  return (
    <button
      className='bg-blue-500 hover:bg-blue-600 border border-blue-600 font-bold px-2 py-1 text-xs text-white rounded-sm'
      onClick={handleDownload}>Download Excel</button>
  )
}

export default DownloadExcelButton
