import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Wallet, TrendingUp, ArrowRightLeft, Scale } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/cash-flow/print')({
  validateSearch: searchSchema,
  component: CashFlowPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface CashFlowItem {
  code: string
  name: string
  amount: number
}

interface CashFlowSection {
  items: CashFlowItem[]
  total: number
}

interface CashFlowData {
  operating: CashFlowSection
  investing: CashFlowSection
  financing: CashFlowSection
  opening_cash: number
  closing_cash: number
  net_cash_change: number
}

function CashFlowPrint() {
  const { from, to } = Route.useSearch()
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
    queryKey: ['print-cash-flow', from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
      const res = await fetch(`${API_URL}/api/accounting/cash-flow?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch cash flow data')
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

  const cashFlowData: CashFlowData = useMemo(() => data?.data || {
    operating: { items: [], total: 0 },
    investing: { items: [], total: 0 },
    financing: { items: [], total: 0 },
    opening_cash: 0,
    closing_cash: 0,
    net_cash_change: 0
  }, [data])

  const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const stats = useMemo(() => {
    return [
      { label: 'Opening Cash', value: fmt(cashFlowData.opening_cash) },
      { label: 'Operating Net', value: fmt(cashFlowData.operating?.total || 0) },
      { label: 'Investing Net', value: fmt(cashFlowData.investing?.total || 0) },
      { label: 'Financing Net', value: fmt(cashFlowData.financing?.total || 0) },
      { label: 'Net Cash Change', value: fmt(cashFlowData.net_cash_change) },
      { label: 'Closing Cash', value: fmt(cashFlowData.closing_cash) },
    ]
  }, [cashFlowData])

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
        <span className="text-gray-600">Loading cash flow data...</span>
      </div>
    )
  }

  const isCashPositive = cashFlowData.net_cash_change >= 0

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

      {/* Header: Logo/Company (left) + Report Title (right) */}
      <div className="mb-2 flex items-start justify-between gap-6">
        <div className="w-1/2 flex items-center gap-4">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-24 h-24 object-contain"
            />
          ) : null}

          <div>
            <h1 className="text-xl font-bold">{companyName}</h1>
            {companySettings?.address1 && (
              <p className="text-xs mt-1 leading-4">{companySettings.address1}</p>
            )}
            {companySettings?.address2 && (
              <p className="text-xs leading-4">{companySettings.address2}</p>
            )}
          </div>
        </div>

        <div className="w-1/2 text-right">
          <h2 className="text-lg font-bold tracking-widest uppercase">Cash Flow Statement</h2>
          <p className="text-xs text-gray-600 mt-1">Cash inflows and outflows by Operating, Investing, and Financing activities</p>
          <p className="text-xs mt-1 leading-4">Generated: {safeFormatDate(new Date())}</p>
        </div>
      </div>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(from || to) && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-2 gap-2">
            {from && (
              <div><strong>From:</strong> {safeFormatDate(from)}</div>
            )}
            {to && (
              <div><strong>To:</strong> {safeFormatDate(to)}</div>
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

      {/* ── CASH FLOW VERIFICATION ──────────────────────────────────────────── */}
      <div className="mb-3 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs flex items-center justify-center gap-1">
            <Scale className="w-3 h-3" /> CASH FLOW VERIFICATION
          </h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-center gap-4 text-sm font-mono font-bold">
            <div className="text-emerald-700">{fmt(cashFlowData.opening_cash)}</div>
            <div className="text-gray-600">+</div>
            <div className={cashFlowData.net_cash_change >= 0 ? "text-emerald-700" : "text-red-700"}>
              {fmt(cashFlowData.net_cash_change)}
            </div>
            <div className="text-gray-600">=</div>
            <div className="text-blue-700">{fmt(cashFlowData.closing_cash)}</div>
          </div>
          <div className="mt-2 text-center">
            {Math.abs(cashFlowData.opening_cash + cashFlowData.net_cash_change - cashFlowData.closing_cash) < 0.01 ? (
              <div className="bg-emerald-100 text-emerald-700 py-1 rounded font-bold border border-emerald-300 text-[10px]">
                ✓ CASH FLOW BALANCED
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 py-1 rounded font-bold border border-red-300 text-[10px]">
                ✗ CASH FLOW DISCREPANCY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Report Sections (Two Column) ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-0 mb-3">
        {/* Operating Activities */}
        <div className="border border-emerald-300 border-r-0">
          <div className="bg-emerald-50 px-2 py-1 border-b border-emerald-200">
            <h2 className="font-bold text-emerald-700 flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" /> OPERATING ACTIVITIES
            </h2>
          </div>
          {cashFlowData.operating?.items?.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-row-blue">
                  <th className="border px-2 py-1 text-left text-[10px]">Account</th>
                  <th className="border px-2 py-1 text-right text-[10px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.operating.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="border px-2 py-1 text-[10px]">{item.name}</td>
                    <td className={`border px-2 py-1 text-right font-mono text-[10px] ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 font-bold">
                  <td className="border px-2 py-1 text-[10px]" colSpan={2}>Net Operating Cash</td>
                  <td className={`border px-2 py-1 text-right text-[10px] ${cashFlowData.operating.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(cashFlowData.operating.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-3 text-center text-[10px] text-gray-500">No operating activities</div>
          )}
        </div>

        {/* Investing Activities */}
        <div className="border border-blue-300">
          <div className="bg-blue-50 px-2 py-1 border-b border-blue-200">
            <h2 className="font-bold text-blue-700 flex items-center gap-1 text-xs">
              <Wallet className="w-3 h-3" /> INVESTING ACTIVITIES
            </h2>
          </div>
          {cashFlowData.investing?.items?.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-row-blue">
                  <th className="border px-2 py-1 text-left text-[10px]">Account</th>
                  <th className="border px-2 py-1 text-right text-[10px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.investing.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="border px-2 py-1 text-[10px]">{item.name}</td>
                    <td className={`border px-2 py-1 text-right font-mono text-[10px] ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td className="border px-2 py-1 text-[10px]" colSpan={2}>Net Investing Cash</td>
                  <td className={`border px-2 py-1 text-right text-[10px] ${cashFlowData.investing.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(cashFlowData.investing.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-3 text-center text-[10px] text-gray-500">No investing activities</div>
          )}
        </div>
      </div>

      {/* Financing Activities (Full Width) */}
      <div className="mb-3 border border-purple-300">
        <div className="bg-purple-50 px-2 py-1 border-b border-purple-200">
          <h2 className="font-bold text-purple-700 flex items-center gap-1 text-xs">
            <ArrowRightLeft className="w-3 h-3" /> FINANCING ACTIVITIES
          </h2>
        </div>
        {cashFlowData.financing?.items?.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-row-blue">
                <th className="border px-2 py-1 text-left text-[10px]">Account</th>
                <th className="border px-2 py-1 text-right text-[10px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cashFlowData.financing.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dashed">
                  <td className="border px-2 py-1 text-[10px]">{item.name}</td>
                  <td className={`border px-2 py-1 text-right font-mono text-[10px] ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-purple-50 font-bold">
                <td className="border px-2 py-1 text-[10px]" colSpan={2}>Net Financing Cash</td>
                <td className={`border px-2 py-1 text-right text-[10px] ${cashFlowData.financing.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(cashFlowData.financing.total)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="p-3 text-center text-[10px] text-gray-500">No financing activities</div>
        )}
      </div>

      {/* ── Cash Flow Summary ──────────────────────────────────────────────── */}
      <div className="border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-[10px]">CASH FLOW SUMMARY</h2>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="border px-2 py-1 text-[10px]">Opening Cash Balance</td>
                <td className="border px-2 py-1 text-right text-[10px] font-semibold">{fmt(cashFlowData.opening_cash)}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 text-[10px] pl-4">(+) Operating Activities</td>
                <td className={`border px-2 py-1 text-right text-[10px] font-semibold ${cashFlowData.operating?.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(cashFlowData.operating?.total || 0)}
                </td>
              </tr>
              <tr>
                <td className="border px-2 py-1 text-[10px] pl-4">(+) Investing Activities</td>
                <td className={`border px-2 py-1 text-right text-[10px] font-semibold ${cashFlowData.investing?.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(cashFlowData.investing?.total || 0)}
                </td>
              </tr>
              <tr>
                <td className="border px-2 py-1 text-[10px] pl-4">(+) Financing Activities</td>
                <td className={`border px-2 py-1 text-right text-[10px] font-semibold ${cashFlowData.financing?.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(cashFlowData.financing?.total || 0)}
                </td>
              </tr>
              <tr className="font-bold bg-gray-50">
                <td className="border px-2 py-1 text-[10px]">Net Cash Change</td>
                <td className={`border px-2 py-1 text-right text-[10px] ${cashFlowData.net_cash_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(cashFlowData.net_cash_change)}
                </td>
              </tr>
              <tr className="font-bold">
                <td className="border px-2 py-1 text-[10px] text-purple-700">Closing Cash Balance</td>
                <td className="border px-2 py-1 text-right text-[10px] text-purple-700 font-mono">{fmt(cashFlowData.closing_cash)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Activities:</strong> {
              (cashFlowData.operating?.items?.length || 0) +
              (cashFlowData.investing?.items?.length || 0) +
              (cashFlowData.financing?.items?.length || 0)
            }
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
