/**
 * Default Data — settings page
 *
 * Route: /dashboard/settings/default-data
 * Lists the seed/master-data sets from sheba-api/default-sql and imports them
 * into THIS tenant. "Add Default Data" imports each set sequentially so each
 * card shows live status + a progress bar; an overall bar tracks the sweep.
 * Imports are idempotent (INSERT IGNORE), safe to re-run.
 */

import { useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { Database, Loader2, Play, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'

type DefaultDataItem = {
  id: string
  filename: string
  title: string
  size: number
}

type Status = 'idle' | 'running' | 'done' | 'error'
type CardState = { status: Status; error?: string }

export function DefaultData() {
  const [items, setItems] = useState<DefaultDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [states, setStates] = useState<Record<string, CardState>>({})
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const token = getCookie('accessToken')
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/default-data`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (alive && res.ok) {
          const json = await res.json()
          const list: DefaultDataItem[] = json?.data?.items || []
          setItems(list)
          setStates(Object.fromEntries(list.map((i) => [i.id, { status: 'idle' as Status }])))
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const done = items.filter((i) => states[i.id]?.status === 'done').length
  const errored = items.filter((i) => states[i.id]?.status === 'error').length
  const completed = done + errored
  const overallPct = items.length ? Math.round((completed / items.length) * 100) : 0
  const anyStarted = running || completed > 0

  const run = async () => {
    if (!items.length || running) return
    const ok = window.confirm(
      `Add default data?\n\nThis imports ${items.length} master-data sets (machines, tests, departments, beds, etc.) into this tenant. ` +
        'Existing rows are kept (INSERT IGNORE), so it is safe to re-run. Continue?'
    )
    if (!ok) return

    setRunning(true)
    const token = getCookie('accessToken')
    for (const item of items) {
      setStates((s) => ({ ...s, [item.id]: { status: 'running' } }))
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/default-data/import/${encodeURIComponent(item.id)}`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.message || `HTTP ${res.status}`)
        }
        setStates((s) => ({ ...s, [item.id]: { status: 'done' } }))
      } catch (e) {
        setStates((s) => ({ ...s, [item.id]: { status: 'error', error: (e as Error)?.message || 'Failed' } }))
      }
    }
    setRunning(false)
  }

  const reset = () => {
    setStates(Object.fromEntries(items.map((i) => [i.id, { status: 'idle' as Status }])))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Default Data</h1>
          <p className="text-sm text-muted-foreground">
            Import master/seed data (machines, tests, departments, beds, etc.) into this tenant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyStarted && (
            <Button variant="outline" size="sm" onClick={reset} disabled={running || loading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button size="sm" onClick={run} disabled={running || loading || !items.length}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Add Default Data
          </Button>
        </div>
      </div>

      {/* Overall progress */}
      {anyStarted && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>
              {completed}/{items.length}
              {errored > 0 && <span className="text-red-600"> · {errored} failed</span>}
              {!running && completed === items.length && errored === 0 && (
                <span className="text-emerald-600"> · complete</span>
              )}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                errored > 0 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading default data sets…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No default data sets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <DefaultDataCard key={item.id} item={item} state={states[item.id] || { status: 'idle' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function DefaultDataCard({ item, state }: { item: DefaultDataItem; state: CardState }) {
  const { status, error } = state
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground">{item.filename}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Per-card progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        {status === 'running' && (
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
        )}
        {status === 'done' && <div className="h-full w-full rounded-full bg-emerald-500" />}
        {status === 'error' && <div className="h-full w-full rounded-full bg-red-500" />}
      </div>

      {status === 'error' && error && (
        <p className="text-xs text-red-600 break-all">{error}</p>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'running')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" /> Importing
      </span>
    )
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    )
  if (status === 'error')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <AlertCircle className="h-3 w-3" /> Failed
      </span>
    )
  return <span className="text-xs font-medium text-muted-foreground">Pending</span>
}

export default DefaultData
