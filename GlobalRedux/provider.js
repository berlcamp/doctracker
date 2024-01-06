'use client'

import { Provider } from 'react-redux'
import { store } from './store'

export function Providers ({ children }) {
  return (
    // eslint-disable-next-line react/react-in-jsx-scope
    <Provider store={store}>
        {children}
    </Provider>
  )
}
