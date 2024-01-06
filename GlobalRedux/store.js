'use client'

import { configureStore } from '@reduxjs/toolkit'
import listReducer from './Features/listSlice'
import resultsReducer from './Features/resultsCounterSlice'

export const store = configureStore({
  reducer: {
    list: listReducer,
    results: resultsReducer
  }
})
