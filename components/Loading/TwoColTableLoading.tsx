import React from 'react'

export default function TwoColTableLoading () {
  return (
    <div className="animate-pulse mx-4 my-4">
      <div className="grid grid-cols-1 gap-4 my-4">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 my-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
      </div>
    </div>
  )
}
