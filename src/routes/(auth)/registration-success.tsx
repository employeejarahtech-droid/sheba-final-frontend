import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getBaseDomain } from '@/lib/subdomain'
import { removeCookie, removeUserCookie } from '@/lib/cookies'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export const Route = createFileRoute('/(auth)/registration-success')({
  component: RegistrationSuccessPage,
})

function clearOldCredentials() {
  removeCookie('accessToken')
  removeCookie('company')
  removeUserCookie()
  localStorage.removeItem('user')
  localStorage.removeItem('company')
}

interface MigrationProgress {
  total: number
  applied: number
  remaining: number
  percent: number
  done: boolean
}

// Poll the migration-progress endpoint until it reports done or we give up.
const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 30 // ~30s ceiling — proceed regardless once hit

function RegistrationSuccessPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const isProcessed = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<MigrationProgress | null>(null)

  useEffect(() => {
    if (isProcessed.current) return
    isProcessed.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setError('Missing registration token.')
      return
    }

    let cancelled = false

    function finishAndRedirect(result: { token: string; user: any; company: any }) {
      const subdomain = result.user.subdomain
      const baseDomain = getBaseDomain()
      const port = window.location.port ? `:${window.location.port}` : ''
      const targetHost = `${subdomain}.${baseDomain}`
      const currentHost = window.location.hostname

      clearOldCredentials()

      // Same host → set auth in-place and navigate; otherwise cross-subdomain redirect
      if (currentHost === targetHost || currentHost === `${targetHost}:${window.location.port}`) {
        setAuth(result.user, result.token, result.company)
        navigate({ to: '/dashboard', replace: true })
      } else {
        const callbackUrl = `${window.location.protocol}//${targetHost}${port}/auth-callback?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}&company=${encodeURIComponent(JSON.stringify(result.company))}`
        window.location.href = callbackUrl
      }
    }

    // Poll /auth/registration-progress/:subdomain so the user can see how many
    // modules have been set up while background migrations finish, instead of
    // navigating straight to a dashboard with tables that don't exist yet.
    async function pollMigrationProgress(subdomain: string) {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return
        try {
          const res = await api.get(`/auth/registration-progress/${subdomain}`)
          const data: MigrationProgress = res.data?.data
          if (data) {
            setProgress(data)
            if (data.done) return
          }
        } catch (_) {
          // Progress is best-effort — ignore transient failures and keep polling
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      }
    }

    (async () => {
      try {
        const res = await api.post('/auth/complete-registration', { token })
        const result = res.data?.data
        if (!result?.token || !result?.user) {
          setError('Registration could not be completed.')
          return
        }

        await pollMigrationProgress(result.user.subdomain)
        if (cancelled) return
        finishAndRedirect(result)
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Registration could not be completed.'
        setError(message)
        toast.error(message)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate, setAuth])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50'>
      <div className='text-center max-w-sm px-6'>
        {error ? (
          <>
            <AlertCircle className='h-10 w-10 text-red-500 mx-auto' />
            <h2 className='mt-4 text-lg font-semibold'>Registration incomplete</h2>
            <p className='mt-2 text-sm text-muted-foreground'>{error}</p>
            <Button asChild className='mt-6'>
              <Link to='/register'>Back to registration</Link>
            </Button>
          </>
        ) : progress ? (
          <>
            {progress.done ? (
              <CheckCircle2 className='h-8 w-8 text-green-600 mx-auto' />
            ) : (
              <Loader2 className='h-8 w-8 animate-spin text-purple-600 mx-auto' />
            )}
            <p className='mt-4 text-muted-foreground'>
              {progress.done ? 'Setup complete — redirecting…' : 'Setting up your modules…'}
            </p>
            <Progress value={progress.percent} className='mt-4' />
            <div className='mt-2 flex justify-between text-xs text-muted-foreground'>
              <span>{progress.applied} of {progress.total} modules set</span>
              <span>{progress.remaining} remaining</span>
            </div>
          </>
        ) : (
          <>
            <Loader2 className='h-8 w-8 animate-spin text-purple-600 mx-auto' />
            <p className='mt-4 text-muted-foreground'>Completing your registration…</p>
          </>
        )}
      </div>
    </div>
  )
}
