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

export const Route = createFileRoute('/_authenticated/dashboard/reports/outdoor/patient-list/print')({
  validateSearch: searchSchema,
  component: OutdoorPatientListPrint,
})

interface OutdoorPatientItem {
  id: number
  custom_id?: string
  patient_name: string
  patient_phone?: string
  reference_doctor?: string
  department_name?: string
  bill_amount: number
  discount: number
  collected_amount: number
  created_at: string
}

function OutdoorPatientListPrint() {
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
    queryKey: ['print-outdoor-patient-list', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/outdoor-invoice?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch outdoor patient data')
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
    const totalBill = flatItems.reduce((sum: number, r: any) => sum + Number(r.bill_amount || 0), 0)
    const totalCollected = flatItems.reduce((sum: number, r: any) => sum + Number(r.collected_amount || 0), 0)
    const totalDiscount = flatItems.reduce((sum: number, r: any) => sum + Number(r.discount || 0), 0)
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: 'Total Patients', value: totalFromMeta },
      { label: 'Total Bill', value: '৳' + totalBill.toLocaleString() },
      { label: 'Total Collected', value: '৳' + totalCollected.toLocaleString() },
      { label: 'Total Discount', value: '৳' + totalDiscount.toLocaleString() },
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
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
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
            padding: 1rem !important;
            box-shadow: none !important;
          }
          .invoice-print-area table {
            width: 100% !important;
          }
          /* Reduce container spacing */
          .mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .mb-4 {
            margin-bottom: 0.75rem !important;
          }
          .mb-6 {
            margin-bottom: 1rem !important;
          }
          .mb-3 {
            margin-bottom: 0.75rem !important;
          }
          .mt-4 {
            margin-top: 0.5rem !important;
          }
          .mt-6 {
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
            table-layout: fixed !important;
          }
          th, td {
            padding: 4px 6px !important;
            border: 1px solid #ddd !important;
            color: #000 !important;
            font-size: 10px !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
          }
          th {
            background-color: #f0f9ff !important;
            color: #000 !important;
            font-weight: 600 !important;
          }
          .bg-row-blue {
            background-color: #f0f9ff !important;
          }
          /* Avoid breaking rows across pages */
          tr, td, th {
            page-break-inside: avoid;
          }
          .border { border-color: #ddd !important; }
          .border-dashed { border-color: #ddd !important; }
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
          .w-20 {
            width: 50px !important;
            height: 50px !important;
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
              className="w-20 h-20 object-contain"
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
        OUTDOOR PATIENT LIST REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Complete record of outdoor patient invoices</p>

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
              <span className="font-bold">{stat.value}</span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-2" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-t border-b" style={{ backgroundColor: '#f0f9ff' }}>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '4%' }}>#</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '7%' }}>Invoice ID</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '9%' }}>Custom ID</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '16%' }}>Patient Name</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '11%' }}>Phone</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '13%' }}>Reference Doctor</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '10%' }}>Department</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '9%' }}>Bill (৳)</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '9%' }}>Disc. (৳)</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '12%' }}>Collected (৳)</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: OutdoorPatientItem, idx: number) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-1.5 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="px-1.5 py-1 text-[10px] font-mono">{item.id || '-'}</td>
              <td className="px-1.5 py-1 text-[10px] font-mono">{item.custom_id || '-'}</td>
              <td className="px-1.5 py-1 text-[10px] font-medium">{item.patient_name || '-'}</td>
              <td className="px-1.5 py-1 text-[10px] font-mono">{item.patient_phone || '-'}</td>
              <td className="px-1.5 py-1 text-[10px]">{item.reference_doctor || '-'}</td>
              <td className="px-1.5 py-1 text-[10px]">{item.department_name || '-'}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{Number(item.bill_amount || 0).toFixed(2)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{Number(item.discount || 0).toFixed(2)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right font-semibold">{Number(item.collected_amount || 0).toFixed(2)}</td>
            </tr>
          ))}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={10} className="px-2 py-4 text-center text-gray-500">
                No outdoor patient records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
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
