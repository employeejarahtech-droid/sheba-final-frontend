import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { removeCookie, removeUserCookie } from '@/lib/cookies'

export const Route = createFileRoute('/(auth)/auth-callback')({
  component: AuthCallbackPage,
})

/**
 * Clear any stale credentials from previous sessions before setting new ones.
 * Prevents conflicts when switching between subdomains.
 */
function clearOldCredentials() {
  removeCookie('accessToken')
  removeCookie('company')
  removeUserCookie()

  localStorage.removeItem('user')
  localStorage.removeItem('company')
}

/**
 * Safely parse a JSON parameter from URL search params.
 * Falls back to localStorage if URL parsing fails.
 */
function parseJsonParam(param: string | null, fallbackKey: string) {
  if (param) {
    try {
      return JSON.parse(param)
    } catch {
      console.error(`[AuthCallback] Error parsing ${fallbackKey} from URL`)
    }
  }
  try {
    return JSON.parse(localStorage.getItem(fallbackKey) || '{}')
  } catch {
    return {}
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const isProcessed = useRef(false)

  useEffect(() => {
    // Prevent multiple executions (React StrictMode / re-renders)
    if (isProcessed.current) return
    isProcessed.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      navigate({ to: '/login', replace: true })
      return
    }

    const user = parseJsonParam(params.get('user'), 'user')
    const company = parseJsonParam(params.get('company'), 'company')

    // Clear stale credentials before setting new ones
    clearOldCredentials()

    // Set new credentials
    setAuth(user, token, company)

    // Navigate to dashboard (replace history so back button works correctly)
    navigate({ to: '/dashboard', replace: true })
  }, [navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  )
}
