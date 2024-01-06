/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useEffect, useRef } from 'react'

interface ModalProps {
  onCancel: () => void
  onConfirm: () => void
  message: string
  header: string
  btnText: string
}

export default function ConfirmModal ({ onConfirm, header, btnText, message, onCancel }: ModalProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCancel()
    }
    if (event.key === 'Enter') {
      onConfirm()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [wrapperRef])

  return (

      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                {header}
              </h5>
            </div>
            <div className="modal-body relative p-4">
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 text-sm mb-1 dark:text-gray-300'>{message}</div>
                </div>
              </div>

              <div className="app__modal_footer">
                    <button
                      onClick={onConfirm}
                      type="button"
                      className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >
                      {btnText}
                    </button>
                    <button
                      onClick={onCancel}
                      type="button"
                      className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                    >
                      Cancel
                    </button>
              </div>
            </div>
          </div>
        </div>
      </div>

  )
}
