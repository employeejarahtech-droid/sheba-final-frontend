import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Users, DollarSign, Wallet, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/payroll/salary-sheet/print')({
  validateSearch: searchSchema,
  component: SalarySheetPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface SalaryItem {
  id: number
  staff_name: string
  designation: string
  department: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
  payment_date: string | null
}

function SalarySheetPrint() {
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
    queryKey: ['print-salary-sheet', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/payroll?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch salary sheet data')
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
      })
      if (!res.ok) throw new Error("Failed to fetch company settings")
      const result = await res.json()
      return result.data
    },
    enabled: !!token,
  })

  const items = useMemo(() => data?.data?.items ?? [], [data?.data?.items])
  const flatItems = items.length > 0 && Array.isArray(items[0]) ? items[0] : items

  const stats = useMemo(() => {
    const totalStaff = flatItems.length
    const totalBasic = flatItems.reduce((sum: number, r: any) => sum + (Number(r.basic_salary) || 0), 0)
    const totalNet = flatItems.reduce((sum: number, r: any) => sum + (Number(r.net_salary) || 0), 0)
    const totalDeductions = flatItems.reduce((sum: number, r: any) => sum + (Number(r.deductions) || 0), 0)
    const paidCount = flatItems.filter((r: any) => r.status?.toLowerCase() === 'paid').length
    const pendingCount = flatItems.filter((r: any) => r.status?.toLowerCase() === 'pending').length
    const totalFromMeta = data?.data?.meta?.total ?? flatItems.length

    return [
      { label: 'Total Staff', value: totalFromMeta },
      { label: 'Total Basic', value: `৳${totalBasic.toLocaleString()}` },
      { label: 'Total Net Payout', value: `৳${totalNet.toLocaleString()}` },
      { label: 'Total Deductions', value: `৳${totalDeductions.toLocaleString()}` },
      { label: 'Paid Staff', value: paidCount },
      { label: 'Pending Staff', value: pendingCount },
    ]
  }, [flatItems, data])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null
  const companyName = companySettings?.company_name || 'Sheba Hospital'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-gray-600">Loading salary sheet data...</span>
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
          <h2 className="text-lg font-bold tracking-widest uppercase">Salary Sheet Report</h2>
          <p className="text-xs text-gray-600 mt-1">Monthly staff salary breakdown with payment status</p>
          <p className="text-xs mt-1 leading-4">Generated: {safeFormatDate(new Date())}</p>
        </div>
      </div>

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

      {/* ── PAYMENT STATUS SUMMARY ──────────────────────────────────────────────── */}
      <div className="mb-3 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> PAYMENT STATUS SUMMARY
          </h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-around text-sm font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-gray-600">Paid Staff</div>
                <div className="text-lg text-emerald-700">{flatItems.filter((r: any) => r.status?.toLowerCase() === 'paid').length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-[10px] text-gray-600">Pending Staff</div>
                <div className="text-lg text-orange-700">{flatItems.filter((r: any) => r.status?.toLowerCase() === 'pending').length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-gray-600">Total Payout</div>
                <div className="text-lg text-blue-700">৳{flatItems.reduce((sum: number, r: any) => sum + (Number(r.net_salary) || 0), 0).toLocaleString()}</div>
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
            <th className="border px-2 py-1 text-left text-[10px] w-[15%]">Staff Name</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[12%]">Designation</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[12%]">Department</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[10%]">Basic Salary</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[10%]">Allowances</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[10%]">Deductions</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[10%]">Net Salary</th>
            <th className="border px-2 py-1 text-center text-[10px] w-[8%]">Status</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[10%]">Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: SalaryItem, idx: number) => (
            <tr key={item.id || idx} className="border-b border-dashed">
              <td className="border px-2 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="border px-2 py-1 text-[10px] font-medium">{item.staff_name || '-'}</td>
              <td className="border px-2 py-1 text-[10px]">{item.designation || '-'}</td>
              <td className="border px-2 py-1 text-[10px]">{item.department || '-'}</td>
              <td className="border px-2 py-1 text-right font-mono text-[10px]">৳{Number(item.basic_salary || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-right font-mono text-[10px]">৳{Number(item.allowances || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-right font-mono text-[10px]">৳{Number(item.deductions || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-right font-mono font-semibold text-[10px]">৳{Number(item.net_salary || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-center capitalize text-[10px]">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  item.status?.toLowerCase() === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {item.status || '-'}
                </span>
              </td>
              <td className="border px-2 py-1 text-[10px]">{item.payment_date ? safeFormatDate(item.payment_date) : <span className="text-gray-400 italic text-[9px]">Not paid</span>}</td>
            </tr>
          ))}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={10} className="border px-2 py-8 text-center text-gray-500 text-[10px]">
                No salary records found for the selected criteria
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
