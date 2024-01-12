'use client'

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  value: false
}

export const recountSlice = createSlice({
  name: 'count',
  initialState,
  reducers: {
    recount: (state) => {
      state.value = !state.value
    }
  }
})

export const { recount } = recountSlice.actions

export default recountSlice.reducer
