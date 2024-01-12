'use client'

import { configureStore } from '@reduxjs/toolkit'
import listReducer from './Features/listSlice'
import resultsReducer from './Features/resultsCounterSlice'
import recountReducer from './Features/recountSlice'

export const store = configureStore({
  reducer: {
    list: listReducer,
    results: resultsReducer,
    recount: recountReducer
  }
})
