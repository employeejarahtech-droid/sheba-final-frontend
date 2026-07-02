import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Provider } from 'react-redux'
import { getCookie, setCookie } from '@/lib/cookies'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { store } from './store/store'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'
import 'datatables.net-dt/css/dataTables.dataTables.min.css'

// ── Admin "Login as tenant" hand-off ────────────────────────────────────
// When a super-admin impersonates a company from the admin console, the tenant
// app is opened at <subdomain>.<basedomain>/?loginAsToken=<jwt>. Consume it
// once on boot: set the tenant accessToken cookie, then strip the param from
// the URL so the token isn't left in history/shared links.
;(function consumeLoginAsToken() {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('loginAsToken')
    if (token) {
      setCookie('accessToken', token)
      params.delete('loginAsToken')
      const qs = params.toString()
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
      )
    }
  } catch {
    // never block app boot
  }
})()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
      gcTime: 5 * 60 * 1000, // 5 minutes - reduce memory usage
      refetchOnMount: false, // Prevent unnecessary refetches
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          // Only redirect to login if the user truly has no valid token.
          // If a token exists, the 401 might be from a specific endpoint
          // (e.g. missing permissions) — don't force-logout the entire session.
          const hasToken = !!getCookie('accessToken')
          if (!hasToken) {
            toast.error('Session expired!')
            const redirect = `${router.history.location.href}`
            router.navigate({ to: '/login', search: { redirect } })
          }
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          // Only navigate to error page in production to avoid disrupting HMR in development
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' })
          }
        }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FontProvider>
              <DirectionProvider>
                <RouterProvider router={router} />
              </DirectionProvider>
            </FontProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </StrictMode>
  )
}
