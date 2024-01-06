import React from 'react'

export default function OneColLayoutLoading () {
  return (
    <div className="animate-pulse mx-4 my-4">
      <div className="grid grid-cols-1 gap-4 my-4">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
      </div>
      <div className="grid grid-cols-1 gap-4 my-4">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
      </div>
      <div className="grid grid-cols-1 gap-4 my-4">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
      </div>
    </div>
  )
}
