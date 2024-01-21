'use client'
import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type { DocumentTypes } from '@/types'
import { AiOutlineFilePdf } from 'react-icons/ai'

const DownloadPdf = ({ documents }: { documents: DocumentTypes[] | [] }) => {
  const [downloading, setDownloading] = useState(false)

  // Generate payroll summary PDF
  const handleDownload = () => {
    if (downloading) return

    setDownloading(true)

    // Create a new jsPDF instance
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'legal'
    })

    const pageWidth = doc.internal.pageSize.getWidth()

    // Header Logo
    const dumingaglogo = `${process.env.NEXT_PUBLIC_BASE_URL}/images/dumingag.png`
    const zdslogo = `${process.env.NEXT_PUBLIC_BASE_URL}/images/zds.png`
    doc.addImage(dumingaglogo, 'PNG', 20, 7, 25, 25)
    doc.addImage(zdslogo, 'PNG', 310, 7, 25, 25)

    // Add a header to the PDF
    const fontSize = 12
    doc.setFontSize(fontSize)
    const titleText = 'Republic of the Philippines'
    const titleText2 = 'Province of Zamboanga del Sur'
    const titleText3 = 'Municipality of Dumingag'
    const titleText4 = 'Document Tracker'
    const titleWidth = doc.getStringUnitWidth(titleText) * fontSize / doc.internal.scaleFactor
    const titleWidth2 = doc.getStringUnitWidth(titleText2) * fontSize / doc.internal.scaleFactor
    const titleWidth3 = doc.getStringUnitWidth(titleText3) * fontSize / doc.internal.scaleFactor
    const titleWidth4 = doc.getStringUnitWidth(titleText4) * 16 / doc.internal.scaleFactor // font size 16

    let currentY = 10

    doc.text(titleText, (pageWidth - titleWidth) / 2, currentY)
    currentY += 6
    doc.text(titleText2, (pageWidth - titleWidth2) / 2, currentY)
    currentY += 6
    doc.setFontSize(14)
    doc.text(titleText3, (pageWidth - titleWidth3) / 2, currentY)
    currentY += 10
    doc.setFontSize(16)
    doc.text(titleText4, (pageWidth - titleWidth4) / 2, currentY)
    currentY += 10

    const data = documents.map((document, index) => {
      return {
        no: index + 1,
        routing_slip_no: document.routing_slip_no,
        type: document.type,
        particulars: document.particulars,
        signature: ''
      }
    })

    // Define the table columns
    const columns = [
      { header: 'No', dataKey: 'no' },
      { header: 'Routing Slip No', dataKey: 'routing_slip_no' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Particulars', dataKey: 'particulars' },
      { header: 'Receiver Name / Signature / Receive Date', dataKey: 'signature' }
    ]

    const options = {
      margin: { top: 20 },
      startY: currentY,
      theme: 'grid',
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }
      }
    }

    // Create a new table object
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    doc.autoTable(columns, data, options)

    // Save the PDF with a unique name
    doc.save('Receiving.pdf')

    setDownloading(false)
  }

  return (
    <button
      className='flex items-center justify-end space-x-1 font-bold py-1 text-xs text-gray-500 rounded-sm'
      onClick={handleDownload}><span>PDF</span> <AiOutlineFilePdf className='h-5 w-5'/></button>
  )
}

export default DownloadPdf
