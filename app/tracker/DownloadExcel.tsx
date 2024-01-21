'use client'
import React from 'react'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import type { DocumentTypes } from '@/types'
import { ImFileExcel } from 'react-icons/im'

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
      { header: 'Type', key: 'type', width: 20 },
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
        type: item.type,
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
      className='flex items-center justify-end space-x-1 font-bold py-1 text-xs text-gray-500 rounded-sm'
      onClick={handleDownload}><span>Excel</span> <ImFileExcel className='h-4 w-4'/></button>
  )
}

export default DownloadExcelButton
