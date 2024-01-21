import { jsPDF } from 'jspdf'
// import 'jspdf-autotable'

export async function Pdf (item) {
  // Default export is a4 paper, portrait, using millimeters for units
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()

  // Header Logo
  const dumingaglogo = `${process.env.NEXT_PUBLIC_BASE_URL}/images/dumingag.png`
  const zdslogo = `${process.env.NEXT_PUBLIC_BASE_URL}/images/zds.png`
  doc.addImage(dumingaglogo, 'PNG', 60, 5, 18, 18)
  doc.addImage(zdslogo, 'PNG', 132, 5, 18, 18)

  // Header Text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('REPUBLIC OF THE PHILIPPINES', 105, 9, 'center')
  doc.setFontSize(8)
  doc.text('PROVINCE OF ZAMBOANGA DEL SUR', 105, 13, 'center')
  doc.setFontSize(8)
  doc.setTextColor('#0000FF')
  doc.text('MUNICIPALITY OF DUMINGAG', 105, 17, 'center')
  doc.setFontSize(8)
  doc.setTextColor('#000')
  doc.text('OFFICE OF THE MUNICIPAL MAYOR', 105, 21, 'center')
  doc.setTextColor('#000')
  doc.setTextColor('#FF0000')
  doc.setFontSize(7)
  doc.text('==============================================================', 105, 32, 'center')

  // Information
  doc.setFontSize(9)
  doc.setTextColor('#000')
  doc.setFont('helvetica', 'normal')
  let y = 37
  doc.text('Routing No:', 61, y, 'left')
  doc.setFont('helvetica', 'bold')
  doc.text(`${item.routing_slip_no}`, 79, y, 'left')
  doc.setFont('helvetica', 'normal')
  doc.text('Date:', 122, y, 'left')
  doc.setFont('helvetica', 'bold')
  doc.text(`${item.date_created}`, 131, y, 'left')
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Particulars:', 61, y, 'left')

  // Begin Particualrs
  doc.setFont('helvetica', 'bold')
  const text = item.particulars
  const maxWidth = 80
  const lines = doc.splitTextToSize(text, maxWidth)
  // loop through the lines and add them to the document
  for (let i = 0; i < lines.length; i++) {
    if (i === 3) {
      doc.text(79, y, lines[i] + '...')
      y += 5
      break
    } else {
      doc.text(79, y, lines[i])
      y += 5
    }
  }
  // End Particualrs

  // Amount if applicable
  if (item.amount !== '') {
    doc.setFont('helvetica', 'normal')
    doc.text('Amount:', 61, y, 'left')
    doc.setFont('helvetica', 'bold')
    doc.text(`${Number(item.amount).toLocaleString()}`, 75, y, 'left')
    y += 5
  }

  doc.setLineWidth(0.5)
  y += 2
  doc.line(61, y, 150, y) // Horizonal line

  let tempY = y
  // Status
  doc.setFont('helvetica', 'normal')
  y += 6
  doc.text('Approved', 66, y, 'left')
  doc.text('Disapproved', 118, y, 'left')
  y += 6
  doc.text('For File', 66, y, 'left')
  doc.text('Confidential', 118, y, 'left')
  y += 6
  doc.text('For Further Instruction', 66, y, 'left')
  doc.text('Others: _________', 118, y, 'left')
  y += 3
  doc.line(61, y, 150, y) // Horizonal line // Y = 83

  tempY += 3
  doc.rect(61, tempY, 3, 3, 'S')
  doc.rect(113, tempY, 3, 3, 'S')
  tempY += 6
  doc.rect(61, tempY, 3, 3, 'S')
  doc.rect(113, tempY, 3, 3, 'S')
  tempY += 6
  doc.rect(61, tempY, 3, 3, 'S')
  doc.rect(113, tempY, 3, 3, 'S')

  // Remarks
  y += 2
  doc.line(131, y, 131, y + 31) // Vertical line
  y += 2
  doc.text('Remarks:', 61, y, 'left')
  doc.text('Signature:', 133, y, 'left')
  doc.setLineWidth(0.3)
  doc.setLineWidth(0.5)
  y += 31
  doc.line(61, y, 150, y) // Horizonal line

  // Tracker
  y += 5
  doc.text('Tracker', 61, y, 'left')

  // Set the table width and height
  const tableWidth = 22 // Width of each column
  const tableHeight = 6 // Height of each row

  // Set the table border properties
  const borderWidth = 0.3 // Width of the border
  const horizontalPadding = 4 // Padding on the left and right of each cell
  const verticalPadding = 3 // Padding on the top and bottom of each cell

  // Calculate the x and y positions for the table
  const tableX = 61 // X position of the table
  y += 2
  const tableY = y // Y position of the table

  // Draw the border for the table
  doc.setLineWidth(borderWidth)
  doc.rect(tableX, tableY, tableWidth * 4, tableHeight * 4)

  // Loop through each row and column to create the table
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) {
      // Calculate the x and y positions for the current cell
      let x = tableX + (j * tableWidth)
      let y = tableY + (i * tableHeight)

      // Draw the border for the cell
      doc.setLineWidth(borderWidth)
      doc.rect(x, y, tableWidth, tableHeight)

      // Add horizontal padding to the left and right of the cell
      x += horizontalPadding
      const cellWidth = tableWidth - (horizontalPadding * 2)

      // Add vertical padding to the top and bottom of the cell
      y += verticalPadding
      const cellHeight = tableHeight - (verticalPadding * 2)

      // Add an empty cell to the table
      let headerText = ''
      if (i === 0 && j === 0) headerText = 'OFFICE'
      if (i === 0 && j === 1) headerText = 'DATE'
      if (i === 0 && j === 2) headerText = 'TIME'
      if (i === 0 && j === 3) headerText = 'SIGN'

      // if (i === 1 && j === 0) headerText = 'OCM'
      // if (i === 1 && j === 1) headerText = item.date
      // if (i === 1 && j === 2) headerText = item.time

      doc.text(headerText, x, y, { align: 'left', baseline: 'middle', width: cellWidth, height: cellHeight })
    }
  }

  doc.save('RoutingSlip.pdf')
}
