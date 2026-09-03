/**
 * Database Migration — per-tenant migration status
 *
 * Route: /(platform)/admin/database-migration
 * Lists every company and how far through the migration chain its tenant DB is
 * (latest applied migration, applied/total counts, and the pending list).
 * Read-only view backed by GET /api/admin/migrations/status. To actually APPLY
 * pending migrations, use the "Tenant Database / Migrations" tools on Common
 * Commands (linked at the bottom) — this page only reports status.
 */

import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { Database, RefreshCw, CheckCircle2, AlertCircle, Loader2, ExternalLink, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMigrationStatus, useRunServerCommand } from '@/hooks/usePlatformAdmin'
import { getAdminRoleFromToken } from '@/stores/platform-auth-store'

export const Route = createFileRoute('/(platform)/admin/database-migration')({
  beforeLoad: () => {
    if (getAdminRoleFromToken() !== 'super_admin') {
      throw redirect({ to: '/admin' })
    }
  },
  component: DatabaseMigrationPage,
})

function DatabaseMigrationPage() {
  const { data, isLoading, isFetching, refetch } = useMigrationStatus()
  const runMigrations = useRunServerCommand()
  const [runResult, setRunResult] = useState<string | null>(null)
  const tenants = data?.tenants ?? []
  const totalMigrations = data?.totalMigrations ?? 0
  const upToDate = tenants.filter((t) => !t.error && t.pendingCount === 0).length
  const withPending = tenants.filter((t) => !t.error && t.pendingCount > 0).length
  const errored = tenants.filter((t) => !!t.error).length

  // Runs the all-tenant migration sweep via the existing `migrations-apply`
  // command (scripts/run-all-tenant-migrations.js) — it iterates active tenants
  // one-by-one and applies only their pending migrations, so it migrates
  // exactly the tenants that aren't up to date. Idempotent (safe to re-run).
  // After it finishes we refetch the status so the table reflects the new state.
  const handleMigrate = () => {
    const ok = window.confirm(
      'Run pending migrations across all active tenants?\n\n' +
        'This applies every pending migration to each tenant that is behind, one by one. ' +
        'Migrations are idempotent (safe to re-run). Continue?'
    )
    if (!ok) return
    setRunResult(null)
    runMigrations.mutate(
      { id: 'migrations-apply', confirm: true },
      {
        onSuccess: (res) => {
          if (res.data) {
            setRunResult(res.data.stdout || res.data.stderr || `(exit code ${res.data.code}, no output)`)
          } else if (res.message) {
            setRunResult(res.message)
          }
          if (res.success) toast.success('Migrations applied — refreshing status')
          else toast.error('Migration run finished with errors — see output')
          refetch()
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Database Migration</h1>
              <p className="text-sm text-white/80">
                Per-tenant migration version — {totalMigrations} migrations in the chain
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handleMigrate} disabled={runMigrations.isPending}>
              {runMigrations.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Migrate One by One
            </Button>
            <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Migration run output */}
      {runResult && (
        <div className="rounded-lg border bg-black/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Migration output</span>
            <button
              type="button"
              onClick={() => setRunResult(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap break-all text-green-400 max-h-72 overflow-y-auto">
            {runResult}
          </pre>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Tenants" value={tenants.length} />
        <SummaryCard label="Up to date" value={upToDate} tone="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <SummaryCard label="With pending" value={withPending} tone="amber" icon={<AlertCircle className="h-3.5 w-3.5" />} />
        <SummaryCard label="Errors" value={errored} tone="rose" icon={<AlertCircle className="h-3.5 w-3.5" />} />
      </div>

      {/* Tenants table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Database</th>
              <th className="px-4 py-3 font-medium">Latest migration</th>
              <th className="px-4 py-3 font-medium">Applied</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No tenants found.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.subdomain}</div>
                  </td>
                  <td className="px-4 py-3">
                    {t.db_name ? (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{t.db_name}</code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.error ? (
                      <span className="text-xs text-red-600">{t.error}</span>
                    ) : t.latestApplied ? (
                      <code className="text-xs font-mono break-all">{t.latestApplied}</code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.error ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {t.appliedCount} / {t.total}
                        </div>
                        <div className="mt-1 h-1.5 w-28 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${t.total ? (t.appliedCount / t.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.error ? (
                      <Badge tone="rose">Error</Badge>
                    ) : t.pendingCount === 0 ? (
                      <Badge tone="emerald">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Up to date
                      </Badge>
                    ) : (
                      <details>
                        <summary className="cursor-pointer list-none">
                          <Badge tone="amber">{t.pendingCount} pending</Badge>
                        </summary>
                        <div className="mt-2 max-h-44 overflow-y-auto rounded border bg-muted/30 p-2 text-xs font-mono space-y-0.5">
                          {t.pending.map((p) => (
                            <div key={p} className="break-all">
                              {p}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer — link to the apply tools */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          To apply pending migrations across all tenants, use the Tenant Database / Migrations tools.
        </p>
        <Link to="/admin/common-commands">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Common Commands
          </Button>
        </Link>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone?: 'emerald' | 'amber' | 'rose'
  icon?: ReactNode
}) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : tone === 'rose' ? 'text-rose-600' : ''
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}

function Badge({ tone, children }: { tone: 'emerald' | 'amber' | 'rose'; children: ReactNode }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>
}
