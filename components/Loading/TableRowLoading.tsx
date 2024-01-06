'use client'
import React from 'react'
import uuid from 'react-uuid'

export default function TableRowLoading ({ cols, rows }: { cols: number, rows: number }) {
  const tr: any = []
  const th: any = []
  for (let i = 0; i < rows; i++) {
    tr.push(i)
  }
  for (let i = 0; i < cols; i++) {
    th.push(i)
  }

  return (
    <>
      {
        tr.map(() => (
          <tr key={uuid()} className="animate-pulse bg-gray-50 text-xs dark:bg-gray-800">
            {
              th.map((i: number) => (
                <th key={i} className="py-3 px-2 text-gray-900 dark:text-white">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded col-span-2">&nbsp;</div>
                </th>
              ))
            }
          </tr>
        ))
      }
    </>
  )
}
