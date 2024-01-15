'use client'

import { configureStore } from '@reduxjs/toolkit'
import listReducer from './Features/listSlice'
import remarksReducer from './Features/remarksSlice'
import resultsReducer from './Features/resultsCounterSlice'
import recountReducer from './Features/recountSlice'

export const store = configureStore({
  reducer: {
    list: listReducer,
    remarks: remarksReducer,
    results: resultsReducer,
    recount: recountReducer
  }
})
