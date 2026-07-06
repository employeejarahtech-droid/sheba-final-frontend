/**
 * Common Commands — Server ops panel for the platform superadmin
 *
 * Route: /(platform)/admin/common-commands
 * Each command has a fixed `id` matching a whitelist entry in
 * sheba-api/src/modules/platform/admin/admin.routes.js (POST /commands/:id/run).
 * The client never sends a raw shell string — only the id — so there is no
 * command-injection surface. Dangerous commands (nginx/API restart, git pull,
 * running migrations, server reboot) require an extra confirm step and are
 * visually flagged red. Copy-to-clipboard is still available alongside Run
 * for anyone who'd rather paste it into their own SSH session.
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Terminal,
  Server,
  Activity,
  GitBranch,
  Database,
  Copy,
  Check,
  AlertTriangle,
  Play,
  Loader2,
  Globe,
  Cpu,
} from 'lucide-react'
import { getAdminRoleFromToken } from '@/stores/platform-auth-store'
import { useRunServerCommand } from '@/hooks/usePlatformAdmin'
import type { ServerCommandResult } from '@/services/platform-admin'

export const Route = createFileRoute('/(platform)/admin/common-commands')({
  beforeLoad: () => {
    if (getAdminRoleFromToken() !== 'super_admin') {
      throw redirect({ to: '/admin' })
    }
  },
  component: CommonCommandsPage,
})

interface CommandItem {
  id: string
  command: string
  description: string
  danger?: boolean
}

interface CommandSection {
  title: string
  icon: typeof Terminal
  commands: CommandItem[]
}

// `command` is the human-readable, copy-paste form (what you'd type over SSH,
// including `sudo` where a real terminal would need it). The Run button hits
// the matching backend `id` instead, which already executes as root and
// applies extra safety (delayed reboot, non-streaming logs, confirm-gating).
const SECTIONS: CommandSection[] = [
  {
    title: 'hmsap.com (frontend)',
    icon: Globe,
    commands: [
      {
        id: 'frontend-git-pull',
        command: 'git pull',
        description: 'Pull the latest built frontend (/var/www/hmsap.com) — nginx serves it directly, no restart needed',
        danger: true,
      },
    ],
  },
  {
    title: 'api.hmsap.com (backend)',
    icon: Cpu,
    commands: [
      { id: 'git-pull', command: 'git pull', description: 'Pull the latest API code (/var/www/api.hmsap.com)', danger: true },
      {
        id: 'api-npm-install',
        command: 'npm install',
        description: 'Install/update dependencies after a git pull that changed package.json',
        danger: true,
      },
      {
        id: 'pm2-restart-all',
        command: 'pm2 restart all',
        description: 'Restart every PM2-managed process to pick up the new code. The connection will drop briefly.',
        danger: true,
      },
    ],
  },
  {
    title: 'Nginx',
    icon: Server,
    commands: [
      { id: 'nginx-test', command: 'sudo nginx -t', description: 'Validate nginx config syntax before reloading' },
      { id: 'nginx-reload', command: 'sudo systemctl reload nginx', description: 'Apply config changes without dropping connections' },
      { id: 'nginx-restart', command: 'sudo systemctl restart nginx', description: 'Full restart (use reload instead unless nginx is stuck)', danger: true },
      { id: 'nginx-list-enabled', command: 'ls -la /etc/nginx/sites-enabled/', description: 'List which site configs are currently enabled' },
      { id: 'nginx-error-log', command: 'sudo tail -n 100 /var/log/nginx/error.log', description: 'Last 100 lines of the nginx error log' },
    ],
  },
  {
    title: 'API Process (PM2)',
    icon: Activity,
    commands: [
      { id: 'pm2-status', command: 'pm2 status', description: 'Check if sheba-api is running and its restart count' },
      { id: 'pm2-logs', command: 'pm2 logs sheba-api --lines 200 --nostream', description: 'Dump recent API logs without following' },
      { id: 'pm2-save', command: 'pm2 save', description: 'Persist the current process list (survives reboot with pm2 startup)' },
    ],
  },
  {
    title: 'Git / Deploy (on the server)',
    icon: GitBranch,
    commands: [
      { id: 'git-status', command: 'git status', description: 'Check for local changes before pulling' },
      { id: 'git-pull', command: 'git pull', description: 'Pull the latest deployed code', danger: true },
      {
        id: 'git-checkout-provision-script',
        command: 'git checkout -- scripts/provision-domain.sh',
        description: 'Discard a local change (e.g. a permission-bit diff from a manual chmod) that blocks git pull',
      },
      {
        id: 'git-disable-filemode',
        command: 'git config core.fileMode false',
        description: 'One-time: stop git from treating chmod (executable bit) changes as modifications',
      },
    ],
  },
  {
    title: 'Tenant Database / Migrations',
    icon: Database,
    commands: [
      {
        id: 'migrations-dry-run',
        command: 'node scripts/run-all-tenant-migrations.js --dry-run',
        description: 'List pending migrations across all active tenants without changing anything',
      },
      {
        id: 'migrations-apply',
        command: 'node scripts/run-all-tenant-migrations.js',
        description: 'Apply pending migrations to all active tenants (idempotent, safe to re-run)',
        danger: true,
      },
      {
        id: 'setup-provision-sudoers',
        command: 'sudo ./scripts/setup-provision-domain-sudoers.sh www-data',
        description: 'One-time: allow the API to run provision-domain.sh via sudo without a password prompt',
      },
      {
        id: 'chmod-provision-script',
        command: 'chmod 750 scripts/provision-domain.sh',
        description: 'Re-apply the executable bit if a deploy stripped it (see Delete/Install SSL failures)',
      },
    ],
  },
  {
    title: 'General Server',
    icon: Terminal,
    commands: [
      { id: 'disk-space', command: 'df -h', description: 'Check disk space' },
      { id: 'memory', command: 'free -h', description: 'Check memory usage' },
      { id: 'listening-ports', command: 'ss -tlnp', description: 'List listening ports and the process bound to each' },
      { id: 'mysql-status', command: 'sudo systemctl status mysql', description: 'Check whether MySQL is running' },
      { id: 'api-health-check', command: 'curl http://127.0.0.1:5001/api/public/landing', description: 'Verify the API is responding locally, bypassing nginx/CORS' },
      {
        id: 'server-reboot',
        command: 'sudo reboot',
        description: 'Reboots the whole server after a 1-minute delay (so this request can complete). Nginx/MySQL/PM2 all come back via systemd/pm2 startup, but there will be a brief full outage.',
        danger: true,
      },
    ],
  },
]

function CommonCommandsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <Terminal className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Common Commands</h1>
            <p className="text-sm text-white/80">
              Run these directly on the API server, or copy them to run yourself over SSH
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map((section) => (
          <CommandSectionCard key={section.title} section={section} />
        ))}
      </div>
    </div>
  )
}

function CommandSectionCard({ section }: { section: CommandSection }) {
  const Icon = section.icon
  return (
    <section className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-purple-500" />
        <h2 className="font-semibold">{section.title}</h2>
      </div>
      <div className="space-y-2">
        {section.commands.map((item) => (
          <CommandRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function CommandRow({ item }: { item: CommandItem }) {
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<ServerCommandResult | null>(null)
  const runCommand = useRunServerCommand()

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(item.command)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = item.command
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      toast.success('Command copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleRun = () => {
    if (item.danger) {
      const ok = window.confirm(
        `Run "${item.command}" on the production server?\n\n${item.description}\n\nThis cannot be undone. Continue?`
      )
      if (!ok) return
    }
    setResult(null)
    runCommand.mutate(
      { id: item.id, confirm: item.danger },
      {
        onSuccess: (res) => {
          if (res.data) setResult(res.data)
          if (res.message && !res.data) toast.success(res.message)
          else if (res.data && res.data.code !== 0) toast.error(`Exited with code ${res.data.code}`)
          else toast.success('Done')
        },
      }
    )
  }

  return (
    <div
      className={
        item.danger
          ? 'rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 space-y-2'
          : 'rounded-md border bg-muted/40 p-3 space-y-2'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <code className="text-xs font-mono break-all">{item.command}</code>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRun}
            disabled={runCommand.isPending}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Run on server"
            type="button"
          >
            {runCommand.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
            ) : (
              <Play className={item.danger ? 'h-3.5 w-3.5 text-red-600' : 'h-3.5 w-3.5 text-purple-600'} />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
            title="Copy command"
            type="button"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      <p className={item.danger ? 'text-xs text-red-700 dark:text-red-400 flex items-start gap-1' : 'text-xs text-muted-foreground'}>
        {item.danger && <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
        {item.description}
      </p>
      {result && (
        <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-black/90 text-green-400 rounded-md p-2 max-h-48 overflow-y-auto">
          {result.stdout || result.stderr || `(exit code ${result.code}, no output)`}
        </pre>
      )}
    </div>
  )
}
