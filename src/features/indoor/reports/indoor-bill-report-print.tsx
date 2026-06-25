import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import type { FinalDistribution, IndoorBillReportConfig } from './indoor-bill-report'

const num = (v: string | number | null | undefined) => Number(v || 0)
const paidAmount = (r: FinalDistribution) => Math.max(num(r.payable_now) - num(r.due_amount), 0)
const providerName = (r: FinalDistribution) => r.doctor?.doctor_name || r.service_name || 'Unspecified'

export function IndoorBillReportPrint({
  config,
  search,
  from,
  to,
  status,
}: {
  config: IndoorBillReportConfig
  search: string
  from: string
  to: string
  status: string
}) {
  const token = getCookie('accessToken')
  const { currencySymbol } = useCurrency()
  const { formatDate } = useDateFormat()
  const API_URL = import.meta.env.VITE_API_URL || ''

  const fmt = (v: string | number | null | undefined) =>
    `${currencySymbol}${num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
    queryKey: ['print-indoor-bill-report', config.endpoint, search, from, to, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999' })
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (status && status !== 'all') params.set('payment_status', status)
      const res = await fetch(
        `${API_URL}/api/bill-distribution/final/${config.endpoint}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error(`Failed to fetch ${config.title} data`)
      return res.json()
    },
    enabled: !!token,
  })

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/company-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch company settings')
      return (await res.json()).data
    },
    enabled: !!token,
  })

  const records: FinalDistribution[] = useMemo(() => data?.data?.items ?? [], [data])
  const summary = data?.summary ?? { totalPayable: 0, totalDue: 0, totalFinalBill: 0, paidCount: 0, unpaidCount: 0 }

  const providerRows = useMemo(() => {
    const map = new Map<
      string,
      { provider: string; speciality: string; count: number; finalBill: number; payable: number; paid: number; due: number }
    >()
    for (const r of records) {
      const key = providerName(r)
      const cur =
        map.get(key) ||
        { provider: key, speciality: r.doctor?.speciality || '', count: 0, finalBill: 0, payable: 0, paid: 0, due: 0 }
      cur.count += 1
      cur.finalBill += num(r.final_bill)
      cur.payable += num(r.payable_now)
      cur.paid += paidAmount(r)
      cur.due += num(r.due_amount)
      map.set(key, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.payable - a.payable)
  }, [records])

  const totals = useMemo(
    () =>
      providerRows.reduce(
        (acc, r) => {
          acc.count += r.count
          acc.finalBill += r.finalBill
          acc.payable += r.payable
          acc.paid += r.paid
          acc.due += r.due
          return acc
        },
        { count: 0, finalBill: 0, payable: 0, paid: 0, due: 0 },
      ),
    [providerRows],
  )

  const companyLogo = companySettings?.company_logo
    ? companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:')
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null
  const companyName = companySettings?.company_name || 'Sheba Hospital'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading {config.title.toLowerCase()} data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-8 bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: #fff !important; color: #000 !important; }
          .print\\:hidden { display: none !important; }
          .max-w-6xl { max-width: 100% !important; padding: 1rem !important; }
          table { width: 100% !important; border-collapse: collapse !important; color: #000 !important; }
          th, td { padding: 4px 6px !important; border: 1px solid #ddd !important; color: #000 !important; font-size: 10px !important; }
          th { background-color: #f0f9ff !important; font-weight: 600 !important; }
          h1, h2, h3, h4, h5, h6, p, span, div { color: #000 !important; }
        }
      `}</style>

      {/* Back & Print */}
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

      {/* Company header */}
      <div className="mb-2">
        <div className="flex justify-center items-center gap-6">
          {companyLogo ? <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" /> : null}
          <div className="text-center">
            <h1 className="text-xl font-bold">{companyName}</h1>
            <p className="text-xs mt-1 leading-4">
              {[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-lg font-bold text-center underline mb-1 tracking-wide uppercase">
        {config.title} Report
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">
        {config.providerLabel}-wise indoor bill distribution analysis
      </p>

      {/* Filter period */}
      {(from || to || search || (status && status !== 'all')) && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-4 gap-2">
            {from && <div><strong>From:</strong> {safeFormatDate(from)}</div>}
            {to && <div><strong>To:</strong> {safeFormatDate(to)}</div>}
            {status && status !== 'all' && <div className="capitalize"><strong>Status:</strong> {status}</div>}
            {search && <div><strong>Search:</strong> {search}</div>}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-3 p-2 bg-gray-50 rounded border text-[10px]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="text-gray-600">Records:</span> <span className="font-bold">{records.length}</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="text-gray-600">Final Bill:</span> <span className="font-bold">{fmt(summary.totalFinalBill)}</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="text-gray-600">Payable:</span> <span className="font-bold">{fmt(summary.totalPayable)}</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="text-gray-600">Due:</span> <span className="font-bold">{fmt(summary.totalDue)}</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="text-gray-600">Paid:</span> <span className="font-bold">{summary.paidCount}</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="text-gray-600">Pending:</span> <span className="font-bold">{summary.unpaidCount}</span></span>
        </div>
      </div>

      {/* Provider-wise table */}
      <table className="w-full text-xs mt-2">
        <thead>
          <tr className="border-t border-b" style={{ backgroundColor: '#f0f9ff' }}>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: '5%' }}>#</th>
            <th className="px-1.5 py-1 text-left text-[10px]">{config.providerLabel}</th>
            <th className="px-1.5 py-1 text-right text-[10px]">Bills</th>
            <th className="px-1.5 py-1 text-right text-[10px]">Final Bill</th>
            <th className="px-1.5 py-1 text-right text-[10px]">Payable</th>
            <th className="px-1.5 py-1 text-right text-[10px]">Paid</th>
            <th className="px-1.5 py-1 text-right text-[10px]">Due</th>
          </tr>
        </thead>
        <tbody>
          {providerRows.map((r, idx) => (
            <tr key={r.provider} className="border-b border-dashed">
              <td className="px-1.5 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="px-1.5 py-1 text-[10px] font-medium">
                {r.provider}
                {r.speciality ? <span className="text-gray-500"> — {r.speciality}</span> : null}
              </td>
              <td className="px-1.5 py-1 text-[10px] text-right">{r.count}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{fmt(r.finalBill)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right font-semibold">{fmt(r.payable)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right" style={{ color: '#10b981' }}>{fmt(r.paid)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right font-semibold" style={{ color: r.due > 0 ? '#dc2626' : '#10b981' }}>{fmt(r.due)}</td>
            </tr>
          ))}
          {providerRows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                <div className="font-semibold text-xs">No {config.title.toLowerCase()} records found for the selected criteria</div>
              </td>
            </tr>
          )}
        </tbody>
        {providerRows.length > 0 && (
          <tfoot>
            <tr className="border-t-2 font-bold" style={{ backgroundColor: '#f8fafc' }}>
              <td className="px-1.5 py-1 text-[10px]" colSpan={2}>Total</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{totals.count}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{fmt(totals.finalBill)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{fmt(totals.payable)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{fmt(totals.paid)}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{fmt(totals.due)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div><strong>{config.providerLabel}s:</strong> {providerRows.length}</div>
          <div className="text-right"><strong>Generated:</strong> {safeFormatDate(new Date())}</div>
        </div>
      </div>

      <div className="flex justify-between items-end mt-6 text-xs">
        <div className="text-left"><p className="border-t border-dashed w-40 pt-1">Prepared By:</p></div>
        <div className="text-right"><p className="border-t border-dashed w-48 pt-1">Authority Signature:</p></div>
      </div>
    </div>
  )
}
