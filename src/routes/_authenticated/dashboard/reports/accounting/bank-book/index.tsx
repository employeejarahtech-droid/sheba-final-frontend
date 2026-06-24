import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, Hash, Printer, FileText, Building2, Calendar } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface BankBookItem {
  id: number
  transaction_no: string
  transaction_date: string | null
  description: string | null
  debit_amount: number | null
  credit_amount: number | null
  balance: number | null
  bank_name: string | null
  payment_method: string | null
  reference_no: string | null
  status: string | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/bank-book/')({
  component: BankBookPage,
})

function BankBookPage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
  };
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
  };

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['bank-book', page, limit, search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(from ? { start_date: from } : {}),
        ...(to ? { end_date: to } : {}),
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bank-book?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch bank book data')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const items: BankBookItem[] = data?.data?.items || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDebit = items.reduce((sum, i) => sum + (i.debit_amount || 0), 0)
    const totalCredit = items.reduce((sum, i) => sum + (i.credit_amount || 0), 0)
    const completedCount = items.filter((i) => i.status === 'completed').length
    const pendingCount = items.filter((i) => i.status === 'pending').length

    return [
      { label: 'Total Transactions', value: meta.total, icon: Hash, grad: 'from-green-500 to-green-600' },
      { label: 'Total Debit', value: totalDebit, icon: TrendingUp, grad: 'from-blue-500 to-blue-600' },
      { label: 'Total Credit', value: totalCredit, icon: TrendingDown, grad: 'from-orange-500 to-orange-600' },
      { label: 'This Page', value: items.length, icon: Calendar, grad: 'from-teal-500 to-teal-600' },
      { label: 'Completed', value: completedCount, icon: DollarSign, grad: 'from-pink-500 to-pink-600' },
      { label: 'Pending', value: pendingCount, icon: Building2, grad: 'from-yellow-500 to-yellow-600' },
    ]
  }, [items, meta])

  // ---- Date filter presets ----
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const datePresets = useMemo(() => ({
    today: { label: 'Today', from: toYMD(today()), to: toYMD(today()) },
    yesterday: (() => { const d = today(); d.setDate(d.getDate() - 1); return { label: 'Yesterday', from: toYMD(d), to: toYMD(d) }; })(),
    last7: { label: 'Last 7 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 6); return d; })()), to: toYMD(today()) },
    last15: { label: 'Last 15 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 14); return d; })()), to: toYMD(today()) },
    last30: { label: 'Last 30 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 29); return d; })()), to: toYMD(today()) },
    last45: { label: 'Last 45 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 44); return d; })()), to: toYMD(today()) },
    last60: { label: 'Last 60 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 59); return d; })()), to: toYMD(today()) },
    last90: { label: 'Last 90 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 89); return d; })()), to: toYMD(today()) },
    last180: { label: 'Last 180 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 179); return d; })()), to: toYMD(today()) },
    last365: { label: 'Last 365 days', from: toYMD((() => { const d = today(); d.setDate(d.getDate() - 364); return d; })()), to: toYMD(today()) },
  }), []);

  const activePreset = useMemo(() => {
    if (!from || !to) return 'custom';
    const match = Object.entries(datePresets).find(([, v]) => v.from === from && v.to === to);
    return match ? match[0] : 'custom';
  }, [from, to, datePresets]);

  const [presetOpen, setPresetOpen] = useState(false);
  const applyPreset = (key: string) => {
    const p = (datePresets as any)[key];
    if (p) { setFrom(p.from); setTo(p.to); }
    setPresetOpen(false);
  };

  // Handle expand button clicks
  useEffect(() => {
    const handleExpandClick = async (e: Event) => {
      const button = (e.target as HTMLElement).closest('.expand-btn');
      if (!button) return;

      const btn = button as HTMLButtonElement;
      const row = btn.closest('tr');
      if (!row) return;

      const isExpanded = row.classList.contains('expanded');
      const nextRow = row.nextElementSibling;

      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove();
        row.classList.remove('expanded');
        btn.textContent = '+';
        btn.style.backgroundColor = '#10B981';
        return;
      }

      if (isExpanded) return;

      const id = btn.dataset.id || '';

      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      details.innerHTML = `
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4">
          <h2 class="text-xl font-semibold">Bank Transaction Details</h2>
          <p class="text-sm opacity-90">Transaction #${id}</p>
        </div>
        <div class="p-6">
          <div id="bank-details-${id}" class="text-gray-500 text-sm">
            Loading transaction details...
          </div>
        </div>
      `;

      const newRow = document.createElement('tr');
      newRow.className = 'child-row-detail';
      const cell = document.createElement('td');
      cell.className = 'p-4 bg-gray-50';
      cell.colSpan = row.cells.length;
      cell.appendChild(details);
      newRow.appendChild(cell);

      row.parentNode?.insertBefore(newRow, row.nextSibling);
      row.classList.add('expanded');
      btn.textContent = '−';
      btn.style.backgroundColor = '#dc2626';

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bank-book/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch bank transaction details");

        const result = await res.json();
        const transaction = result.data;

        const formatCurrency = (amount: number | null) => {
          return amount ? `$${amount.toFixed(2)}` : '-';
        };

        const transactionDetailsHTML = `
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b pb-6">
              <div>
                <p class="text-gray-500">Transaction No</p>
                <p class="font-semibold text-gray-800">${transaction.transaction_no || `TXN-${String(transaction.id).padStart(4, '0')}` || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Status</p>
                <p class="font-semibold capitalize">${transaction.status || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Bank Name</p>
                <p class="font-semibold text-gray-800">${transaction.bank_name || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Payment Method</p>
                <p class="font-semibold text-gray-800">${transaction.payment_method || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Transaction Date</p>
                <p class="font-semibold text-gray-800">${transaction.transaction_date ? formatDate(new Date(transaction.transaction_date)) : '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Reference No</p>
                <p class="font-semibold text-gray-800">${transaction.reference_no || '-'}</p>
              </div>
              <div>
                <p class="text-gray-500">Debit Amount</p>
                <p class="font-semibold text-gray-800">${formatCurrency(transaction.debit_amount)}</p>
              </div>
              <div>
                <p class="text-gray-500">Credit Amount</p>
                <p class="font-semibold text-gray-800">${formatCurrency(transaction.credit_amount)}</p>
              </div>
              ${transaction.description ? `
              <div class="col-span-2">
                <p class="text-gray-500">Description</p>
                <p class="font-semibold text-gray-800">${transaction.description}</p>
              </div>
              ` : ''}
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <a href="/dashboard/accounting/transactions/${id}"
                 class="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-5 transition shadow-md">
                View Details
              </a>
            </div>
          </div>
        `;

        const container = document.getElementById(`bank-details-${id}`);
        if (container) {
          container.innerHTML = transactionDetailsHTML;
        }
      } catch (error) {
        console.error('Error fetching bank transaction details:', error);
        const container = document.getElementById(`bank-details-${id}`);
        if (container) {
          container.innerHTML = `
            <div class="text-red-500 text-sm">
              Failed to load transaction details. Please try again.
            </div>
          `;
        }
      }
    };

    document.addEventListener('click', handleExpandClick);

    return () => {
      document.removeEventListener('click', handleExpandClick);
    };
  }, [token, formatDate]);

  const columns = [
    {
      data: "transaction_no",
      title: "Transaction No",
      orderable: true,
      render: (data: any, _type: string, row: BankBookItem) => {
        const value = data || `TXN-${String(row.id).padStart(4, '0')}`;
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-id="${row.id}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${value}</span>
          </div>
        `;
      },
    },
    {
      data: "transaction_date",
      title: "Transaction Date",
      render: (data: string | null) => {
        if (!data) return '-'
        const date = new Date(data)
        return `<div class="text-sm">
          <div>${formatDate(date)}</div>
        </div>`
      },
    },
    {
      data: "description",
      title: "Description",
      render: (data: string | null) => {
        return `<span class="text-sm">${data || '-'}</span>`
      },
    },
    {
      data: "bank_name",
      title: "Bank Name",
      render: (data: string | null) => {
        return `<div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <span class="font-medium text-sm">${data || '-'}</span>
        </div>`
      },
    },
    {
      data: "payment_method",
      title: "Payment Method",
      render: (data: string | null) => {
        const method = (data || '').toLowerCase()
        if (!method) return '-'
        const colorMap: Record<string, string> = {
          cash: 'bg-green-100 text-green-700',
          bank_transfer: 'bg-blue-100 text-blue-700',
          cheque: 'bg-purple-100 text-purple-700',
          card: 'bg-orange-100 text-orange-700',
          online: 'bg-teal-100 text-teal-700',
        }
        const colorClass = colorMap[method] || 'bg-gray-100 text-gray-700'
        return `<span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}">${method.replace('_', ' ')}</span>`
      },
    },
    {
      data: "debit_amount",
      title: "Debit",
      render: (data: number | null) => {
        return data ? `<span class="font-semibold text-green-600">$${data.toFixed(2)}</span>` : '-'
      },
    },
    {
      data: "credit_amount",
      title: "Credit",
      render: (data: number | null) => {
        return data ? `<span class="font-semibold text-red-600">$${data.toFixed(2)}</span>` : '-'
      },
    },
    {
      data: "balance",
      title: "Balance",
      render: (data: number | null) => {
        return `<span class="font-semibold text-blue-600">$${(data || 0).toFixed(2)}</span>`
      },
    },
    {
      data: "reference_no",
      title: "Reference No",
      render: (data: string | null) => {
        return data ? `<span class="font-mono text-xs">${data}</span>` : '-'
      },
    },
    {
      data: "status",
      title: "Status",
      render: (data: string | null) => {
        const status = (data || '').toLowerCase()
        const colorMap: Record<string, { color: string; label: string }> = {
          completed: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Completed' },
          pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
          failed: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Failed' },
        }
        const config = colorMap[status] || { color: 'bg-gray-100 text-gray-700', label: status || '-' }
        return `<span class="px-3 py-1 rounded-full text-xs font-semibold capitalize border ${config.color}">${config.label}</span>`
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: BankBookItem) => {
        const id = row.id;
        return `<div class="flex gap-2">
          <a href="/dashboard/reports/accounting/bank-book/print?id=${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
          <a href="/dashboard/accounting/transactions/${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M14 8V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12"/><path d="M20 18v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4"/><path d="M22 8h-6"/></svg>
            View
          </a>
        </div>`;
      },
    },
  ]

  return (
    <>
      <AppHeader
        title="Bank Book"
        description="Complete record of bank transactions with filtering, search, and expandable details"
        fixed
      />

      <main className="">
        {/* Enhanced Stats Cards - 6 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colors = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: colors[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: colors[index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Bank Book Transactions"
          columns={columns}
          data={items}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          filterSlot={
            <div className="flex items-center gap-1.5">
              <Select value={activePreset} onValueChange={applyPreset} open={presetOpen} onOpenChange={setPresetOpen}>
                <SelectTrigger className="w-[140px] h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last15">Last 15 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last45">Last 45 days</SelectItem>
                  <SelectItem value="last60">Last 60 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last180">Last 180 days</SelectItem>
                  <SelectItem value="last365">Last 365 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <DateField
                value={from}
                onChange={(v: string) => { setFrom(v); setPresetOpen(false); }}
                placeholder="From"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <DateField
                value={to}
                onChange={(v: string) => { setTo(v); setPresetOpen(false); }}
                placeholder="To"
              />
              {(from || to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFrom(""); setTo(""); }}
                >
                  Clear
                </Button>
              )}
              <Link
                to="/dashboard/reports/accounting/bank-book/print"
                search={{
                  search: search || undefined,
                  start_date: from || undefined,
                  end_date: to || undefined
                }}
              >
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </Link>
            </div>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bank transactions found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
