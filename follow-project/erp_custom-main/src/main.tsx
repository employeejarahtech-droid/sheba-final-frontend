import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { RouterProvider } from 'react-router'

import { ThemeProvider } from './contexts/theme-provider'
import rootRouter from './routes/rootRoutes'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { Toaster } from './components/ui/sonner'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
    <ThemeProvider>
      <Toaster position='top-right' />
      <RouterProvider router={rootRouter}></RouterProvider>
    </ThemeProvider>
    </Provider>
  </StrictMode>,
)
