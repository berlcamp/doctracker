import React from 'react'

import type { CustomButtonTypes } from '@/types'

function CustomButton ({ isDisabled, btnType, containerStyles, textStyles, title, rightIcon, handleClick }: CustomButtonTypes) {
  return (
    <button
      disabled={isDisabled}
      type={btnType ?? 'button'}
      className={`custom-btn ${containerStyles ?? ''}`}
      onClick={handleClick}
    >
      <span className={`flex-1 ${textStyles ?? ''}`}>{title}</span>
      {rightIcon && rightIcon}
  </button>
  )
}

export default CustomButton
