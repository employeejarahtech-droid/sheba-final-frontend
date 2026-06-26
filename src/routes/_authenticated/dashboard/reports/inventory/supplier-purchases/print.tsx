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

export const Route = createFileRoute('/_authenticated/dashboard/reports/inventory/supplier-purchases/print')({
  validateSearch: searchSchema,
  component: SupplierPurchasesPrint,
})

const COLORS = ['#10B981', '#3B82F6', '#F97316', '#14B8A6', '#EC4899', '#F59E0B']

interface GrnRow {
  id: number
  grn_no: string
  supplier_name: string
  invoice_no: string
  received_date: string
  total_amount: number
  status: string
}

function SupplierPurchasesPrint() {
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
    queryKey: ['print-supplier-purchases', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/purchase/goods-receipt?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch goods receipts')
      const json = await res.json()
      const rows = json?.data?.rows || []
      const items: GrnRow[] = rows.map((r: any) => ({
        id: r.id, grn_no: r.grn_no, supplier_name: r.supplier?.name || '-',
        invoice_no: r.invoice_no || '-', received_date: r.received_date,
        total_amount: Number(r.total_amount || 0), status: r.status,
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

  const items: GrnRow[] = useMemo(() => data?.items ?? [], [data])

  const stats = useMemo(() => {
    const totalAmount = items.reduce((s, i) => s + Number(i.total_amount || 0), 0)
    const uniqueSuppliers = new Set(items.map((i) => i.supplier_name).filter((n) => n && n !== '-')).size
    const received = items.filter((i) => i.status === 'received').length
    const pending = items.filter((i) => i.status !== 'received').length
    const avg = items.length > 0 ? totalAmount / items.length : 0
    return [
      { label: 'Total GRNs', value: data?.total ?? items.length, color: COLORS[0] },
      { label: `Total Amount ${currencySymbol}`, value: totalAmount.toLocaleString(), color: COLORS[1] },
      { label: 'Unique Suppliers', value: uniqueSuppliers, color: COLORS[2] },
      { label: 'Fully Received', value: received, color: COLORS[3] },
      { label: 'Partial / Pending', value: pending, color: COLORS[4] },
      { label: `Avg ${currencySymbol}`, value: avg.toFixed(2), color: COLORS[5] },
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

      <h1 className="text-2xl font-bold text-center underline mb-4 tracking-wide uppercase">SUPPLIER PURCHASES REPORT</h1>
      <p className="text-center text-sm text-gray-600 mb-6">Goods received from suppliers</p>

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
            <th className="px-2 py-1 text-left text-xs w-[12%]">GRN No</th>
            <th className="px-2 py-1 text-left text-xs w-[24%]">Supplier</th>
            <th className="px-2 py-1 text-left text-xs w-[14%]">Invoice</th>
            <th className="px-2 py-1 text-left text-xs w-[14%]">Received Date</th>
            <th className="px-2 py-1 text-right text-xs w-[16%]">Amount ({currencySymbol})</th>
            <th className="px-2 py-1 text-center text-xs w-[12%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>
              <td className="px-2 py-1 text-xs font-mono">{item.grn_no}</td>
              <td className="px-2 py-1 text-xs font-medium">{item.supplier_name || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.invoice_no || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.received_date ? safeFormatDate(item.received_date) : '-'}</td>
              <td className="px-2 py-1 text-xs text-right font-semibold font-mono text-emerald-700">{Number(item.total_amount || 0).toFixed(2)}</td>
              <td className="px-2 py-1 text-xs text-center capitalize">{item.status || '-'}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={7} className="px-2 py-8 text-center text-gray-500">No goods receipt records found for the selected criteria</td></tr>
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
