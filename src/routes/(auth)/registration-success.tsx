import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Circle, CircleDot, XCircle } from 'lucide-react'
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

interface ModuleProgress {
  id: string
  name: string
  total: number
  applied: number
  pending: number
  done: boolean
}

interface MigrationProgress {
  total: number
  applied: number
  remaining: number
  percent: number
  done: boolean
  modules: ModuleProgress[]
  nextModule: { id: string; name: string; pending: number } | null
}

interface RegistrationResult {
  token: string
  user: { subdomain: string; name?: string; [key: string]: unknown }
  company: { name?: string; [key: string]: unknown }
}

interface MigrationRunResult {
  module: { id: string; name: string } | null
  applied: number
  failures: { name: string; error: string }[]
  progress: MigrationProgress
}

function RegistrationSuccessPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  // StrictMode-safe: the ref prevents a double POST; there is deliberately NO
  // `cancelled` flag — completing registration and redirecting must not be
  // aborted by the effect cleanup React runs during its dev double-mount
  // (that cancellation is what used to freeze this page on the spinner).
  const isProcessed = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegistrationResult | null>(null)
  const [progress, setProgress] = useState<MigrationProgress | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [runResult, setRunResult] = useState<MigrationRunResult | null>(null)

  function finishAndRedirect(res: RegistrationResult) {
    const subdomain = res.user.subdomain
    const baseDomain = getBaseDomain()
    const port = window.location.port ? `:${window.location.port}` : ''
    const targetHost = `${subdomain}.${baseDomain}`
    const currentHost = window.location.hostname

    clearOldCredentials()

    // Same host → set auth in-place and navigate; otherwise cross-subdomain redirect
    if (currentHost === targetHost || currentHost === `${targetHost}:${window.location.port}`) {
      setAuth(res.user, res.token, res.company)
      navigate({ to: '/dashboard', replace: true })
    } else {
      const callbackUrl = `${window.location.protocol}//${targetHost}${port}/auth-callback?token=${encodeURIComponent(res.token)}&user=${encodeURIComponent(JSON.stringify(res.user))}&company=${encodeURIComponent(JSON.stringify(res.company))}`
      window.location.href = callbackUrl
    }
  }

  useEffect(() => {
    if (isProcessed.current) return
    isProcessed.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setError('Missing registration token.')
      return
    }

    ;(async () => {
      try {
        const res = await api.post('/auth/complete-registration', { token })
        const data: RegistrationResult | undefined = res.data?.data
        if (!data?.token || !data?.user) {
          setError('Registration could not be completed.')
          return
        }
        setResult(data)

        const prog = await api.get(`/auth/registration-progress/${data.user.subdomain}`)
        if (prog.data?.data) setProgress(prog.data.data)
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Registration could not be completed.'
        setError(message)
        toast.error(message)
      }
    })()
  }, [navigate, setAuth])

  async function migrateNextModule() {
    if (!result || migrating) return
    setMigrating(true)
    setRunResult(null)
    try {
      const res = await api.post(`/auth/registration-migrate/${result.user.subdomain}`)
      const data: MigrationRunResult | undefined = res.data?.data
      if (data) {
        setRunResult(data)
        if (data.progress) setProgress(data.progress)
      }
    } catch (err: any) {
      setRunResult({
        module: null,
        applied: 0,
        failures: [{ name: 'request', error: err?.response?.data?.message || err?.message || 'Request failed' }],
        progress: progress as MigrationProgress,
      })
    } finally {
      setMigrating(false)
    }
  }

  const allDone = progress?.done ?? false

  // Auto-redirect a few seconds after everything is set up (button still wins).
  useEffect(() => {
    if (!allDone || !result) return
    const t = setTimeout(() => finishAndRedirect(result), 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, result])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50'>
      <div className='w-full max-w-xl px-6 py-10'>
        {error ? (
          <div className='text-center'>
            <AlertCircle className='h-10 w-10 text-red-500 mx-auto' />
            <h2 className='mt-4 text-lg font-semibold'>Registration incomplete</h2>
            <p className='mt-2 text-sm text-muted-foreground'>{error}</p>
            <Button asChild className='mt-6'>
              <Link to='/register'>Back to registration</Link>
            </Button>
          </div>
        ) : !result || !progress ? (
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-purple-600 mx-auto' />
            <p className='mt-4 text-muted-foreground'>Completing your registration…</p>
          </div>
        ) : (
          <div>
            <div className='text-center mb-6'>
              {allDone ? (
                <CheckCircle2 className='h-10 w-10 text-green-600 mx-auto' />
              ) : (
                <CircleDot className='h-10 w-10 text-purple-600 mx-auto' />
              )}
              <h2 className='mt-3 text-lg font-semibold'>
                {allDone ? 'Setup complete!' : 'Set up your workspace'}
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                {allDone
                  ? 'All modules are ready — redirecting you to your dashboard…'
                  : 'Migrate each module one by one. Click Next to apply the next module\'s migrations.'}
              </p>
            </div>

            {/* Overall progress */}
            <div className='mb-5'>
              <Progress value={progress.percent} />
              <div className='mt-2 flex justify-between text-xs text-muted-foreground'>
                <span>{progress.applied} of {progress.total} migrations applied</span>
                <span>{progress.remaining} remaining</span>
              </div>
            </div>

            {/* Module table */}
            <div className='rounded-lg border bg-card overflow-hidden'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='px-4 py-2 text-left font-medium'>Module</th>
                    <th className='px-4 py-2 text-right font-medium'>Migrations</th>
                    <th className='px-4 py-2 text-center font-medium w-24'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.modules.map((m) => {
                    const isNext = progress.nextModule?.id === m.id
                    const isRunning = migrating && isNext
                    return (
                      <tr key={m.id} className={`border-b last:border-b-0 ${isNext && !m.done ? 'bg-purple-50/60' : ''}`}>
                        <td className='px-4 py-2.5 font-medium'>{m.name}</td>
                        <td className='px-4 py-2.5 text-right text-muted-foreground tabular-nums'>
                          {m.applied} / {m.total}
                        </td>
                        <td className='px-4 py-2.5 text-center'>
                          {isRunning ? (
                            <Loader2 className='h-4 w-4 animate-spin text-purple-600 mx-auto' />
                          ) : m.done ? (
                            <CheckCircle2 className='h-4 w-4 text-green-600 mx-auto' />
                          ) : isNext ? (
                            <CircleDot className='h-4 w-4 text-purple-600 mx-auto' />
                          ) : (
                            <Circle className='h-4 w-4 text-muted-foreground/40 mx-auto' />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Failed migrations from the last run */}
            {runResult?.failures?.length ? (
              <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm'>
                <div className='flex items-center gap-2 font-medium text-red-700'>
                  <XCircle className='h-4 w-4' />
                  {runResult.module ? `"${runResult.module.name}" stopped after a failed migration:` : 'Migration request failed:'}
                </div>
                <ul className='mt-2 space-y-1 text-red-600'>
                  {runResult.failures.map((f) => (
                    <li key={f.name} className='font-mono text-xs break-all'>
                      {f.name} — {f.error}
                    </li>
                  ))}
                </ul>
                <p className='mt-2 text-xs text-red-600/80'>
                  Click Next again to retry this module.
                </p>
              </div>
            ) : null}

            {/* Actions */}
            <div className='mt-6 flex justify-center gap-3'>
              {allDone ? (
                <Button onClick={() => finishAndRedirect(result)}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button onClick={migrateNextModule} disabled={migrating}>
                  {migrating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Migrating {progress.nextModule?.name ?? ''}…
                    </>
                  ) : (
                    <>Next: migrate “{progress.nextModule?.name ?? '…'}” ({progress.nextModule?.pending ?? 0})</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
