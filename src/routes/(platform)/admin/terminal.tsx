/**
 * Terminal — unrestricted remote shell on the API host
 *
 * Route: /(platform)/admin/terminal
 * Backs onto POST /api/admin/terminal/exec, which runs whatever string you
 * type through a real shell (/bin/bash) as root — no whitelist, no
 * confirmation step. This is deliberately different from Common Commands
 * (which only runs a fixed set of known-safe operations); this one is the
 * "type anything" option, requested explicitly with that risk understood.
 *
 * `cd` is handled specially client+server side to fake a persistent shell:
 * each exec() call is a fresh, throwaway shell, so the server resolves/
 * validates the target directory and hands back the new absolute path,
 * which this page then sends as `cwd` on the next command.
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, SquareTerminal } from 'lucide-react'
import { getAdminRoleFromToken } from '@/stores/platform-auth-store'
import { useRunTerminalCommand } from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/terminal')({
  beforeLoad: () => {
    if (getAdminRoleFromToken() !== 'super_admin') {
      throw redirect({ to: '/admin' })
    }
  },
  component: TerminalPage,
})

interface HistoryEntry {
  cwd: string
  command: string
  stdout: string
  stderr: string
  code: number
}

const DEFAULT_CWD = '/var/www/api.hmsap.com'

function TerminalPage() {
  const [cwd, setCwd] = useState(DEFAULT_CWD)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const runCommand = useRunTerminalCommand()
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const command = input.trim()
    if (!command || runCommand.isPending) return

    setInput('')
    setCmdHistory((prev) => [...prev, command])
    setHistoryIndex(null)

    runCommand.mutate(
      { command, cwd },
      {
        onSuccess: (res) => {
          const data = res.data
          setHistory((prev) => [
            ...prev,
            {
              cwd,
              command,
              stdout: data?.stdout || '',
              stderr: data?.stderr || '',
              code: data?.code ?? (res.success ? 0 : 1),
            },
          ])
          if (data?.cwd) setCwd(data.cwd)
        },
        onError: (err) => {
          setHistory((prev) => [
            ...prev,
            { cwd, command, stdout: '', stderr: err.message, code: 1 },
          ])
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const nextIndex = historyIndex === null ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIndex)
      setInput(cmdHistory[nextIndex])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === null) return
      const nextIndex = historyIndex + 1
      if (nextIndex >= cmdHistory.length) {
        setHistoryIndex(null)
        setInput('')
      } else {
        setHistoryIndex(nextIndex)
        setInput(cmdHistory[nextIndex])
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-xs text-red-700 dark:text-red-400">
          Runs anything you type as root on the production server, with no confirmation and no
          whitelist. For safe, pre-approved operations use{' '}
          <a href="/admin/common-commands" className="underline font-medium">
            Common Commands
          </a>{' '}
          instead.
        </p>
      </div>

      <div
        className="rounded-lg bg-black text-green-400 font-mono text-xs p-4 h-[600px] overflow-y-auto"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center gap-2 mb-2 text-gray-400">
          <SquareTerminal className="h-4 w-4" />
          <span>api.hmsap.com terminal</span>
        </div>

        {history.map((entry, i) => (
          <div key={i} className="mb-2">
            <div className="text-purple-400">
              <span className="text-blue-400">{entry.cwd}</span>{' $ '}
              <span className="text-white">{entry.command}</span>
            </div>
            {entry.stdout && <pre className="whitespace-pre-wrap break-all">{entry.stdout}</pre>}
            {entry.stderr && (
              <pre className="whitespace-pre-wrap break-all text-red-400">{entry.stderr}</pre>
            )}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-blue-400 shrink-0">{cwd}</span>
          <span className="shrink-0">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={runCommand.isPending}
            className="flex-1 bg-transparent outline-none text-white disabled:opacity-50"
            spellCheck={false}
            autoComplete="off"
            placeholder={runCommand.isPending ? 'running...' : ''}
          />
        </form>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
