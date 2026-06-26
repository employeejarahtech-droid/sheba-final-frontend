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

export const Route = createFileRoute('/_authenticated/dashboard/reports/patient/discharge-summary/print')({
  validateSearch: searchSchema,
  component: DischargeSummaryPrint,
})

interface DischargeItem {
  id: number
  admission_prefix: string | null
  patient_name: string
  age: number | null
  sex: string | null
  admission_date: string | null
  admission_time: string | null
  discharge_date: string | null
  discharge_time: string | null
  total_bill_amount: number | null
  paid_amount: number | null
  due_amount: number | null
  discount_amount?: number | null
  final_bill_amount?: number | null
  advance_payment?: number | null
  doctor?: {
    doctor_name: string | null
  } | null
  doctor_name: string | null
  bedCabin?: {
    code: string | null
    type: string | null
    ward: string | null
  } | null
  bed_name: string | null
  ward_name: string | null
  department_name: string | null
  phone: string | null
  status: string | null
  diagnosis: string | null
  finalBill?: {
    total_bill_amount: number | null
    paid_amount: number | null
    discount_amount?: number | null
    final_bill_amount?: number | null
    due_amount: number | null
  } | null
}

function DischargeSummaryPrint() {
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
    queryKey: ['print-patient-discharge-summary', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/admission?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch discharge data')
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
    const paidCount = flatItems.filter((r: any) => {
      const due = r.finalBill?.due_amount ?? r.due_amount ?? 0;
      return Number(due) <= 0;
    }).length
    const dueCount = flatItems.filter((r: any) => {
      const due = r.finalBill?.due_amount ?? r.due_amount ?? 0;
      return Number(due) > 0;
    }).length
    const totalRevenue = flatItems.reduce((sum: number, r: any) => {
      const total = r.finalBill?.total_bill_amount ?? r.total_bill_amount ?? 0;
      return sum + Number(total);
    }, 0)
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: companySettings?.stat_total_discharged || 'Total Discharged', value: totalFromMeta },
      { label: companySettings?.stat_fully_paid || 'Fully Paid', value: paidCount },
      { label: companySettings?.stat_with_due || 'With Due Amount', value: dueCount },
      { label: (companySettings?.stat_total_revenue || `Total Revenue (${currencySymbol})`), value: totalRevenue.toLocaleString() },
      { label: companySettings?.stat_records_period || 'Records in Period', value: flatItems.length },
    ]
  }, [flatItems, data, currencySymbol, companySettings])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Hospital';

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
          /* Avoid breaking rows across pages */
          tr, td, th {
            page-break-inside: avoid;
          }
          .border { border-color: oklch(0.929 0.013 255.508); }
          .border-dashed { border-color: oklch(0.929 0.013 255.508); }
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
        {companySettings?.report_title || 'DISCHARGE SUMMARY REPORT'}
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">{companySettings?.report_subtitle || 'Discharged patient summary with billing information'}</p>

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
      <table className="w-full text-xs mt-2">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-1.5 py-1 text-left text-[10px] w-[3%]">#</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[7%]">Adm. No</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[12%]">Patient Name</th>
            <th className="px-1.5 py-1 text-center text-[10px] w-[4%]">Age</th>
            <th className="px-1.5 py-1 text-center text-[10px] w-[5%]">Gender</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[8%]">Admission Date</th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[8%]">Discharge Date</th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[7%]">
              {companySettings?.column_total_bill || `Total Bill (${currencySymbol})`}
            </th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[7%]">
              {companySettings?.column_discount || `Discount (${currencySymbol})`}
            </th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[7%]">
              {companySettings?.column_final_bill || `Final Bill (${currencySymbol})`}
            </th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[7%]">
              {companySettings?.column_amount_paid || `Paid (${currencySymbol})`}
            </th>
            <th className="px-1.5 py-1 text-right text-[10px] w-[7%]">
              {companySettings?.column_due_amount || `Due (${currencySymbol})`}
            </th>
            <th className="px-1.5 py-1 text-left text-[10px] w-[10%]">Doctor</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: DischargeItem, idx: number) => {
            // Calculate values with fallback logic
            const totalBill = item.finalBill?.total_bill_amount ?? item.total_bill_amount ?? 0;
            const discount = item.finalBill?.discount_amount ?? item.discount_amount ?? 0;
            const finalBill = item.finalBill?.final_bill_amount ?? item.final_bill_amount ?? 0;
            const paid = item.finalBill?.paid_amount ?? item.paid_amount ?? item.advance_payment ?? 0;
            const due = item.finalBill?.due_amount ?? item.due_amount ?? 0;

            // Calculate missing values
            const calculatedFinalBill = totalBill - discount;
            const calculatedDue = finalBill > 0 ? (finalBill - paid) : (calculatedFinalBill - paid);
            const finalDue = (due === 0 && calculatedDue > 0) ? calculatedDue : due;
            const finalAmount = (finalBill === 0 && calculatedFinalBill > 0) ? calculatedFinalBill : finalBill;

            return (
              <tr key={item.id || idx} className="border-b border-dashed">
                <td className="px-1.5 py-1 text-[10px] text-gray-500">{idx + 1}</td>
                <td className="px-1.5 py-1 text-[10px] font-mono">{item.admission_prefix || `ADM-${String(item.id).padStart(4, '0')}`}</td>
                <td className="px-1.5 py-1 text-[10px] font-medium">{item.patient_name || '-'}</td>
                <td className="px-1.5 py-1 text-[10px] text-center">{item.age ? `${item.age} yrs` : '-'}</td>
                <td className="px-1.5 py-1 text-[10px] text-center capitalize">{item.sex || '-'}</td>
                <td className="px-1.5 py-1 text-[10px]">{item.admission_date ? safeFormatDate(item.admission_date) : '-'}</td>
                <td className="px-1.5 py-1 text-[10px]">{item.discharge_date ? safeFormatDate(item.discharge_date) : '-'}</td>
                <td className="px-1.5 py-1 text-[10px] text-right font-semibold text-blue-600">
                  {Number(totalBill).toLocaleString()}
                </td>
                <td className="px-1.5 py-1 text-[10px] text-right font-semibold text-orange-600">
                  {Number(discount).toLocaleString()}
                </td>
                <td className="px-1.5 py-1 text-[10px] text-right font-semibold text-purple-600">
                  {Number(finalAmount).toLocaleString()}
                </td>
                <td className="px-1.5 py-1 text-[10px] text-right font-semibold text-green-600">
                  {Number(paid).toLocaleString()}
                </td>
                <td className={`px-1.5 py-1 text-[10px] text-right font-semibold ${Number(finalDue) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Number(finalDue).toLocaleString()}
                </td>
                <td className="px-1.5 py-1 text-[10px]">{item.doctor?.doctor_name || item.doctor_name || '-'}</td>
              </tr>
            );
          })}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={13} className="px-2 py-4 text-center text-gray-500">
                No discharge records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>{companySettings?.label_total_records || 'Total Records:'}</strong> {flatItems.length}
          </div>
          <div className="text-right">
            <strong>{companySettings?.label_generated || 'Generated:'}</strong> {safeFormatDate(new Date())}
          </div>
        </div>
      </div>

      {/* ── Signature Row ───────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mt-6 text-xs">
        <div className="text-left">
          <p className="border-t border-dashed w-40 pt-1">{companySettings?.signature_prepared || 'Prepared By:'}</p>
        </div>
        <div className="text-right">
          <p className="border-t border-dashed w-48 pt-1">{companySettings?.signature_authority || 'Authority Signature:'}</p>
        </div>
      </div>
    </div>
  )
}
