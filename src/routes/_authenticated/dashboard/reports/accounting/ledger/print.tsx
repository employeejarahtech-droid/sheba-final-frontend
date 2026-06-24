import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'

const searchSchema = z.object({
  account_id: z.coerce.number().optional(),
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/ledger/print')({
  validateSearch: searchSchema,
  component: LedgerPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface LedgerTransaction {
  id: number
  date: string
  narration: string
  debit: number
  credit: number
  balance: number
}

interface LedgerResponse {
  opening_balance: number
  transactions: LedgerTransaction[]
  closing_balance: number
}

function LedgerPrint() {
  const { account_id, from, to } = Route.useSearch()
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
    queryKey: ['print-ledger', account_id, from, to],
    queryFn: async () => {
      if (!account_id) return null
      const params = new URLSearchParams({ account_id: String(account_id) })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${API_URL}/api/accounting/ledger?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch ledger data')
      return res.json() as Promise<LedgerResponse>
    },
    enabled: !!token && !!account_id,
  })

  // Fetch company settings
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

  const items = useMemo(() => data?.transactions ?? [], [data?.transactions])
  const openingBalance = data?.opening_balance || 0
  const closingBalance = data?.closing_balance || 0

  const stats = useMemo(() => {
    const totalDebit = items.reduce((sum, t) => sum + (t.debit || 0), 0)
    const totalCredit = items.reduce((sum, t) => sum + (t.credit || 0), 0)

    return [
      { label: 'Opening Balance', value: openingBalance, color: COLORS[5] },
      { label: 'Total Debit', value: totalDebit, color: COLORS[0] },
      { label: 'Total Credit', value: totalCredit, color: COLORS[1] },
      { label: 'Closing Balance', value: closingBalance, color: COLORS[4] },
      { label: 'Transactions', value: items.length, color: COLORS[3] },
      { label: 'Period Records', value: items.length, color: COLORS[2] },
    ]
  }, [items, openingBalance, closingBalance])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!account_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-medium">No account selected</p>
          <Button variant="outline" className="mt-4" onClick={() => window.close()}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="invoice-print-area max-w-6xl mx-auto w-full p-8 bg-white mt-10 print:mt-0 shadow-sm print:shadow-none border border-slate-100 print:border-none rounded-lg print:rounded-none">
      <style>{`
        .bg-row-blue { background-color: #cfd2d8ff !important; }
        @media print {
          .bg-row-blue { background-color: #cfd2d8ff !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .invoice-print-area {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .invoice-print-area table {
            width: 100% !important;
          }
          tr, td, th {
            page-break-inside: avoid;
          }
          .border { border-color: oklch(0.929 0.013 255.508); }
          .border-dashed { border-color: oklch(0.929 0.013 255.508); }
        }
      `}</style>

      {/* Back & Print Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.close()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Close
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className='flex justify-center items-center gap-8'>
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-24 h-24 object-contain"
            />
          ) : null}

          <div className="text-center">
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <p className="text-sm mt-1 leading-5">
              {[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center underline mb-4 tracking-wide uppercase">
        LEDGER REPORT
      </h1>
      <p className="text-center text-sm text-gray-600 mb-6">Detailed transaction history for the selected account</p>

      {/* Filter Period */}
      {(from || to) && (
        <div className="mb-4 p-3 bg-gray-50 rounded border text-sm">
          <div className="grid grid-cols-2 gap-4">
            {from && (
              <div><strong>From:</strong> {safeFormatDate(from)}</div>
            )}
            {to && (
              <div><strong>To:</strong> {safeFormatDate(to)}</div>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-3 rounded border text-center"
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <div className="text-xs text-gray-600 uppercase">{stat.label}</div>
            <div className="text-xl font-bold mt-1">{currencySymbol}{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <table className="w-full text-sm mt-4">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-2 py-1 text-left text-xs w-[5%]">#</th>
            <th className="px-2 py-1 text-left text-xs w-[12%]">Date</th>
            <th className="px-2 py-1 text-left text-xs w-[40%]">Particulars</th>
            <th className="px-2 py-1 text-right text-xs w-[13%]">Debit</th>
            <th className="px-2 py-1 text-right text-xs w-[13%]">Credit</th>
            <th className="px-2 py-1 text-right text-xs w-[17%]">Balance</th>
          </tr>
        </thead>
        <tbody>
          {/* Opening Balance Row */}
          <tr className="border-b border-dashed bg-gray-50">
            <td className="px-2 py-2 text-xs text-gray-500"></td>
            <td className="px-2 py-2 text-xs"></td>
            <td className="px-2 py-2 text-xs font-medium">Opening Balance</td>
            <td className="px-2 py-2 text-xs text-right"></td>
            <td className="px-2 py-2 text-xs text-right"></td>
            <td className="px-2 py-2 text-xs text-right font-bold">{currencySymbol}{openingBalance.toFixed(2)}</td>
          </tr>

          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>
              <td className="px-2 py-1 text-xs">{item.date ? safeFormatDate(item.date) : '-'}</td>
              <td className="px-2 py-1 text-xs">{item.narration || '-'}</td>
              <td className="px-2 py-1 text-xs text-right">{item.debit ? currencySymbol + item.debit.toFixed(2) : '-'}</td>
              <td className="px-2 py-1 text-xs text-right">{item.credit ? currencySymbol + item.credit.toFixed(2) : '-'}</td>
              <td className="px-2 py-1 text-xs text-right font-bold">{currencySymbol}{(item.balance || 0).toFixed(2)}</td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-2 py-8 text-center text-gray-500">
                No transactions found for the selected period
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Total Transactions:</strong> {items.length}
          </div>
          <div className="text-right">
            <strong>Generated:</strong> {safeFormatDate(new Date())}
          </div>
        </div>
      </div>

      {/* Signature Row */}
      <div className="grid grid-cols-2 mt-16 text-sm">
        <div>
          <p className="border-t border-dashed w-40 pt-1 text-center">Prepared By:</p>
        </div>
        <div className="text-right">
          <p className="border-t border-dashed w-56 ml-auto pt-1">Authority Signature:</p>
        </div>
      </div>
    </div>
  )
}
