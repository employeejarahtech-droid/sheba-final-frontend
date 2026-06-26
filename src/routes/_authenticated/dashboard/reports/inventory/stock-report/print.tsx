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

export const Route = createFileRoute('/_authenticated/dashboard/reports/inventory/stock-report/print')({
  validateSearch: searchSchema,
  component: StockReportPrint,
})

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6']

interface StockItem {
  id: number
  asset_code: string
  name: string
  category: string
  location: string
  condition: string
  purchase_cost: number
  status: string
}

function StockReportPrint() {
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
    queryKey: ['print-stock', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/assets?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch assets')
      const json = await res.json()
      const rows = json?.data?.rows || []
      const items: StockItem[] = rows.map((r: any) => ({
        id: r.id, asset_code: r.asset_code, name: r.name,
        category: r.category?.name || '-', location: r.location?.name || '-',
        condition: r.condition, purchase_cost: Number(r.purchase_cost || 0), status: r.status,
      }))
      return { items, total: json?.data?.total || items.length }
    },
    enabled: !!token,
  })

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/company-settings`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch company settings')
      return (await res.json()).data
    },
    enabled: !!token,
  })

  const items: StockItem[] = useMemo(() => data?.items ?? [], [data])

  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === 'active').length
    const inRepair = items.filter((i) => i.status === 'in_repair').length
    const retired = items.filter((i) => i.status === 'retired' || i.status === 'disposed').length
    const totalValue = items.reduce((s, i) => s + Number(i.purchase_cost || 0), 0)
    return [
      { label: 'Total Assets', value: data?.total ?? items.length, color: COLORS[0] },
      { label: 'Active', value: active, color: COLORS[1] },
      { label: 'In Repair', value: inRepair, color: COLORS[2] },
      { label: 'Retired / Disposed', value: retired, color: COLORS[3] },
      { label: 'Records', value: items.length, color: COLORS[4] },
      { label: `Value ${currencySymbol}`, value: totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }), color: COLORS[5] },
    ]
  }, [items, data, currencySymbol])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null
  const companyName = companySettings?.company_name || 'Sheba Hospital'

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="invoice-print-area max-w-6xl mx-auto w-full p-8 bg-white mt-10 print:mt-0 shadow-sm print:shadow-none border border-slate-100 print:border-none rounded-lg print:rounded-none">
      <style>{`
        .bg-row-blue { background-color: #cfd2d8ff !important; }
        @media print {
          .bg-row-blue { background-color: #cfd2d8ff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          @page { size: A4 landscape; margin: 12mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .print\\:hidden { display: none !important; }
          .invoice-print-area { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
          .invoice-print-area table { width: 100% !important; }
          tr, td, th { page-break-inside: avoid; }
        }
      `}</style>

      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-center items-center gap-8">
          {companyLogo ? <img src={companyLogo} alt="Company Logo" className="w-24 h-24 object-contain" /> : null}
          <div className="text-center">
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <p className="text-sm mt-1 leading-5">{[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}</p>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center underline mb-4 tracking-wide uppercase">STOCK REPORT</h1>
      <p className="text-center text-sm text-gray-600 mb-6">Asset register stock levels & valuation</p>

      {(start_date || end_date || search) && (
        <div className="mb-4 p-3 bg-gray-50 rounded border text-sm">
          <div className="grid grid-cols-3 gap-4">
            {start_date && <div><strong>From:</strong> {safeFormatDate(start_date)}</div>}
            {end_date && <div><strong>To:</strong> {safeFormatDate(end_date)}</div>}
            {search && <div><strong>Search:</strong> {search}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-3 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="p-3 rounded border text-center" style={{ borderTop: `4px solid ${stat.color}` }}>
            <div className="text-xs text-gray-600 uppercase">{stat.label}</div>
            <div className="text-xl font-bold mt-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
          </div>
        ))}
      </div>

      <table className="w-full text-sm mt-4">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-2 py-1 text-left text-xs w-[4%]">#</th>
            <th className="px-2 py-1 text-left text-xs w-[12%]">Asset Code</th>
            <th className="px-2 py-1 text-left text-xs w-[22%]">Asset Name</th>
            <th className="px-2 py-1 text-left text-xs w-[14%]">Category</th>
            <th className="px-2 py-1 text-left text-xs w-[14%]">Location</th>
            <th className="px-2 py-1 text-left text-xs w-[10%]">Condition</th>
            <th className="px-2 py-1 text-right text-xs w-[12%]">Cost ({currencySymbol})</th>
            <th className="px-2 py-1 text-center text-xs w-[12%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>
              <td className="px-2 py-1 text-xs font-mono">{item.asset_code}</td>
              <td className="px-2 py-1 text-xs font-medium">{item.name || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.category || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.location || '-'}</td>
              <td className="px-2 py-1 text-xs capitalize">{item.condition || '-'}</td>
              <td className="px-2 py-1 text-xs text-right font-semibold font-mono text-emerald-700">{Number(item.purchase_cost || 0).toFixed(2)}</td>
              <td className="px-2 py-1 text-xs text-center capitalize">{String(item.status || '-').replace('_', ' ')}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={8} className="px-2 py-8 text-center text-gray-500">No asset records found for the selected criteria</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 pt-4 border-t text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Total Records:</strong> {items.length}</div>
          <div className="text-right"><strong>Generated:</strong> {safeFormatDate(new Date())}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 mt-16 text-sm">
        <div><p className="border-t border-dashed w-40 pt-1 text-center">Prepared By:</p></div>
        <div className="text-right"><p className="border-t border-dashed w-56 ml-auto pt-1">Authority Signature:</p></div>
      </div>
    </div>
  )
}
