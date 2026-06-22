/**
 * Billing Overview Page — Platform-level revenue, transactions, and invoices
 *
 * Route: /(platform)/admin/billing/
 * Features: purple-gradient stat cards, Tabs (Transactions / Invoices),
 * status filters, custom pagination, link to Stripe Dashboard.
 * Mirrors the contacts.tsx purple-gradient visual pattern.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Receipt,
  Loader2,
  Activity,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useBillingOverview,
  useBillingTransactions,
  useBillingInvoices,
} from '@/hooks/usePlatformAdmin'
import type {
  PlatformBillingOverview,
  PlatformTransaction,
  PlatformInvoice,
} from '@/types/platform.types'

export const Route = createFileRoute('/(platform)/admin/billing/')({
  component: BillingOverviewPage,
})

// ── Types for RAW paginated responses ─────────────────────────────────────

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages?: number
}

interface TransactionsResponse {
  success?: boolean
  data?: PlatformTransaction[]
  pagination?: Pagination
}

interface InvoicesResponse {
  success?: boolean
  data?: PlatformInvoice[]
  pagination?: Pagination
}

// ── Status Maps ───────────────────────────────────────────────────────────

const txnStatusColorMap: Record<string, string> = {
  succeeded: 'bg-emerald-500 hover:bg-emerald-600',
  completed: 'bg-emerald-500 hover:bg-emerald-600',
  paid: 'bg-emerald-500 hover:bg-emerald-600',
  pending: 'bg-amber-500 hover:bg-amber-600',
  failed: 'bg-red-500 hover:bg-red-600',
  refunded: 'bg-blue-500 hover:bg-blue-600',
  canceled: 'bg-gray-400 hover:bg-gray-500',
  canceled_alt: 'bg-gray-400 hover:bg-gray-500',
}

const txnStatusLabelMap: Record<string, string> = {
  succeeded: 'SUCCEEDED',
  completed: 'COMPLETED',
  paid: 'PAID',
  pending: 'PENDING',
  failed: 'FAILED',
  refunded: 'REFUNDED',
  canceled: 'CANCELED',
}

const invoiceStatusColorMap: Record<string, string> = {
  paid: 'bg-emerald-500 hover:bg-emerald-600',
  draft: 'bg-gray-400 hover:bg-gray-500',
  open: 'bg-blue-500 hover:bg-blue-600',
  void: 'bg-red-500 hover:bg-red-600',
  uncollectible: 'bg-amber-500 hover:bg-amber-600',
}

const invoiceStatusLabelMap: Record<string, string> = {
  paid: 'PAID',
  draft: 'DRAFT',
  open: 'OPEN',
  void: 'VOID',
  uncollectible: 'UNCOLLECTIBLE',
}

const TXN_STATUSES = ['all', 'succeeded', 'pending', 'failed', 'refunded'] as const
const INVOICE_STATUSES = [
  'all',
  'paid',
  'draft',
  'open',
  'void',
  'uncollectible',
] as const

// ── Helpers ───────────────────────────────────────────────────────────────

const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0
  if (Number.isNaN(num)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(num)
}

const formatNumber = (value: number): string => value.toLocaleString()

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────

function BillingOverviewPage() {
  const LIMIT = 10

  // Transactions state
  const [txnPage, setTxnPage] = useState(1)
  const [txnStatus, setTxnStatus] = useState<string>('all')

  // Invoices state
  const [invPage, setInvPage] = useState(1)
  const [invStatus, setInvStatus] = useState<string>('all')

  const txnStatusParam = txnStatus === 'all' ? undefined : txnStatus
  const invStatusParam = invStatus === 'all' ? undefined : invStatus

  const { data: overview, isLoading: overviewLoading } = useBillingOverview()
  const { data: txnResponse, isLoading: txnLoading } = useBillingTransactions({
    page: txnPage,
    limit: LIMIT,
    status: txnStatusParam,
  })
  const { data: invResponse, isLoading: invLoading } = useBillingInvoices({
    page: invPage,
    limit: LIMIT,
    status: invStatusParam,
  })

  // Normalize RAW responses
  const txnData = (txnResponse as TransactionsResponse) ?? {}
  const transactions: PlatformTransaction[] = txnData.data ?? []
  const txnPagination = txnData.pagination ?? {
    page: txnPage,
    limit: LIMIT,
    total: 0,
  }
  const txnTotalPages =
    txnPagination.totalPages ?? Math.max(1, Math.ceil(txnPagination.total / LIMIT))

  const invData = (invResponse as InvoicesResponse) ?? {}
  const invoices: PlatformInvoice[] = invData.data ?? []
  const invPagination = invData.pagination ?? {
    page: invPage,
    limit: LIMIT,
    total: 0,
  }
  const invTotalPages =
    invPagination.totalPages ?? Math.max(1, Math.ceil(invPagination.total / LIMIT))

  const ov = overview as PlatformBillingOverview | undefined

  // Stats cards — purple-gradient pattern
  const stats = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: overviewLoading
          ? null
          : formatCurrency(ov?.totalRevenue ?? 0),
        gradient: 'from-purple-600 to-purple-400',
        shadow: 'shadow-purple-500/30',
        icon: <DollarSign className="w-6 h-6 text-white" />,
      },
      {
        label: 'Monthly Revenue',
        value: overviewLoading
          ? null
          : formatCurrency(ov?.monthlyRevenue ?? 0),
        gradient: 'from-violet-600 to-violet-400',
        shadow: 'shadow-violet-500/30',
        icon: <TrendingUp className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active Subscriptions',
        value: overviewLoading ? null : formatNumber(ov?.activeSubscriptions ?? 0),
        gradient: 'from-fuchsia-600 to-fuchsia-400',
        shadow: 'shadow-fuchsia-500/30',
        icon: <CreditCard className="w-6 h-6 text-white" />,
      },
      {
        label: 'Pending Invoices',
        value: overviewLoading ? null : formatNumber(ov?.pendingInvoices ?? 0),
        gradient: 'from-indigo-600 to-indigo-400',
        shadow: 'shadow-indigo-500/30',
        icon: <FileText className="w-6 h-6 text-white" />,
      },
    ],
    [overviewLoading, ov]
  )

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Billing Overview</h1>
              <p className="text-sm text-white/80">
                Track revenue, subscriptions, and financial metrics
              </p>
            </div>
          </div>
          <Button
            asChild
            className="hidden sm:inline-flex bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20"
          >
            <Link to="/admin/billing/stripe">
              <CreditCard className="mr-2 h-4 w-4" />
              Stripe Dashboard
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]',
              item.gradient,
              item.shadow
            )}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{item.label}</p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {item.value === null ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    item.value
                  )}
                </h3>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                {item.icon}
              </div>
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-black/10">
              <div className="h-full w-2/3 rounded-full bg-white/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs: Transactions & Invoices */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" className="gap-2">
            <Receipt className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Status filter */}
          <div className="flex items-center justify-end">
            <Select
              value={txnStatus}
              onValueChange={(v) => {
                setTxnStatus(v)
                setTxnPage(1)
              }}
            >
              <SelectTrigger className="w-[170px] h-9 border-purple-200 focus:border-purple-500">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {TXN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All Status' : txnStatusLabelMap[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions table */}
          {txnLoading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="h-6 w-6 animate-pulse text-purple-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Receipt className="mx-auto h-10 w-10 text-purple-300" />
              <p className="mt-2 text-sm text-muted-foreground">
                {txnStatus !== 'all'
                  ? 'No transactions found matching your filter.'
                  : 'No transactions yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 py-3">Company</TableHead>
                    <TableHead className="px-4 py-3 text-right">Amount</TableHead>
                    <TableHead className="px-4 py-3">Status</TableHead>
                    <TableHead className="px-4 py-3">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const statusKey = (tx.status ?? '').toLowerCase()
                    const isPositive = Number(tx.amount) >= 0
                    return (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {tx.company_name ?? '—'}
                            </span>
                            {tx.company_subdomain && (
                              <span className="text-xs text-muted-foreground">
                                {tx.company_subdomain}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            )}
                          >
                            {formatCurrency(tx.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                              txnStatusColorMap[statusKey] ?? 'bg-gray-500'
                            )}
                          >
                            {txnStatusLabelMap[statusKey] ?? statusKey.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Transactions pagination */}
          {txnTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(txnPage - 1) * LIMIT + 1}-
                {Math.min(txnPage * LIMIT, txnPagination.total)} of{' '}
                {txnPagination.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txnPage <= 1}
                  onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                {buildPageList(txnPage, txnTotalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`txn-ellipsis-${idx}`}
                      className="px-2 text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={txnPage === item ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'w-9',
                        txnPage === item &&
                          'bg-purple-600 hover:bg-purple-700 text-white'
                      )}
                      onClick={() => setTxnPage(item)}
                    >
                      {item}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txnPage >= txnTotalPages}
                  onClick={() => setTxnPage((p) => Math.min(txnTotalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Status filter */}
          <div className="flex items-center justify-end">
            <Select
              value={invStatus}
              onValueChange={(v) => {
                setInvStatus(v)
                setInvPage(1)
              }}
            >
              <SelectTrigger className="w-[180px] h-9 border-purple-200 focus:border-purple-500">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All Status' : invoiceStatusLabelMap[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoices table */}
          {invLoading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="h-6 w-6 animate-pulse text-purple-500" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-purple-300" />
              <p className="mt-2 text-sm text-muted-foreground">
                {invStatus !== 'all'
                  ? 'No invoices found matching your filter.'
                  : 'No invoices yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 py-3">Company</TableHead>
                    <TableHead className="px-4 py-3 text-right">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-right">Total</TableHead>
                    <TableHead className="px-4 py-3">Status</TableHead>
                    <TableHead className="px-4 py-3">Period</TableHead>
                    <TableHead className="px-4 py-3">Date</TableHead>
                    <TableHead className="px-4 py-3 text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const statusKey = (inv.status ?? '').toLowerCase()
                    const currency = (inv.currency ?? 'USD').toUpperCase()
                    return (
                      <TableRow
                        key={inv.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {inv.company_name ?? '—'}
                            </span>
                            {inv.company_subdomain && (
                              <span className="text-xs text-muted-foreground">
                                {inv.company_subdomain}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-semibold">
                          {formatCurrency(inv.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-semibold">
                          {formatCurrency(inv.total)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {currency}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                              invoiceStatusColorMap[statusKey] ?? 'bg-gray-500'
                            )}
                          >
                            {invoiceStatusLabelMap[statusKey] ??
                              statusKey.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                          {inv.period_start || inv.period_end
                            ? `${formatDate(inv.period_start)} → ${formatDate(
                                inv.period_end
                              )}`
                            : '—'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(inv.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {inv.invoice_pdf ? (
                            <a
                              href={inv.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Invoices pagination */}
          {invTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(invPage - 1) * LIMIT + 1}-
                {Math.min(invPage * LIMIT, invPagination.total)} of{' '}
                {invPagination.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invPage <= 1}
                  onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                {buildPageList(invPage, invTotalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`inv-ellipsis-${idx}`}
                      className="px-2 text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={invPage === item ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'w-9',
                        invPage === item &&
                          'bg-purple-600 hover:bg-purple-700 text-white'
                      )}
                      onClick={() => setInvPage(item)}
                    >
                      {item}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invPage >= invTotalPages}
                  onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Page list helper (with ellipsis) ──────────────────────────────────────

function buildPageList(
  current: number,
  total: number
): Array<number | 'ellipsis'> {
  const result: Array<number | 'ellipsis'> = []
  const pages = Array.from({ length: total }, (_, i) => i + 1)
  const visible = pages.filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 1
  )
  visible.forEach((p, idx) => {
    if (idx > 0 && p - (visible[idx - 1] as number) > 1) {
      result.push('ellipsis')
    }
    result.push(p)
  })
  return result
}
