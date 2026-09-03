import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useChartOfAccountsTree, type AccountTreeNode } from '@/features/accounting/useChartOfAccountsTree'

const API_URL = import.meta.env.VITE_API_URL || ''

const CATEGORY_COLORS: Record<string, string> = {
  Assets: '#3B82F6',
  Liabilities: '#F97316',
  Equity: '#8B5CF6',
  Income: '#10B981',
  Expenses: '#EF4444',
}

export const Route = createFileRoute('/_authenticated/dashboard/accounting/accounts/print')({
  component: ChartOfAccountsPrint,
})

// Flattens the tree into printable rows, preserving level for indentation —
// unlike the interactive page, print always shows every account (no collapse).
function flatten(nodes: AccountTreeNode[], out: AccountTreeNode[] = []): AccountTreeNode[] {
  nodes.forEach((node) => {
    out.push(node)
    if (node.children.length > 0) flatten(node.children, out)
  })
  return out
}

function ChartOfAccountsPrint() {
  const token = getCookie('accessToken')
  const { currencySymbol } = useCurrency()
  const { isFetching, assetsTree, liabilitiesTree, equityTree, incomeTree, expenseTree } = useChartOfAccountsTree()

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/company-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch company settings')
      const result = await res.json()
      return result.data
    },
    enabled: !!token,
  })

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null
  const companyName = companySettings?.company_name || 'Sheba Hospital'
  const companyAddress = [companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ') || 'Dhaka, Bangladesh'

  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const sections: { title: string; roots: AccountTreeNode[] }[] = [
    { title: 'Assets', roots: assetsTree },
    { title: 'Liabilities', roots: liabilitiesTree },
    { title: 'Equity', roots: equityTree },
    { title: 'Income', roots: incomeTree },
    { title: 'Expenses', roots: expenseTree },
  ]

  // Only accounts with an actual (non-zero) balance are printed — zero-balance
  // heads add noise without adding information.
  const isNonZero = (n: number) => Math.abs(n) >= 0.005
  const nonZeroRows = (roots: AccountTreeNode[]) => flatten(roots).filter((r) => isNonZero(r.balance))
  const totalAccounts = sections.reduce((sum, s) => sum + nonZeroRows(s.roots).length, 0)
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading chart of accounts...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-8 bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { margin: 0 !important; padding: 0 !important; background: #fff !important; color: #000 !important; }
          .print\\:hidden { display: none !important; }
          .max-w-6xl { max-width: 100% !important; padding: 1rem !important; }
          table { width: 100% !important; border-collapse: collapse !important; color: #000 !important; margin-top: 0.4rem !important; }
          th, td { padding: 3px 6px !important; border: 1px solid #ddd !important; color: #000 !important; font-size: 9px !important; }
          th { background-color: #f0f9ff !important; color: #000 !important; font-weight: 600 !important; }
          h1, h2, h3, h4, h5, h6, p, span, div { color: #000 !important; }
          .account-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 0.6rem !important; }
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
            <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
          ) : null}
          <div>
            <h1 className="text-xl font-bold">{companyName}</h1>
            <p className="text-xs mt-1 leading-4">{companyAddress}</p>
          </div>
        </div>

        <div className="w-1/2 text-right">
          <h2 className="text-lg font-bold tracking-widest uppercase">Chart of Accounts</h2>
          <p className="text-xs text-gray-600 mt-1">Full account hierarchy with debit / credit / balance</p>
          <p className="text-xs mt-1 leading-4">Generated: {now}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 p-2 bg-gray-50 rounded border text-[10px]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="text-gray-600">Total Accounts:</span> <span className="font-bold">{totalAccounts}</span></span>
          {sections.map((s, i) => (
            <span key={s.title}>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-600">{s.title}:</span>{' '}
              <span className="font-bold">{nonZeroRows(s.roots).length}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Category Sections */}
      {sections.map(({ title, roots }) => {
        // Totals below still sum every root, but a zero-balance row
        // contributes 0 either way, so filtering rows doesn't skew them.
        const rows = nonZeroRows(roots)
        const totalDebit = roots.reduce((sum, r) => sum + r.debit, 0)
        const totalCredit = roots.reduce((sum, r) => sum + r.credit, 0)
        const totalBalance = roots.reduce((sum, r) => sum + r.balance, 0)
        const color = CATEGORY_COLORS[title] || '#64748B'

        return (
          <div key={title} className="account-section mb-4">
            <div className="px-2 py-1 border-b-2" style={{ borderColor: color }}>
              <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color }}>
                {title} <span className="text-[10px] font-normal text-gray-500">({rows.length} account{rows.length !== 1 ? 's' : ''})</span>
              </h3>
            </div>
            {rows.length === 0 ? (
              <p className="text-xs text-gray-400 italic px-2 py-2">No accounts with a non-zero balance in this category.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left w-20">Code</th>
                    <th className="text-left">Account Name</th>
                    <th className="text-right w-24">Debit ({currencySymbol})</th>
                    <th className="text-right w-24">Credit ({currencySymbol})</th>
                    <th className="text-right w-24">Balance ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono text-[9px]">{row.code}</td>
                      <td style={{ paddingLeft: `${6 + row.level * 14}px` }}>
                        <span className={row.level === 0 ? 'font-semibold' : ''}>{row.name}</span>
                        {row.is_active === false && <span className="text-gray-400 italic text-[8px]"> (inactive)</span>}
                      </td>
                      <td className="text-right font-mono">{row.debit > 0 ? fmt(row.debit) : '—'}</td>
                      <td className="text-right font-mono">{row.credit > 0 ? fmt(row.credit) : '—'}</td>
                      <td className="text-right font-mono font-semibold">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold" style={{ backgroundColor: '#f8fafc' }}>
                    <td colSpan={2}>Total {title}</td>
                    <td className="text-right font-mono">{fmt(totalDebit)}</td>
                    <td className="text-right font-mono">{fmt(totalCredit)}</td>
                    <td className="text-right font-mono">{fmt(totalBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )
      })}

      {/* Summary Footer */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div><strong>Total Accounts:</strong> {totalAccounts}</div>
          <div className="text-right"><strong>Generated:</strong> {now}</div>
        </div>
      </div>

      {/* Signature Row */}
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
