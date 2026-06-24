import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, BookOpen } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/journal/print')({
  validateSearch: searchSchema,
  component: JournalPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface JournalEntry {
  id: number
  date: string | null
  narration: string | null
  reference_type: string | null
  entries: JournalLine[]
}

interface JournalLine {
  account: {
    code: string
    name: string
  }
  debit: string
  credit: string
}

function JournalPrint() {
  const { search, from, to } = Route.useSearch()
  const token = getCookie('accessToken')
  const { formatDate } = useDateFormat()
  const { currencySymbol } = useCurrency()
  const API_URL = import.meta.env.VITE_API_URL || ''

  const safeFormatDate = (dateVal: any) => {
    if (!dateVal) return '-'
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [y, m, day] = dateVal.split('-').map(Number)
      return formatDate(new Date(y, m - 1, day))
    }
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return '-'
    return formatDate(d)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['print-journal-report', search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${API_URL}/api/accounting/journal?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch journal data')
      return res.json()
    },
    enabled: !!token,
  })

  // Fetch company settings for company name, address and logo
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/company-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch company settings");
      const result = await res.json();
      return result.data;
    },
    enabled: !!token,
  })

  const items = useMemo(() => data?.data?.items ?? [], [data?.data?.items])
  const flatItems = items.length > 0 && Array.isArray(items[0]) ? items[0] : items

  const stats = useMemo(() => {
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    flatItems.forEach((entry: any) => {
      (entry.entries || []).forEach((line: any) => {
        totalDebitSum += parseFloat(line.debit) || 0;
        totalCreditSum += parseFloat(line.credit) || 0;
      });
    });

    const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01;
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: 'Total Entries', value: totalFromMeta },
      { label: 'Total Debit', value: `${currencySymbol} ${totalDebitSum.toFixed(2)}` },
      { label: 'Total Credit', value: `${currencySymbol} ${totalCreditSum.toFixed(2)}` },
      { label: 'Status', value: isBalanced ? 'BALANCED' : 'UNBALANCED' },
      { label: 'Records in Period', value: flatItems.length },
      { label: 'Difference', value: `${currencySymbol} ${Math.abs(totalDebitSum - totalCreditSum).toFixed(2)}` },
    ]
  }, [flatItems, data, currencySymbol])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';

  const refTypeBadge: Record<string, { label: string }> = {
    TRANSACTION: { label: "Transaction" },
    MANUAL: { label: "Manual" },
    PROVIDER_PAYMENT: { label: "Provider Pay" },
    ADMISSION_PAYMENT: { label: "Admission Pay" },
    OUTDOOR_PAYMENT: { label: "Outdoor Pay" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading journal data...</span>
      </div>
    )
  }

  const isBalanced = stats.some(s => s.label === 'Status' && s.value === 'BALANCED')

  return (
    <div className="max-w-6xl mx-auto w-full p-8 bg-white">
      <style>{`
        .bg-row-blue { background-color: #cfd2d8ff !important; }
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Reduce container spacing */
          .max-w-6xl {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          /* Compact header */
          .mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .mb-4 {
            margin-bottom: 0.75rem !important;
          }
          .mb-6 {
            margin-bottom: 1rem !important;
          }
          .mt-10 {
            margin-top: 1rem !important;
          }
          .mt-16 {
            margin-top: 2rem !important;
          }
          /* Compact stats section */
          .bg-gray-50 {
            padding: 0.25rem 0.5rem !important;
          }
          /* Table styling */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            color: #000 !important;
            margin-top: 0.5rem !important;
          }
          th, td {
            padding: 4px 6px !important;
            border: 1px solid #ddd !important;
            color: #000 !important;
            font-size: 10px !important;
          }
          th {
            background-color: #f0f9ff !important;
            color: #000 !important;
            font-weight: 600 !important;
          }
          .bg-row-blue {
            background-color: #cfd2d8ff !important;
          }
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #000 !important;
          }
          .text-2xl {
            font-size: 16px !important;
          }
          .text-xl {
            font-size: 14px !important;
          }
          .text-lg {
            font-size: 12px !important;
          }
          .text-sm {
            font-size: 10px !important;
          }
          .text-xs {
            font-size: 9px !important;
          }
          .w-24 {
            width: 60px !important;
            height: 60px !important;
          }
          .border-2 {
            border-width: 1px !important;
          }
        }
      `}</style>

      {/* Back & Print Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Header */}
      <div className="mb-2">
        <div className='flex justify-center items-center gap-6'>
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-24 h-24 object-contain"
            />
          ) : null}

          <div className="text-center">
            <h1 className="text-xl font-bold">{companyName}</h1>
            <p className="text-xs mt-1 leading-4">
              {[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <h1 className="text-lg font-bold text-center underline mb-1 tracking-wide uppercase">
        JOURNAL ENTRIES REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Complete record of journal entries</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(from || to || search) && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-3 gap-2">
            {from && (
              <div><strong>From:</strong> {safeFormatDate(from)}</div>
            )}
            {to && (
              <div><strong>To:</strong> {safeFormatDate(to)}</div>
            )}
            {search && (
              <div><strong>Search:</strong> {search}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats Summary ──────────────────────────────────────────────────── */}
      <div className="mb-3 p-2 bg-gray-50 rounded border text-[10px]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {stats.map((stat, index) => (
            <span key={index}>
              <span className="text-gray-600">{stat.label}:</span>{' '}
              <span className="font-bold">
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400"></span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── DEBIT-CREDIT BALANCE VERIFICATION ──────────────────────────────── */}
      <div className="mb-3 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3" /> DEBIT-CREDIT BALANCE VERIFICATION
          </h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-center gap-4 text-sm font-mono font-bold">
            <div className="text-emerald-700">
              {stats.find(s => s.label === 'Total Debit')?.value || '0.00'}
            </div>
            <div className="text-gray-600">vs</div>
            <div className="text-rose-700">
              {stats.find(s => s.label === 'Total Credit')?.value || '0.00'}
            </div>
          </div>
          <div className="mt-2 text-center">
            {isBalanced ? (
              <div className="bg-emerald-100 text-emerald-700 py-1 rounded font-bold border border-emerald-300 text-[10px]">
                ✓ DEBIT = CREDIT CONFIRMED
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 py-1 rounded font-bold border border-red-300 text-[10px]">
                ✗ DEBIT ≠ CREDIT DETECTED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Journal Entries ───────────────────────────────────────────────── */}
      {flatItems.map((entry: JournalEntry, entryIdx: number) => {
        const entryTotalDebit = (entry.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.debit) || 0), 0);
        const entryTotalCredit = (entry.entries || []).reduce((s: number, e: any) => s + (parseFloat(e.credit) || 0), 0);
        const badge = refTypeBadge[entry.reference_type || ''] || { label: entry.reference_type || '-' };

        return (
          <div key={entry.id} className="mb-3 border border-gray-300">
            {/* Entry Header */}
            <div className="bg-blue-50 px-2 py-1 border-b border-blue-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-700 text-xs">#{entryIdx + 1}</span>
                  <span className="text-xs">
                    {entry.date ? safeFormatDate(entry.date) : '-'}
                  </span>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-md">{entry.narration || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">{badge.label}</span>
                  <span className="text-xs font-mono font-semibold">D: {entryTotalDebit.toFixed(2)}</span>
                  <span className="text-xs font-mono font-semibold">C: {entryTotalCredit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Entry Lines */}
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-row-blue">
                  <th className="border px-2 py-1 text-left text-[10px] w-[10%]">Code</th>
                  <th className="border px-2 py-1 text-left text-[10px] w-[50%]">Account Name</th>
                  <th className="border px-2 py-1 text-right text-[10px] w-[20%]">Debit ({currencySymbol})</th>
                  <th className="border px-2 py-1 text-right text-[10px] w-[20%]">Credit ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody>
                {(entry.entries || []).map((line: any, i: number) => (
                  <tr key={i}>
                    <td className="border px-2 py-1 text-[10px] font-mono">{line.account?.code || '-'}</td>
                    <td className="border px-2 py-1 text-[10px]">{line.account?.name || '-'}</td>
                    <td className="border px-2 py-1 text-right font-mono text-[10px]">
                      {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : '-'}
                    </td>
                    <td className="border px-2 py-1 text-right font-mono text-[10px]">
                      {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
                {/* Entry Totals Row */}
                <tr className="bg-blue-50 font-bold">
                  <td className="border px-2 py-1 text-[10px]" colSpan={2}>Entry Total</td>
                  <td className="border px-2 py-1 text-right text-[10px]">{entryTotalDebit.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right text-[10px]">{entryTotalCredit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {flatItems.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No journal entries found for the selected criteria
        </div>
      )}

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Records:</strong> {flatItems.length}
          </div>
          <div className="text-right">
            <strong>Generated:</strong> {safeFormatDate(new Date())}
          </div>
        </div>
      </div>

      {/* ── Signature Row ───────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mt-6 text-xs">
        <div className="text-left">
          <p className="border-t border-dashed w-40 pt-1">Prepared By:</p>
        </div>
        <div className="text-right">
          <p className="border-t border-dashed w-48 pt-1">Authority Signature:</p>
        </div>
      </div>
    </div>
  )
}
