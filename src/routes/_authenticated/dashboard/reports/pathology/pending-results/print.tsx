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

export const Route = createFileRoute('/_authenticated/dashboard/reports/pathology/pending-results/print')({
  validateSearch: searchSchema,
  component: PendingResultsPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface PendingResultItem {
  id: number
  invoice_id: string
  patient_name: string
  department_name: string
  tests: string
  created_at: string
  status: string
  bill_amount?: number
  collected_amount?: number
}

function daysPending(dateStr: string): number {
  if (!dateStr) return 0
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function PendingResultsPrint() {
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

  const { data, isLoading } = useQuery({
    queryKey: ['print-pending-results', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/outdoor-invoice?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch pending results data')
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

  const pendingItems = useMemo(
    () => flatItems.filter((r: any) => r.status !== 'Completed' && r.status !== 'completed'),
    [flatItems]
  )

  const stats = useMemo(() => {
    const urgent = pendingItems.filter((r: any) => daysPending(r.created_at) > 2).length
    const oldest = pendingItems.reduce((acc: string, r: any) => {
      if (!acc) return r.created_at || ''
      return new Date(r.created_at) < new Date(acc) ? r.created_at : acc
    }, '')
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length
    const avgPending = pendingItems.length > 0
      ? Math.round(pendingItems.reduce((acc: number, r: any) => acc + daysPending(r.created_at), 0) / pendingItems.length)
      : 0

    return [
      { label: 'Total Pending', value: pendingItems.length, color: COLORS[0] },
      { label: 'Urgent (>2 days)', value: urgent, color: COLORS[1] },
      { label: 'Total Invoices', value: totalFromMeta, color: COLORS[2] },
      { label: 'Oldest Pending', value: oldest ? safeFormatDate(oldest) : '-', color: COLORS[3] },
      { label: 'Avg Pending Days', value: avgPending > 0 ? `${avgPending}d` : '-', color: COLORS[4] },
      { label: 'Records in Period', value: pendingItems.length, color: COLORS[5] },
    ]
  }, [flatItems, pendingItems, data, safeFormatDate])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';

  // Debug: Log data state
  console.log('Print data state:', { isLoading, pendingItemsLength: pendingItems.length, flatItems, data })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading pending results data...</span>
      </div>
    )
  }

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
            margin-bottom: 1rem !important;
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
        PENDING RESULTS REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Invoices with pending test results</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(start_date || end_date || search) && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-3 gap-2">
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

      {/* ── Stats Summary ──────────────────────────────────────────────────── */}
      <div className="mb-3 p-2 bg-gray-50 rounded border text-[10px]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {stats.map((stat, index) => (
            <span key={index}>
              <span className="text-gray-600">{stat.label}:</span>{' '}
              <span className="font-bold">{stat.value.toLocaleString()}</span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-2">
        <thead>
          <tr className="border-t border-b" style={{ backgroundColor: '#f0f9ff' }}>
            <th className="px-1.5 py-1 text-left text-[10px] w-[4%]">#</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[10%]">Invoice ID</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[18%]">Patient Name</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[12%]">Department</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[20%]">Tests</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[10%]">Created Date</th>
            <th className="px-1.5 py-1 text-center text-[10px] w-[8%]">Days Pending</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[18%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {pendingItems.map((item: PendingResultItem, idx: number) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-1.5 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="px-1.5 py-1 text-[10px] font-mono font-semibold text-purple-600">{item.id || '-'}</td>
              <td className="px-1.5 py-1 text-[10px] font-medium">{item.patient_name || '-'}</td>
              <td className="px-1.5 py-1 text-[10px]">{item.department_name || '-'}</td>
              <td className="px-1.5 py-1 text-[10px]">{item.tests || '-'}</td>
              <td className="px-1.5 py-1 text-[10px]">{item.created_at ? safeFormatDate(item.created_at) : '-'}</td>
              <td className="px-1.5 py-1 text-[10px] text-center">
                <span className={daysPending(item.created_at) > 2 ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                  {daysPending(item.created_at)}d
                </span>
              </td>
              <td className="px-1.5 py-1 text-[10px]">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  {item.status || 'Pending'}
                </span>
              </td>
            </tr>
          ))}
          {pendingItems.length === 0 && (
            <tr>
              <td colSpan={8} className="px-2 py-4 text-center text-gray-500" style={{ color: '#6b7280 !important' }}>
                <div className="font-semibold text-xs">No pending results found for the selected criteria</div>
                <div className="text-[10px] mt-1">Try adjusting your date range or search filters</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Records:</strong> {pendingItems.length}
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
