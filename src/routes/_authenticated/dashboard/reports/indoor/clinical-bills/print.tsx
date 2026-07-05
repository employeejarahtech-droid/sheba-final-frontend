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
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/indoor/clinical-bills/print')({
  validateSearch: searchSchema,
  component: ClinicalBillsPrint,
})

interface ClinicalBillItem {
  id: number
  admission_id: number
  service_name: string
  provider_id: number | null
  bill_amount: string
  less_amount: string
  final_bill: string
  payable_now: string
  paid_now: string | null
  payable_created_date: string | null
  due_amount: string
  payment_status: 'pending' | 'partial' | 'paid' | null
  notes: string | null
  doctor?: { id: number; doctor_name: string; speciality: string } | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

function ClinicalBillsPrint() {
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

  const { data, isLoading } = useQuery<{
    status: boolean
    data: { items: ClinicalBillItem[]; meta: Meta }
    summary: {
      totalPayable: number
      totalDue: number
      totalFinalBill: number
      paidCount: number
      unpaidCount: number
    }
  }>({
    queryKey: ['print-clinical-bills', search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${API_URL}/api/bill-distribution/final/clinical-service?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch clinical bills data')
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

  const items = data?.data?.items ?? []
  const meta = data?.data?.meta
  const summary = data?.summary ?? { totalPayable: 0, totalDue: 0, totalFinalBill: 0, paidCount: 0, unpaidCount: 0 }

  // Helper functions
  const num = (v: string | number | null | undefined) => Number(v || 0)
  const paidAmount = (r: ClinicalBillItem) => Math.max(num(r.payable_now) - num(r.due_amount), 0)
  const serviceName = (r: ClinicalBillItem) => r.service_name || 'Unspecified'

  // Service-wise analysis
  const serviceRows = useMemo(() => {
    const map = new Map<
      string,
      { service: string; count: number; finalBill: number; payable: number; paid: number; due: number }
    >()
    for (const r of items) {
      const key = serviceName(r)
      const cur =
        map.get(key) ||
        { service: key, count: 0, finalBill: 0, payable: 0, paid: 0, due: 0 }
      cur.count += 1
      cur.finalBill += num(r.final_bill)
      cur.payable += num(r.payable_now)
      cur.paid += paidAmount(r)
      cur.due += num(r.due_amount)
      map.set(key, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.payable - a.payable)
  }, [items])

  const stats = useMemo(() => {
    return [
      { label: 'Total Records', value: meta?.total ?? 0 },
      { label: 'Total Final Bill', value: `${currencySymbol}${num(summary.totalFinalBill).toLocaleString()}` },
      { label: 'Total Payable', value: `${currencySymbol}${num(summary.totalPayable).toLocaleString()}` },
      { label: 'Total Due', value: `${currencySymbol}${num(summary.totalDue).toLocaleString()}` },
      { label: 'Paid', value: summary.paidCount },
      { label: 'Pending', value: summary.unpaidCount },
    ]
  }, [meta, summary, currencySymbol])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading clinical bills data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-8 bg-white">
      <style>{`
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
          .max-w-6xl {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .mb-6 {
            margin-bottom: 1rem !important;
          }
          .mb-3 {
            margin-bottom: 0.75rem !important;
          }
          .mb-4 {
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
          .bg-gray-50 {
            padding: 0.25rem 0.5rem !important;
          }
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
        CLINICAL BILLS REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Clinical service-wise analysis of indoor clinical service distributions</p>

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
              <span className="font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-2" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-t border-b" style={{ backgroundColor: '#f0f9ff' }}>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '30%' }}>Clinical Service</th>
            <th className="px-1.5 py-1 text-center text-[10px]" style={{ width: '10%' }}>Bills</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '15%' }}>Final Bill ({currencySymbol})</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '15%' }}>Payable ({currencySymbol})</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '15%' }}>Paid ({currencySymbol})</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: '15%' }}>Due ({currencySymbol})</th>
          </tr>
        </thead>
        <tbody>
          {serviceRows.map((row, idx) => (
            <tr key={idx} className="border-b border-dashed">
              <td className="px-1.5 py-1 text-[10px] font-medium">{row.service}</td>
              <td className="px-1.5 py-1 text-[10px] text-center font-mono">{row.count}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{num(row.finalBill).toLocaleString()}</td>
              <td className="px-1.5 py-1 text-[10px] text-right font-bold">{num(row.payable).toLocaleString()}</td>
              <td className="px-1.5 py-1 text-[10px] text-right text-green-600">{num(row.paid).toLocaleString()}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{num(row.due).toLocaleString()}</td>
            </tr>
          ))}
          {serviceRows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-2 py-4 text-center text-gray-500" style={{ color: '#6b7280 !important' }}>
                <div className="font-semibold text-xs">No clinical bills records found for the selected criteria</div>
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
            <strong>Total Services:</strong> {serviceRows.length}
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
