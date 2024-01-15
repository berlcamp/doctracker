'use client'

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  value: null
}

export const remarksSlice = createSlice({
  name: 'remarksList',
  initialState,
  reducers: {
    updateRemarksList: (state, action) => {
      state.value = action.payload
    }
  }
})

export const { updateRemarksList } = remarksSlice.actions

export default remarksSlice.reducer
