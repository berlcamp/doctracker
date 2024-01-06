'use client'

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  value: {
    showing: 0,
    results: 0
  }
}

export const resultsCounterSlice = createSlice({
  name: 'resultCounter',
  initialState,
  reducers: {
    updateResultCounter: (state, action) => {
      state.value = action.payload
    }
  }
})

export const { updateResultCounter } = resultsCounterSlice.actions

export default resultsCounterSlice.reducer
