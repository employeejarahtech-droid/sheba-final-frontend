import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getBaseDomain } from '@/lib/subdomain'
import { removeCookie, removeUserCookie } from '@/lib/cookies'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'

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

function RegistrationSuccessPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const isProcessed = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isProcessed.current) return
    isProcessed.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setError('Missing registration token.')
      return
    }

    (async () => {
      try {
        const res = await api.post('/auth/complete-registration', { token })
        const result = res.data?.data
        if (!result?.token || !result?.user) {
          setError('Registration could not be completed.')
          return
        }

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
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Registration could not be completed.'
        setError(message)
        toast.error(message)
      }
    })()
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
