/**
 * Nginx Domain List — Diagnostic view of nginx server blocks on the API host
 *
 * Route: /(platform)/admin/nginx-domain-list
 * Reads /etc/nginx/sites-available (+ sites-enabled) directly off disk via
 * GET /api/admin/nginx/domains, and cross-references each server_name against
 * companies.domain / companies.subdomain so you can spot orphaned or
 * misconfigured blocks (e.g. a custom domain that never got matched to a
 * tenant, or one still pointing at the API's own proxy config).
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  RefreshCw,
  Loader2,
  Globe,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNginxDomains } from '@/hooks/usePlatformAdmin'
import type { PlatformNginxDomain } from '@/types/platform.types'
import { getAdminRoleFromToken } from '@/stores/platform-auth-store'

export const Route = createFileRoute('/(platform)/admin/nginx-domain-list')({
  beforeLoad: () => {
    if (getAdminRoleFromToken() !== 'super_admin') {
      throw redirect({ to: '/admin' })
    }
  },
  component: NginxDomainListPage,
})

function NginxDomainListPage() {
  const { data, isLoading, isFetching, refetch } = useNginxDomains()
  const domains = data?.domains ?? []

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Nginx Domains</h1>
              <p className="text-sm text-white/80">
                Server blocks configured on the API host, live from disk
              </p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-white text-purple-700 hover:bg-white/90 font-medium"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {data && (
        <p className="text-xs text-muted-foreground font-mono">
          {data.availableDir}
          {data.enabledDir !== data.availableDir ? ` (enabled via ${data.enabledDir})` : ''}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : domains.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Server className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            No nginx server blocks found on this host.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {domains.map((d) => (
            <NginxDomainCard key={d.file} domain={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function NginxDomainCard({ domain }: { domain: PlatformNginxDomain }) {
  const orphaned = !domain.matchedCompany
  return (
    <section className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-purple-500 shrink-0" />
          <span className="font-mono text-sm">{domain.file}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={domain.enabled ? 'default' : 'outline'}>
            {domain.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          {domain.hasSSL ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
              <ShieldCheck className="h-3 w-3" />
              SSL
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <ShieldAlert className="h-3 w-3" />
              No SSL
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {domain.serverNames.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-mono"
          >
            <Globe className="h-3 w-3" />
            {name}
          </span>
        ))}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          Type:{' '}
          <span
            className={cn(
              'font-medium',
              domain.configType === 'static' && 'text-blue-600 dark:text-blue-400',
              domain.configType === 'proxy' && 'text-orange-600 dark:text-orange-400'
            )}
          >
            {domain.configType === 'static' ? 'Static SPA (root)' : domain.configType === 'proxy' ? 'Reverse proxy' : 'Unknown'}
          </span>
        </div>
        {domain.target && (
          <div className="font-mono break-all">→ {domain.target}</div>
        )}
      </div>

      <div className="pt-2 border-t">
        {domain.matchedCompany ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tenant</span>
            <a
              href={`/admin/companies/${domain.matchedCompany.id}`}
              className="inline-flex items-center gap-1 font-medium text-purple-600 hover:underline"
            >
              {domain.matchedCompany.name}
              {!domain.matchedCompany.isActive && (
                <Badge variant="outline" className="ml-1 text-xs">
                  inactive
                </Badge>
              )}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            {orphaned ? 'Not matched to any company — check for a stale or orphaned config' : ''}
          </div>
        )}
      </div>
    </section>
  )
}
