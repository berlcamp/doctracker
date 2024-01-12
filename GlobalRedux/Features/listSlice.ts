'use client'

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  value: null
}

export const listSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    updateList: (state, action) => {
      state.value = action.payload
    }
  }
})

export const { updateList } = listSlice.actions

export default listSlice.reducer
