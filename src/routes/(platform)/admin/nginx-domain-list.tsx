/**
 * Nginx Domain List — Diagnostic + management view of nginx server blocks on
 * the API host.
 *
 * Route: /(platform)/admin/nginx-domain-list
 * Reads /etc/nginx/sites-available (+ sites-enabled) directly off disk via
 * GET /api/admin/nginx/domains, and cross-references each server_name against
 * companies.domain / companies.subdomain so you can spot orphaned or
 * misconfigured blocks (e.g. a custom domain that never got matched to a
 * tenant, or one still pointing at the API's own proxy config).
 *
 * Delete and Edit both act directly on the live file on disk:
 *   - Delete removes the file (+ its sites-enabled symlink) and reloads nginx.
 *   - Edit writes new content, runs `nginx -t`, and only reloads if that
 *     passes — otherwise the previous content is restored automatically, so
 *     a bad edit can never take nginx down.
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useNginxDomains,
  useDeleteNginxDomain,
  useNginxDomainContent,
  useUpdateNginxDomain,
} from '@/hooks/usePlatformAdmin'
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
  const [editingFile, setEditingFile] = useState<string | null>(null)

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
            <NginxDomainCard key={d.file} domain={d} onEdit={() => setEditingFile(d.file)} />
          ))}
        </div>
      )}

      <EditNginxDomainDialog
        file={editingFile}
        open={editingFile !== null}
        onOpenChange={(open) => !open && setEditingFile(null)}
      />
    </div>
  )
}

function NginxDomainCard({
  domain,
  onEdit,
}: {
  domain: PlatformNginxDomain
  onEdit: () => void
}) {
  const orphaned = !domain.matchedCompany
  const deleteDomain = useDeleteNginxDomain()

  const handleDelete = () => {
    const warning = domain.matchedCompany
      ? `"${domain.file}" is currently matched to tenant "${domain.matchedCompany.name}". Deleting it will take that domain offline immediately. This cannot be undone. Continue?`
      : `Delete "${domain.file}"? This removes the config from disk and reloads nginx. This cannot be undone.`
    if (window.confirm(warning)) {
      deleteDomain.mutate(domain.file)
    }
  }

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

      <div className="pt-2 border-t space-y-3">
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

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteDomain.isPending}
          >
            {deleteDomain.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </section>
  )
}

function EditNginxDomainDialog({
  file,
  open,
  onOpenChange,
}: {
  file: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = useNginxDomainContent(file)
  const updateDomain = useUpdateNginxDomain()
  const [content, setContent] = useState('')

  // Sync local textarea state whenever a fresh fetch comes in for this file.
  useEffect(() => {
    if (data && data.file === file) {
      setContent(data.content)
    }
  }, [data, file])

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setContent('')
    onOpenChange(nextOpen)
  }

  const handleSave = () => {
    if (!file) return
    updateDomain.mutate(
      { file, content },
      { onSuccess: () => handleClose(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono">{file}</DialogTitle>
          <DialogDescription>
            Editing writes directly to this file on disk, then runs <code>nginx -t</code> and
            reloads. If the test fails, your changes are automatically reverted and nginx keeps
            running the previous config.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-xs flex-1 min-h-0 resize-none overflow-y-auto"
            spellCheck={false}
          />
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={updateDomain.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateDomain.isPending || isLoading || !content.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updateDomain.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Reload nginx'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
