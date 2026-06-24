import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/inventory/supplier-purchases/print')({
  validateSearch: searchSchema,
  component: SupplierPurchasesPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface PurchaseItem {
  id: number
  supplier_name: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  purchase_date: string
  status: string
}

function SupplierPurchasesPrint() {
  const { search, start_date, end_date } = Route.useSearch()
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
    queryKey: ['print-supplier-purchases', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/inventory/purchases?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch purchase data')
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
    const totalAmount = flatItems.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
    const uniqueSuppliers = new Set(flatItems.map((i: any) => i.supplier_name).filter(Boolean)).size
    const completedCount = flatItems.filter((r: any) => r.status === 'completed' || r.status === 'Completed' || r.status === 'received').length
    const pendingCount = flatItems.filter((r: any) => r.status !== 'completed' && r.status !== 'Completed' && r.status !== 'received').length
    const avgPurchase = flatItems.length > 0 ? totalAmount / flatItems.length : 0
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: 'Total Purchases', value: totalFromMeta, color: COLORS[0] },
      { label: 'Total Amount ৳', value: `৳${totalAmount.toLocaleString()}`, color: COLORS[1] },
      { label: 'Unique Suppliers', value: uniqueSuppliers, color: COLORS[2] },
      { label: 'Completed', value: completedCount, color: COLORS[3] },
      { label: 'Pending', value: pendingCount, color: COLORS[4] },
      { label: 'Avg Purchase ৳', value: `৳${avgPurchase.toFixed(2)}`, color: COLORS[5] },
    ]
  }, [flatItems, data])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';

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
            margin: 12mm;
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
            padding: 0 !important;
            box-shadow: none !important;
          }
          .invoice-print-area table {
            width: 100% !important;
          }
          /* Avoid breaking rows across pages */
          tr, td, th {
            page-break-inside: avoid;
          }
          .border { border-color: oklch(0.929 0.013 255.508); }
          .border-dashed { border-color: oklch(0.929 0.013 255.508); }
        }
      `}</style>

      {/* Back & Print Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.close()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Close
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className='flex justify-center items-center gap-8'>
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-24 h-24 object-contain"
            />
          ) : null}

          <div className="text-center">
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <p className="text-sm mt-1 leading-5">
              {[companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold text-center underline mb-4 tracking-wide uppercase">
        SUPPLIER PURCHASES REPORT
      </h1>
      <p className="text-center text-sm text-gray-600 mb-6">Complete record of supplier purchases</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(start_date || end_date || search) && (
        <div className="mb-4 p-3 bg-gray-50 rounded border text-sm">
          <div className="grid grid-cols-3 gap-4">
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

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-3 rounded border text-center"
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <div className="text-xs text-gray-600 uppercase">{stat.label}</div>
            <div className="text-xl font-bold mt-1">{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-sm mt-4">
        <thead>
          <tr className="border-t border-b bg-row-blue">
            <th className="px-2 py-1 text-left text-xs w-[3%]">#</th>
            <th className="px-2 py-1 text-left text-xs w-[8%]">Purchase ID</th>
            <th className="px-2 py-1 text-left text-xs w-[18%]">Supplier Name</th>
            <th className="px-2 py-1 text-left text-xs w-[15%]">Product</th>
            <th className="px-2 py-1 text-center text-xs w-[6%]">Qty</th>
            <th className="px-2 py-1 text-right text-xs w-[10%]">Unit Price (৳)</th>
            <th className="px-2 py-1 text-right text-xs w-[10%]">Total Amount (৳)</th>
            <th className="px-2 py-1 text-left text-xs w-[10%]">Purchase Date</th>
            <th className="px-2 py-1 text-center text-xs w-[10%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: PurchaseItem, idx: number) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>
              <td className="px-2 py-1 text-xs font-mono">{item.id || `PUR-${String(item.id).padStart(4, '0')}`}</td>
              <td className="px-2 py-1 text-xs font-medium">{item.supplier_name || '-'}</td>
              <td className="px-2 py-1 text-xs">{item.product_name || '-'}</td>
              <td className="px-2 py-1 text-xs text-center">{Number(item.quantity || 0).toLocaleString()}</td>
              <td className="px-2 py-1 text-xs text-right font-mono">৳{Number(item.unit_price || 0).toFixed(2)}</td>
              <td className="px-2 py-1 text-xs text-right font-semibold font-mono text-emerald-700">৳{Number(item.total_amount || 0).toFixed(2)}</td>
              <td className="px-2 py-1 text-xs">{item.purchase_date ? safeFormatDate(item.purchase_date) : '-'}</td>
              <td className="px-2 py-1 text-xs text-center capitalize">{item.status || '-'}</td>
            </tr>
          ))}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={9} className="px-2 py-8 text-center text-gray-500">
                No purchase records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Total Records:</strong> {flatItems.length}
          </div>
          <div className="text-right">
            <strong>Generated:</strong> {safeFormatDate(new Date())}
          </div>
        </div>
      </div>

      {/* ── Signature Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 mt-16 text-sm">
        <div>
          <p className="border-t border-dashed w-40 pt-1 text-center">Prepared By:</p>
        </div>
        <div className="text-right">
          <p className="border-t border-dashed w-56 ml-auto pt-1">Authority Signature:</p>
        </div>
      </div>
    </div>
  )
}
