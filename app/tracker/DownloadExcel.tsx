'use client'
import React from 'react'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import type { DocumentTypes } from '@/types'
import { ArrowDownTrayIcon } from '@heroicons/react/20/solid'

const DownloadExcelButton = ({ documents }: { documents: DocumentTypes[] | [] }) => {
  //
  const handleDownload = async () => {
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

    const results: DocumentTypes[] | [] = documents

    // Data for the Excel file
    const data: any[] = []
    results?.forEach((item: DocumentTypes, index) => {
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
      saveAs(blob, 'Document Tracker Data.xlsx')
    })
  }

  return (
    <button
      className='flex items-center justify-end space-x-2 font-bold px-2 py-1 text-xs text-gray-500 rounded-sm'
      onClick={handleDownload}><span>Export to Excel</span> <ArrowDownTrayIcon className='h-5 w-5'/></button>
  )
}

export default DownloadExcelButton
