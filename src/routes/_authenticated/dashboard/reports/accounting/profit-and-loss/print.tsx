import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/accounting/profit-and-loss/print')({
  validateSearch: searchSchema,
  component: ProfitAndLossPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface AccountItem {
  name: string
  amount: number
}

interface ProfitLossData {
  income: AccountItem[]
  expense: AccountItem[]
  total_income: number
  total_expense: number
  net_profit: number
}

function ProfitAndLossPrint() {
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
    queryKey: ['print-profit-loss', from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
      const res = await fetch(`${API_URL}/api/accounting/profit-loss?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch profit & loss data')
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

  const reportData: ProfitLossData = useMemo(() => data?.data || {
    income: [],
    expense: [],
    total_income: 0,
    total_expense: 0,
    net_profit: 0,
  }, [data])

  const stats = useMemo(() => {
    const incomeCount = reportData.income.length
    const expenseCount = reportData.expense.length
    const netProfit = reportData.net_profit || 0
    const isProfit = netProfit >= 0

    return [
      { label: 'Total Income', value: reportData.total_income, color: COLORS[0] },
      { label: 'Total Expense', value: reportData.total_expense, color: COLORS[1] },
      { label: isProfit ? 'Net Profit' : 'Net Loss', value: Math.abs(netProfit), color: isProfit ? COLORS[5] : COLORS[1] },
      { label: 'Income Heads', value: incomeCount, color: COLORS[2] },
      { label: 'Expense Heads', value: expenseCount, color: COLORS[4] },
      { label: 'Net Margin', value: reportData.total_income > 0 ? ((netProfit / reportData.total_income) * 100).toFixed(1) + '%' : '0%', color: COLORS[3] },
    ]
  }, [reportData])

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
        <span className="text-gray-600">Loading profit & loss data...</span>
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
            margin-bottom: 0.75rem !important;
          }
          .mb-6 {
            margin-bottom: 1rem !important;
          }
          .mb-8 {
            margin-bottom: 1.5rem !important;
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
          .text-6xl {
            font-size: 32px !important;
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
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .gap-6 {
            gap: 1rem !important;
          }
          .border-2 {
            border-width: 1px !important;
          }
          .p-8 {
            padding: 0.5rem !important;
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
          <h2 className="text-lg font-bold tracking-widest uppercase">Profit & Loss Statement</h2>
          <p className="text-xs text-gray-600 mt-1">Financial performance report for the selected period</p>
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
              <span className="font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : stat.value}</span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data Tables ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-0 mb-4">
        {/* INCOME SECTION */}
        <div className="border border-emerald-300 border-r-0">
          <div className="bg-emerald-50 px-2 py-1 border-b border-emerald-200">
            <h2 className="font-bold text-emerald-700 flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" /> INCOME
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-row-blue">
                <th className="border px-2 py-1 text-left text-[10px]">Account</th>
                <th className="border px-2 py-1 text-right text-[10px] w-[100px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.income.map((account, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border px-2 py-1 text-[10px]">{account.name}</td>
                  <td className="border px-2 py-1 text-right font-mono text-[10px]">
                    {Number(account.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold">
                <td className="border px-2 py-1 text-[10px]">Total Income</td>
                <td className="border px-2 py-1 text-right font-mono text-[10px]">
                  {reportData.total_income.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* EXPENSE SECTION */}
        <div className="border border-red-300 border-l-0">
          <div className="bg-red-50 px-2 py-1 border-b border-red-200">
            <h2 className="font-bold text-red-700 flex items-center gap-1 text-xs">
              <TrendingDown className="w-3 h-3" /> EXPENSE
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-row-blue">
                <th className="border px-2 py-1 text-left text-[10px]">Account</th>
                <th className="border px-2 py-1 text-right text-[10px] w-[100px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.expense.map((account, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border px-2 py-1 text-[10px]">{account.name}</td>
                  <td className="border px-2 py-1 text-right font-mono text-[10px]">
                    {Number(account.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-red-50 font-bold">
                <td className="border px-2 py-1 text-[10px]">Total Expense</td>
                <td className="border px-2 py-1 text-right font-mono text-[10px]">
                  {reportData.total_expense.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Net Profit/Loss Summary ──────────────────────────────────────────────── */}
      <div className={`mt-4 border p-3 text-center ${
        reportData.net_profit >= 0 ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'
      }`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${
          reportData.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'
        }`}>
          {reportData.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
        </h3>
        <div className={`text-2xl font-black font-mono ${
          reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {reportData.net_profit >= 0 ? '+' : '-'}{Math.abs(reportData.net_profit).toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <div className="flex justify-center gap-4 font-mono">
            <div>
              <span className="text-emerald-600 font-bold">Income:</span> {reportData.total_income.toFixed(2)}
            </div>
            <div className="text-gray-400">vs</div>
            <div>
              <span className="text-red-600 font-bold">Expense:</span> {reportData.total_expense.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Income Heads:</strong> {reportData.income.length}
          </div>
          <div className="text-right">
            <strong>Total Expense Heads:</strong> {reportData.expense.length}
          </div>
          <div>
            <strong>Generated:</strong> {safeFormatDate(new Date())}
          </div>
          <div className="text-right">
            <strong>Period:</strong> {from ? safeFormatDate(from) : 'All'} to {to ? safeFormatDate(to) : 'Present'}
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
