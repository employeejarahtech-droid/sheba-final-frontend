import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Package, CheckCircle2, AlertTriangle, XCircle, DollarSign } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/inventory/stock-report/print')({
  validateSearch: searchSchema,
  component: StockReportPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface StockItem {
  id: number
  name: string
  category: string | null
  quantity: number
  unit: string | null
  unit_price: number
  total_value: number
  status: string
}

function StockReportPrint() {
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
    queryKey: ['print-inventory-stock-report', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/inventory/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const res2 = await fetch(`${API_URL}/api/products?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res2.ok) throw new Error('Failed to fetch products')
        return res2.json()
      }
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
    const inStock = flatItems.filter((r: any) => r.status === 'in-stock' || r.status === 'available').length
    const lowStock = flatItems.filter((r: any) => r.status === 'low-stock').length
    const outOfStock = flatItems.filter((r: any) => r.status === 'out-of-stock').length
    const totalValue = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_value) || 0), 0)
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: 'Total Products', value: totalFromMeta },
      { label: 'In Stock', value: inStock },
      { label: 'Low Stock', value: lowStock },
      { label: 'Out of Stock', value: outOfStock },
      { label: 'Total Value', value: `৳${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
      { label: 'Records', value: flatItems.length },
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
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading stock data...</span>
      </div>
    )
  }

  const formatStatus = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'in-stock' || s === 'available') return 'In Stock'
    if (s === 'low-stock') return 'Low Stock'
    if (s === 'out-of-stock') return 'Out of Stock'
    return status || '-'
  }

  const getStatusClass = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'in-stock' || s === 'available') return 'bg-emerald-100 text-emerald-700'
    if (s === 'low-stock') return 'bg-orange-100 text-orange-700'
    if (s === 'out-of-stock') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
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
        INVENTORY STOCK REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Current stock levels and valuation across all products</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(start_date || end_date || search) && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-3 gap-2">
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

      {/* ── STOCK STATUS OVERVIEW ──────────────────────────────────────────────── */}
      <div className="mb-3 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs flex items-center justify-center gap-1">
            <Package className="w-3 h-3" /> STOCK STATUS OVERVIEW
          </h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-around text-sm font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-gray-600">In Stock</div>
                <div className="text-lg text-emerald-700">{flatItems.filter((r: any) => r.status === 'in-stock' || r.status === 'available').length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-[10px] text-gray-600">Low Stock</div>
                <div className="text-lg text-orange-700">{flatItems.filter((r: any) => r.status === 'low-stock').length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-[10px] text-gray-600">Out of Stock</div>
                <div className="text-lg text-red-700">{flatItems.filter((r: any) => r.status === 'out-of-stock').length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-gray-600">Total Value</div>
                <div className="text-lg text-blue-700">৳{flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_value) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-4">
        <thead>
          <tr className="bg-row-blue">
            <th className="border px-2 py-1 text-left text-[10px] w-[3%]">#</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[25%]">Product Name</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[12%]">Category</th>
            <th className="border px-2 py-1 text-center text-[10px] w-[8%]">Quantity</th>
            <th className="border px-2 py-1 text-center text-[10px] w-[6%]">Unit</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[10%]">Unit Price</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[12%]">Total Value</th>
            <th className="border px-2 py-1 text-center text-[10px] w-[10%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: StockItem, idx: number) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="border px-2 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="border px-2 py-1 text-[10px] font-medium">{item.name || '-'}</td>
              <td className="border px-2 py-1 text-[10px]">{item.category || '-'}</td>
              <td className="border px-2 py-1 text-center text-[10px] font-semibold">{Number(item.quantity || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-center text-[10px]">{item.unit || '-'}</td>
              <td className="border px-2 py-1 text-right font-mono text-[10px]">৳{Number(item.unit_price || 0).toFixed(2)}</td>
              <td className="border px-2 py-1 text-right font-mono font-semibold text-blue-700 text-[10px]">৳{Number(item.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="border px-2 py-1 text-center text-[10px]">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize ${getStatusClass(item.status)}`}>
                  {formatStatus(item.status)}
                </span>
              </td>
            </tr>
          ))}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={8} className="border px-2 py-8 text-center text-gray-500 text-[10px]">
                No stock records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Records:</strong> {flatItems.length}
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
