import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const API_URL = import.meta.env.VITE_API_URL || ''

const searchSchema = z.object({
  date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/reports/balance-sheet/print')({
  validateSearch: searchSchema,
  component: BalanceSheetPrint,
})

interface BalanceSheetItem {
  id: number
  code: string
  name: string
  amount: number
}

type BalanceSheetSection = { title: string; color: string; items: BalanceSheetItem[]; total: number }

function BalanceSheetPrint() {
  const { date } = Route.useSearch()
  const token = getCookie('accessToken')
  const { formatDate } = useDateFormat()

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

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';
  const companyAddress = [companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ') || 'Dhaka, Bangladesh'
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const totalAssets = data?.data?.total_assets || 0
  const totalLiabilities = data?.data?.total_liabilities || 0
  const totalEquity = data?.data?.total_equity || 0
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

  const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const sections: BalanceSheetSection[] = [
    { title: 'Assets', color: '#10B981', items: data?.data?.assets || [], total: totalAssets },
    { title: 'Liabilities', color: '#EF4444', items: data?.data?.liabilities || [], total: totalLiabilities },
    { title: 'Equity', color: '#3B82F6', items: data?.data?.equity || [], total: totalEquity },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">Loading balance sheet data...</span>
      </div>
    )
  }

  return (
    <>
      <AppHeader fixed className="print:hidden" />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4 mb-4">
          <Link to="/dashboard/accounting/reports/balance-sheet" search={{ date: date || undefined }}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Balance Sheet
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 mt-6 print-report">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm;
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
              .max-w-4xl {
                max-width: 100% !important;
                padding: 1rem !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                color: #000 !important;
                margin-top: 0.4rem !important;
              }
              th, td {
                padding: 3px 6px !important;
                border: 1px solid #ddd !important;
                color: #000 !important;
                font-size: 9px !important;
              }
              th {
                background-color: #f0f9ff !important;
                color: #000 !important;
                font-weight: 600 !important;
              }
              h1, h2, h3, h4, h5, h6, p, span, div {
                color: #000 !important;
              }
              .text-lg { font-size: 12px !important; }
              .text-xl { font-size: 14px !important; }
              .text-sm { font-size: 10px !important; }
              .text-xs { font-size: 9px !important; }
              .section { break-inside: avoid; page-break-inside: avoid; }
            }
          `}</style>

          {/* Header: Logo/Company (left) + Report Title (right) */}
          <div className="mb-2 flex items-start justify-between gap-6">
            <div className="w-1/2 flex items-center gap-4">
              {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
              ) : null}
              <div>
                <h1 className="text-xl font-bold">{companyName}</h1>
                <p className="text-xs mt-1 leading-4">{companyAddress}</p>
              </div>
            </div>
            <div className="w-1/2 text-right">
              <h2 className="text-lg font-bold tracking-widest uppercase">Balance Sheet Report</h2>
              <p className="text-xs text-gray-600 mt-1">As of {date ? safeFormatDate(date) : safeFormatDate(new Date())}</p>
              <p className="text-xs mt-1 leading-4">Generated: {now}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 p-2 bg-gray-50 rounded border text-[10px]">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><span className="text-gray-600">Total Assets:</span> <span className="font-bold">{fmt(totalAssets)}</span></span>
              <span className="mx-1 text-gray-400">|</span>
              <span><span className="text-gray-600">Total Liabilities:</span> <span className="font-bold">{fmt(totalLiabilities)}</span></span>
              <span className="mx-1 text-gray-400">|</span>
              <span><span className="text-gray-600">Total Equity:</span> <span className="font-bold">{fmt(totalEquity)}</span></span>
              <span className="mx-1 text-gray-400">|</span>
              <span><span className="text-gray-600">Status:</span> <span className={`font-bold ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>{isBalanced ? 'BALANCED' : 'DISCREPANCY'}</span></span>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.title} className="section mb-4">
              <div className="px-2 py-1 border-b-2" style={{ borderColor: section.color }}>
                <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: section.color }}>
                  {section.title} <span className="text-[10px] font-normal text-gray-500">({section.items.length} account{section.items.length !== 1 ? 's' : ''})</span>
                </h3>
              </div>
              {section.items.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-2 py-2">No accounts in this category.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left w-20">Code</th>
                      <th className="text-left">Account Name</th>
                      <th className="text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((account) => (
                      <tr key={account.id}>
                        <td className="font-mono">{account.code || '-'}</td>
                        <td>{account.name || '-'}</td>
                        <td className="text-right font-mono">{fmt(account.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold" style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan={2}>Total {section.title}</td>
                      <td className="text-right font-mono">{fmt(section.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          ))}

          {/* Accounting Equation */}
          <div className="section mt-4">
            <div className="px-2 py-1 border-b-2 border-gray-400">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700">Accounting Equation</h3>
            </div>
            <div className="px-2 py-2">
              <div className="flex items-center justify-center gap-4 text-sm font-mono font-bold">
                <span className="text-emerald-700">{fmt(totalAssets)}</span>
                <span className="text-gray-500">=</span>
                <span className="text-slate-700">{fmt(totalLiabilities + totalEquity)}</span>
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

          {/* Summary Footer */}
          <div className="mt-3 pt-2 border-t text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Total Accounts:</strong> {sections.reduce((sum, s) => sum + s.items.length, 0)}</div>
              <div className="text-right"><strong>Generated:</strong> {now}</div>
            </div>
          </div>

          {/* Signature Row */}
          <div className="flex justify-between items-end mt-6 text-xs">
            <div className="text-left">
              <p className="border-t border-dashed w-40 pt-1">Prepared By:</p>
            </div>
            <div className="text-right">
              <p className="border-t border-dashed w-48 pt-1">Authorized Signature:</p>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
