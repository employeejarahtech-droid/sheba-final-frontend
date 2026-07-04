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
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/patient/consultant-wise-patients/print')({
  validateSearch: searchSchema,
  component: ConsultantWisePatientsPrint,
})

interface DoctorItem {
  id: number
  name: string
  doctor_name: string
  patient_count: number
  total_bill: number
  total_collected: number
  total_discount: number
}

function ConsultantWisePatientsPrint() {
  const { search, start_date, end_date } = Route.useSearch()
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
    queryKey: ['print-consultant-wise-patients', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/admission/doctor-wise-patients?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch consultant-wise patient data')
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

  const stats = useMemo(() => {
    const totalDoctors = items.length
    const totalPatients = items.reduce((sum: number, r: DoctorItem) => sum + (r.patient_count ?? 0), 0)
    const totalRevenue = items.reduce((sum: number, r: DoctorItem) => sum + (r.total_bill ?? 0), 0)
    const totalCollected = items.reduce((sum: number, r: DoctorItem) => sum + (r.total_collected ?? 0), 0)
    const totalDiscount = items.reduce((sum: number, r: DoctorItem) => sum + (r.total_discount ?? 0), 0)
    const collectionRate = totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : '0.0'
    const avgPatients = totalDoctors > 0 ? Math.round(totalPatients / totalDoctors) : 0

    return [
      { label: 'Total Consultants', value: totalDoctors },
      { label: 'Total Patients', value: totalPatients },
      { label: 'Total Revenue', value: `${currencySymbol} ${totalRevenue.toLocaleString()}` },
      { label: 'Total Collected', value: `${currencySymbol} ${totalCollected.toLocaleString()}` },
      { label: 'Collection Rate', value: `${collectionRate}%` },
      { label: 'Avg per Consultant', value: avgPatients },
    ]
  }, [items, currencySymbol])

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
            margin: 10mm;
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
            padding: 1rem !important;
            box-shadow: none !important;
          }
          .invoice-print-area table {
            width: 100% !important;
          }
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-4 { margin-bottom: 0.75rem !important; }
          .mb-6 { margin-bottom: 1rem !important; }
          .mb-3 { margin-bottom: 0.75rem !important; }
          .mt-4 { margin-top: 0.5rem !important; }
          .mt-6 { margin-top: 1rem !important; }
          .mt-16 { margin-top: 2rem !important; }
          .bg-gray-50 { padding: 0.25rem 0.5rem !important; }
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
          tr, td, th { page-break-inside: avoid; }
          .border { border-color: oklch(0.929 0.013 255.508); }
          .border-dashed { border-color: oklch(0.929 0.013 255.508); }
          h1, h2, h3, h4, h5, h6, p, span, div { color: #000 !important; }
          .text-2xl { font-size: 16px !important; }
          .text-xl { font-size: 14px !important; }
          .text-sm { font-size: 10px !important; }
          .text-xs { font-size: 9px !important; }
          .w-24 { width: 50px !important; height: 50px !important; }
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
        CONSULTANT WISE PATIENT REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Admitted patient distribution and revenue collection by consulting doctor</p>

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
              <span className="text-gray-600">{stat.label}:</span>{" "}
              <span className="font-bold">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-2">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-1.5 py-1 text-left text-[10px] w-[5%]">#</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[23%]">Consultant Name</th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[11%]">Total Patients</th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[13%]">{`Total Bill (${currencySymbol})`}</th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[13%]">{`Total Collected (${currencySymbol})`}</th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[13%]">{`Total Discount (${currencySymbol})`}</th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[12%]">Collection Rate</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: DoctorItem, idx: number) => {
            const bill = item.total_bill || 0
            const collected = item.total_collected || 0
            const rate = bill > 0 ? ((collected / bill) * 100).toFixed(1) : '0.0'

            return (
              <tr key={item.id || idx} className="border-b border-dashed">
                <td className="px-1.5 py-1 text-[10px] text-gray-500">{idx + 1}</td>
                <td className="px-1.5 py-1 text-[10px] font-medium">{item.name || item.doctor_name || "-"}</td>
                <td className="px-1.5 py-1 text-[10px] text-right font-mono font-semibold text-blue-600">{(item.patient_count || 0).toLocaleString()}</td>
                <td className="px-1.5 py-1 text-[10px] text-right font-mono">{currencySymbol} {(item.total_bill || 0).toLocaleString()}</td>
                <td className="px-1.5 py-1 text-[10px] text-right font-mono text-green-600">{currencySymbol} {(item.total_collected || 0).toLocaleString()}</td>
                <td className="px-1.5 py-1 text-[10px] text-right font-mono text-red-600">{currencySymbol} {(item.total_discount || 0).toLocaleString()}</td>
                <td className="px-1.5 py-1 text-[10px] text-right font-semibold">{rate}%</td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                No consultant records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Records:</strong> {items.length}
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
