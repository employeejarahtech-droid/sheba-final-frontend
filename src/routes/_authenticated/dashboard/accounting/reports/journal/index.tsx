import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useRef, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowUpRight, ArrowDownLeft, Scale, Printer, FileText, Hash } from 'lucide-react'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { accountingService } from '@/features/accounting/accountingService'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface JournalEntry {
  id: number
  date: string | null
  narration: string | null
  reference_type: string | null
  entries: JournalLine[]
  total_debit: number
  total_credit: number
}

interface JournalLine {
  account: {
    code: string
    name: string
  }
  debit: string
  credit: string
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/journal/')({
  component: JournalReportPage,
})

function JournalReportPage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();
  const { currencySymbol } = useCurrency();

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

  const { data, isLoading } = useQuery({
    queryKey: ['journal-report', page, limit, search, from, to],
    queryFn: () => accountingService.getJournalReport({
      page,
      limit,
      search: search || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    placeholderData: (prev) => prev ? prev : { data: [], pagination: { total: 0, page: 1, limit: 10, totalPage: 0 } },
  })

  // The /api/accounting/journal endpoint returns { data: [...rows], pagination }
  // (not { data: { items, meta } }). Read that shape.
  const items: JournalEntry[] = data?.data || []
  const meta: Meta = data?.pagination
    ? {
        total: data.pagination.total ?? 0,
        page: data.pagination.page ?? 1,
        limit: data.pagination.limit ?? 10,
        totalPages: data.pagination.totalPage ?? data.pagination.totalPages ?? 1,
      }
    : { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Calculate statistics
  const stats = useMemo(() => {
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    items.forEach((entry) => {
      (entry.entries || []).forEach((line: any) => {
        totalDebitSum += parseFloat(line.debit) || 0;
        totalCreditSum += parseFloat(line.credit) || 0;
      });
    });

    const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01;

    return [
      { label: 'Total Entries', value: meta.total, icon: BookOpen, grad: 'from-green-500 to-green-600' },
      { label: 'Total Debits', value: `${currencySymbol} ${totalDebitSum.toFixed(2)}`, icon: ArrowUpRight, grad: 'from-blue-500 to-blue-600' },
      { label: 'Total Credits', value: `${currencySymbol} ${totalCreditSum.toFixed(2)}`, icon: ArrowDownLeft, grad: 'from-orange-500 to-orange-600' },
      { label: 'This Page', value: items.length, icon: Hash, grad: 'from-teal-500 to-teal-600' },
      { label: 'Balanced', value: isBalanced ? 'Yes' : 'No', icon: Scale, grad: isBalanced ? 'from-violet-500 to-violet-600' : 'from-red-500 to-red-600' },
      { label: 'Difference', value: `${currencySymbol} ${Math.abs(totalDebitSum - totalCreditSum).toFixed(2)}`, icon: Hash, grad: 'from-yellow-500 to-yellow-600' },
    ]
  }, [items, meta, currencySymbol])

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

  // Keep a ref so the DOM event listener always sees the latest items
  const itemsRef = useRef<JournalEntry[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Handle expand button clicks — reads detail data from already-loaded items (no extra API call)
  useEffect(() => {
    const handleExpandClick = (e: Event) => {
      const button = (e.target as HTMLElement).closest('.expand-btn');
      if (!button) return;

      const btn = button as HTMLButtonElement;
      const row = btn.closest('tr');
      if (!row) return;

      const nextRow = row.nextElementSibling;

      // Toggle off if already expanded
      if (nextRow && nextRow.classList.contains('child-row-detail')) {
        nextRow.remove();
        row.classList.remove('expanded');
        btn.textContent = '+';
        btn.style.backgroundColor = '#10B981';
        return;
      }

      if (row.classList.contains('expanded')) return;

      const id = Number(btn.dataset.id);

      // Look up entry from already-loaded data — no network call needed
      const entry = itemsRef.current.find((item) => item.id === id);

      const details = document.createElement('div');
      details.className = 'max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden';

      if (!entry) {
        details.innerHTML = `<div class="p-6 text-red-500 text-sm">Entry not found in current page data.</div>`;
      } else {
        const formatDateTime = (date: string | null) => {
          if (!date) return '-';
          try { return formatDate(new Date(date)); } catch { return date; }
        };

        details.innerHTML = `
          <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4">
            <h2 class="text-xl font-semibold">Journal Entry Details</h2>
            <p class="text-sm opacity-90">Entry #${id}</p>
          </div>
          <div class="p-6">
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b pb-6">
                <div>
                  <p class="text-gray-500">Entry ID</p>
                  <p class="font-semibold text-gray-800">#${entry.id}</p>
                </div>
                <div>
                  <p class="text-gray-500">Reference Type</p>
                  <p class="font-semibold capitalize">${entry.reference_type || '-'}</p>
                </div>
                <div>
                  <p class="text-gray-500">Date</p>
                  <p class="font-semibold text-gray-800">${formatDateTime(entry.date)}</p>
                </div>
                <div>
                  <p class="text-gray-500">Narration</p>
                  <p class="font-semibold text-gray-800">${entry.narration || '-'}</p>
                </div>
              </div>
              <div class="border-t pt-4">
                <h3 class="font-semibold text-gray-800 mb-3">Entry Lines</h3>
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-3 py-2 text-left border">Account</th>
                      <th class="px-3 py-2 text-right border w-28">Debit</th>
                      <th class="px-3 py-2 text-right border w-28">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(entry.entries || []).map((line: any) => `
                      <tr>
                        <td class="px-3 py-2 border">
                          <span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-2">${line.account?.code || '-'}</span>
                          ${line.account?.name || '-'}
                        </td>
                        <td class="px-3 py-2 text-right border font-mono">${parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : '-'}</td>
                        <td class="px-3 py-2 text-right border font-mono">${parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t">
                <a href="/dashboard/accounting/reports/journal/print?id=${id}"
                   class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-5 transition">
                  Print Entry
                </a>
              </div>
            </div>
          </div>
        `;
      }

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
    };

    document.addEventListener('click', handleExpandClick);
    return () => document.removeEventListener('click', handleExpandClick);
  }, [formatDate]);

  const refTypeBadge: Record<string, { label: string; color: string }> = {
    TRANSACTION: { label: "Transaction", color: "bg-blue-100 text-blue-700" },
    MANUAL: { label: "Manual", color: "bg-purple-100 text-purple-700" },
    PROVIDER_PAYMENT: { label: "Provider Pay", color: "bg-orange-100 text-orange-700" },
    ADMISSION_PAYMENT: { label: "Admission Pay", color: "bg-green-100 text-green-700" },
    OUTDOOR_PAYMENT: { label: "Outdoor Pay", color: "bg-cyan-100 text-cyan-700" },
  };

  const columns = [
    {
      data: "id",
      title: "Entry #",
      orderable: true,
      render: (data: any) => {
        const value = `JE-${String(data).padStart(4, '0')}`;
        return `
          <div class="flex items-center gap-2">
            <button class="expand-btn inline-flex items-center justify-center w-7 h-7 rounded text-white transition-colors font-bold text-xs" style="background-color:#10B981;"
                    type="button"
                    data-id="${data}">+</button>
            <span class="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">${value}</span>
          </div>
        `;
      },
    },
    {
      data: "date",
      title: "Date",
      render: (data: string | null) => {
        if (!data) return '-'
        const date = new Date(data)
        return `<div class="text-sm">${formatDate(date)}</div>`
      },
    },
    {
      data: "narration",
      title: "Narration",
      render: (data: string | null) => data || '-',
    },
    {
      data: "reference_type",
      title: "Type",
      render: (data: string | null) => {
        const badge = refTypeBadge[data || ''] || { label: data || '-', color: 'bg-gray-100 text-gray-700' };
        return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${badge.color}">${badge.label}</span>`;
      },
    },
    {
      data: "total_debit",
      title: "Debit",
      render: (data: number, type: string, row: JournalEntry) => {
        const total = (row.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.debit) || 0), 0);
        return `<span class="font-mono text-sm font-semibold text-emerald-600">${total.toFixed(2)}</span>`;
      },
    },
    {
      data: "total_credit",
      title: "Credit",
      render: (data: number, type: string, row: JournalEntry) => {
        const total = (row.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.credit) || 0), 0);
        return `<span class="font-mono text-sm font-semibold text-rose-600">${total.toFixed(2)}</span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: JournalEntry) => {
        const id = row.id;
        return `<div class="flex gap-2">
          <a href="/dashboard/accounting/reports/journal/print?id=${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
          <a href="/dashboard/accounting/journal/${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors">
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
        title="Journal Entries Report"
        description="Complete record of journal entries with filtering, search, and expandable details"
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
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Journal Entries List"
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
                to="/dashboard/accounting/reports/journal/print"
                search={{
                  search: search || undefined,
                  from: from || undefined,
                  to: to || undefined
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
              <p className="text-gray-500 font-medium">No journal entries found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
