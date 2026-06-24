import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/bank-book/print')({
  validateSearch: searchSchema,
  component: BankBookPrint,
})

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

function BankBookPrint() {
  const { search, start_date, end_date } = Route.useSearch()
  const token = getCookie('accessToken')
  const { formatDate } = useDateFormat()
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

  const formatCurrency = (amount: number | null) => {
    return amount ? `$${amount.toFixed(2)}` : '-'
  }

  const { data, isLoading } = useQuery({
    queryKey: ['print-bank-book', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/bank-book?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch bank book data')
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
    const totalDebit = flatItems.reduce((sum: number, t: any) => sum + (t.debit_amount || 0), 0)
    const totalCredit = flatItems.reduce((sum: number, t: any) => sum + (t.credit_amount || 0), 0)
    const completedCount = flatItems.filter((r: any) => r.status === 'completed').length
    const pendingCount = flatItems.filter((r: any) => r.status === 'pending').length
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: 'Total Transactions', value: totalFromMeta, color: COLORS[0] },
      { label: 'Total Debit', value: `$${totalDebit.toFixed(2)}`, color: COLORS[5] },
      { label: 'Total Credit', value: `$${totalCredit.toFixed(2)}`, color: COLORS[1] },
      { label: 'Completed', value: completedCount, color: COLORS[2] },
      { label: 'Pending', value: pendingCount, color: COLORS[4] },
      { label: 'Records in Period', value: flatItems.length, color: COLORS[3] },
    ]
  }, [flatItems, data])

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
          /* Hide app chrome on print */
          .print\\:hidden {
            display: none !important;
          }
          /* Reset layout constraints for printing */
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
          /* Avoid breaking rows across pages */
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

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold text-center underline mb-4 tracking-wide uppercase">
        BANK BOOK REPORT
      </h1>
      <p className="text-center text-sm text-gray-600 mb-6">Complete record of bank transactions</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(start_date || end_date || search) && (
        <div className="mb-4 p-3 bg-gray-50 rounded border text-sm">
          <div className="grid grid-cols-3 gap-4">
            {start_date && (
              <div><strong>From:</strong> {safeFormatDate(start_date)}</div>
            )}
            {end_date && (
              <div><strong>To:</strong> {safeFormatDate(end_date)}</div>
            )}
            {search && (
              <div><strong>Search:</strong> {search}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-3 rounded border text-center"
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <div className="text-xs text-gray-600 uppercase">{stat.label}</div>
            <div className="text-xl font-bold mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-sm mt-4">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-2 py-1 text-left text-xs w-[3%]">#</th>
            <th className="px-2 py-1 text-left text-xs w-[10%]">Trans. No</th>
            <th className="px-2 py-1 text-left text-xs w-[10%]">Date</th>
            <th className="px-2 py-1 text-left text-xs w-[15%]">Description</th>
            <th className="px-2 py-1 text-left text-xs w-[12%]">Bank Name</th>
            <th className="px-2 py-1 text-center text-xs w-[10%]">Payment Method</th>
            <th className="px-2 py-1 text-right text-xs w-[10%]">Debit</th>
            <th className="px-2 py-1 text-right text-xs w-[10%]">Credit</th>
            <th className="px-2 py-1 text-right text-xs w-[10%]">Balance</th>
            <th className="px-2 py-1 text-left text-xs w-[10%]">Reference No</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: BankBookItem, idx: number) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>
              <td className="px-2 py-1 text-xs font-mono">{item.transaction_no || `TXN-${String(item.id).padStart(4, '0')}` || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.transaction_date ? safeFormatDate(item.transaction_date) : '-'}</td>
              <td className="px-2 py-1 text-xs">{item.description || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.bank_name || '-'}</td>
              <td className="px-2 py-1 text-xs text-center capitalize">{item.payment_method ? item.payment_method.replace('_', ' ') : '-'}</td>
              <td className="px-2 py-1 text-xs text-right text-green-600">{item.debit_amount ? formatCurrency(item.debit_amount) : '-'}</td>
              <td className="px-2 py-1 text-xs text-right text-red-600">{item.credit_amount ? formatCurrency(item.credit_amount) : '-'}</td>
              <td className="px-2 py-1 text-xs text-right text-blue-600 font-semibold">{formatCurrency(item.balance)}</td>
              <td className="px-2 py-1 text-xs font-mono">{item.reference_no || '-'}</td>
            </tr>
          ))}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={10} className="px-2 py-8 text-center text-gray-500">
                No bank transactions found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Total Records:</strong> {flatItems.length}
          </div>
          <div className="text-right">
            <strong>Generated:</strong> {safeFormatDate(new Date())}
          </div>
        </div>
      </div>

      {/* ── Signature Row ───────────────────────────────────────────────── */}
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
