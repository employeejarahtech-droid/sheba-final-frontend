import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Scale } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/balance-sheet/print')({
  validateSearch: searchSchema,
  component: BalanceSheetPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface BalanceSheetItem {
  id: number
  code: string
  name: string
  amount: number
  type: 'asset' | 'liability' | 'equity'
}

interface BalanceSheetData {
  assets: BalanceSheetItem[]
  liabilities: BalanceSheetItem[]
  equity: BalanceSheetItem[]
  total_assets: number
  total_liabilities: number
  total_equity: number
}

function BalanceSheetPrint() {
  const { date } = Route.useSearch()
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
    queryKey: ['print-balance-sheet', date],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.set('date', date);

      const res = await fetch(`${API_URL}/api/accounting/reports/balance-sheet?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch balance sheet data')
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

  const balanceSheetData: BalanceSheetData = data?.data || {
    assets: [],
    liabilities: [],
    equity: [],
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
  }

  const stats = useMemo(() => {
    const assetCount = balanceSheetData.assets.length
    const liabilityCount = balanceSheetData.liabilities.length
    const equityCount = balanceSheetData.equity.length
    const isBalanced = Math.abs(balanceSheetData.total_assets - (balanceSheetData.total_liabilities + balanceSheetData.total_equity)) < 0.01

    return [
      { label: 'Total Assets', value: balanceSheetData.total_assets, color: COLORS[0] },
      { label: 'Total Liabilities', value: balanceSheetData.total_liabilities, color: COLORS[1] },
      { label: 'Total Equity', value: balanceSheetData.total_equity, color: COLORS[5] },
      { label: 'Asset Accounts', value: assetCount, color: COLORS[3] },
      { label: 'Liability Accounts', value: liabilityCount, color: COLORS[4] },
      { label: 'Balance Status', value: isBalanced ? 'BALANCED' : 'DISCREPANCY', color: isBalanced ? COLORS[0] : COLORS[1] },
    ]
  }, [balanceSheetData])

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
        <span className="text-gray-600">Loading balance sheet data...</span>
      </div>
    )
  }

  const isBalanced = Math.abs(balanceSheetData.total_assets - (balanceSheetData.total_liabilities + balanceSheetData.total_equity)) < 0.01

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
          .space-y-4 {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.5rem !important;
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
        BALANCE SHEET REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Financial snapshot of assets, liabilities, and equity</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {date && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-1 gap-2">
            <div><strong>As of Date:</strong> {safeFormatDate(date)}</div>
          </div>
        </div>
      )}

      {/* ── Stats Summary ──────────────────────────────────────────────────── */}
      <div className="mb-3 p-2 bg-gray-50 rounded border text-[10px]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {stats.map((stat, index) => (
            <span key={index}>
              <span className="text-gray-600">{stat.label}:</span>{' '}
              <span className="font-bold">
                {typeof stat.value === 'number' && stat.label.includes('Total')
                  ? stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : (typeof stat.value === 'number' ? stat.value : stat.value)
                }
              </span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Balance Sheet Sections ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-0 mb-4">
        {/* ASSETS SECTION */}
        <div className="border border-emerald-300 border-r-0">
          <div className="bg-emerald-50 px-2 py-1 border-b border-emerald-200">
            <h2 className="font-bold text-emerald-700 flex items-center gap-1 text-xs">
              <Scale className="w-3 h-3" /> ASSETS
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-row-blue">
                <th className="border px-2 py-1 text-left text-[10px]">Code</th>
                <th className="border px-2 py-1 text-left text-[10px]">Account Name</th>
                <th className="border px-2 py-1 text-right text-[10px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {balanceSheetData.assets.map((account: BalanceSheetItem, idx: number) => (
                <tr key={account.id || idx} className="border-b border-dashed">
                  <td className="border px-2 py-1 text-[10px] font-mono">{account.code || '-'}</td>
                  <td className="border px-2 py-1 text-[10px] font-medium">{account.name || '-'}</td>
                  <td className="border px-2 py-1 text-[10px] text-right font-mono">
                    {Number(account.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold">
                <td className="border px-2 py-1 text-[10px]" colSpan={2}>Total Assets</td>
                <td className="border px-2 py-1 text-[10px] text-right">{balanceSheetData.total_assets.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LIABILITIES & EQUITY SECTION */}
        <div className="flex flex-col gap-2">
          {/* LIABILITIES */}
          <div className="border border-red-300">
            <div className="bg-red-50 px-2 py-1 border-b border-red-200">
              <h2 className="font-bold text-red-700 flex items-center gap-1 text-xs">
                <Scale className="w-3 h-3 rotate-180" /> LIABILITIES
              </h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-row-blue">
                  <th className="border px-2 py-1 text-left text-[10px]">Code</th>
                  <th className="border px-2 py-1 text-left text-[10px]">Account Name</th>
                  <th className="border px-2 py-1 text-right text-[10px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {balanceSheetData.liabilities.map((account: BalanceSheetItem, idx: number) => (
                  <tr key={account.id || idx} className="border-b border-dashed">
                    <td className="border px-2 py-1 text-[10px] font-mono">{account.code || '-'}</td>
                    <td className="border px-2 py-1 text-[10px] font-medium">{account.name || '-'}</td>
                    <td className="border px-2 py-1 text-[10px] text-right font-mono">
                      {Number(account.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-red-50 font-bold">
                  <td className="border px-2 py-1 text-[10px]" colSpan={2}>Total Liabilities</td>
                  <td className="border px-2 py-1 text-[10px] text-right">{balanceSheetData.total_liabilities.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* EQUITY */}
          <div className="border border-blue-300">
            <div className="bg-blue-50 px-2 py-1 border-b border-blue-200">
              <h2 className="font-bold text-blue-700 flex items-center gap-1 text-xs">
                <Scale className="w-3 h-3" /> EQUITY
              </h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-row-blue">
                  <th className="border px-2 py-1 text-left text-[10px]">Code</th>
                  <th className="border px-2 py-1 text-left text-[10px]">Account Name</th>
                  <th className="border px-2 py-1 text-right text-[10px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {balanceSheetData.equity.map((account: BalanceSheetItem, idx: number) => (
                  <tr key={account.id || idx} className="border-b border-dashed">
                    <td className="border px-2 py-1 text-[10px] font-mono">{account.code || '-'}</td>
                    <td className="border px-2 py-1 text-[10px] font-medium">{account.name || '-'}</td>
                    <td className="border px-2 py-1 text-[10px] text-right font-mono">
                      {Number(account.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td className="border px-2 py-1 text-[10px]" colSpan={2}>Total Equity</td>
                  <td className="border px-2 py-1 text-[10px] text-right">{balanceSheetData.total_equity.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TOTAL LIABILITIES + EQUITY */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
              <h2 className="font-bold text-gray-700 text-[10px]">TOTAL LIABILITIES + EQUITY</h2>
            </div>
            <div className="px-2 py-1 bg-gray-50 flex justify-between font-bold text-xs">
              <span className="text-[10px]">Total</span>
              <span className="font-mono text-[10px]">{(balanceSheetData.total_liabilities + balanceSheetData.total_equity).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACCOUNTING EQUATION VERIFICATION */}
      <div className="mt-4 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs">ACCOUNTING EQUATION VERIFICATION</h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-center gap-4 text-sm font-mono font-bold">
            <div className="text-emerald-700">{balanceSheetData.total_assets.toFixed(2)}</div>
            <div className="text-gray-600">=</div>
            <div className="text-slate-700">{(balanceSheetData.total_liabilities + balanceSheetData.total_equity).toFixed(2)}</div>
          </div>
          <div className="mt-2 text-center">
            {isBalanced ? (
              <div className="bg-emerald-100 text-emerald-700 py-1 rounded font-bold border border-emerald-300 text-[10px]">
                ✓ BALANCE CONFIRMED
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 py-1 rounded font-bold border border-red-300 text-[10px]">
                ✗ DISCREPANCY DETECTED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Accounts:</strong> {balanceSheetData.assets.length + balanceSheetData.liabilities.length + balanceSheetData.equity.length}
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
