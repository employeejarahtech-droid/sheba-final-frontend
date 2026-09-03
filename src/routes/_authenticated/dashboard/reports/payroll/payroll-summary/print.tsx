import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Calendar, Wallet, DollarSign, TrendingUp, Users } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/payroll/payroll-summary/print')({
  validateSearch: searchSchema,
  component: PayrollSummaryPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface PayrollItem {
  month: string
  staff_paid: number
  total_basic: number
  total_allowances: number
  total_deductions: number
  total_net_payout: number
}

function PayrollSummaryPrint() {
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
    queryKey: ['print-payroll-summary', search, start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/reports/hr/payroll?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch payroll data')
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
    const totalMonths = flatItems.length
    const totalStaffPaid = flatItems.reduce((sum: number, r: any) => sum + (Number(r.staff_paid) || 0), 0)
    const annualBasic = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_basic) || 0), 0)
    const annualAllowances = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_allowances) || 0), 0)
    const annualDeductions = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_deductions) || 0), 0)
    const annualNet = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_net_payout) || 0), 0)
    const avgMonthlyNet = totalMonths > 0 ? Math.round(annualNet / totalMonths) : 0

    return [
      { label: 'Total Months', value: totalMonths },
      { label: 'Staff Paid', value: totalStaffPaid },
      { label: 'Annual Basic', value: `৳${annualBasic.toLocaleString()}` },
      { label: 'Annual Net', value: `৳${annualNet.toLocaleString()}` },
      { label: 'Avg Monthly Net', value: `৳${avgMonthlyNet.toLocaleString()}` },
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
        <span className="text-gray-600">Loading payroll data...</span>
      </div>
    )
  }

  const totalStaffPaid = flatItems.reduce((sum: number, r: any) => sum + (Number(r.staff_paid) || 0), 0)
  const totalBasic = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_basic) || 0), 0)
  const totalAllowances = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_allowances) || 0), 0)
  const totalDeductions = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_deductions) || 0), 0)
  const totalNet = flatItems.reduce((sum: number, r: any) => sum + (Number(r.total_net_payout) || 0), 0)

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
          <h2 className="text-lg font-bold tracking-widest uppercase">Payroll Summary Report</h2>
          <p className="text-xs text-gray-600 mt-1">Annual payroll overview by month</p>
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

      {/* ── PAYROLL OVERVIEW ──────────────────────────────────────────────────── */}
      <div className="mb-3 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs flex items-center justify-center gap-1">
            <Wallet className="w-3 h-3" /> PAYROLL OVERVIEW
          </h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-around text-sm font-bold">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-gray-600">Total Months</div>
                <div className="text-lg text-blue-700">{flatItems.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-gray-600">Staff Paid</div>
                <div className="text-lg text-emerald-700">{totalStaffPaid.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-[10px] text-gray-600">Annual Net Payout</div>
                <div className="text-lg text-purple-700">৳{totalNet.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-[10px] text-gray-600">Avg Monthly Net</div>
                <div className="text-lg text-orange-700">
                  ৳{flatItems.length > 0 ? Math.round(totalNet / flatItems.length).toLocaleString() : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-4">
        <thead>
          <tr className="bg-row-blue">
            <th className="border px-2 py-1 text-left text-[10px] w-[8%]">#</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[12%]">Month</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[12%]">Staff Paid</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[18%]">Total Basic ৳</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[18%]">Total Allowances ৳</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[18%]">Total Deductions ৳</th>
            <th className="border px-2 py-1 text-right text-[10px] w-[18%]">Net Payout ৳</th>
          </tr>
        </thead>
        <tbody>
          {flatItems.map((item: PayrollItem, idx: number) => (
            <tr key={item.month || idx} className="border-b border-dashed">
              <td className="border px-2 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="border px-2 py-1 text-[10px] font-medium">{item.month || '-'}</td>
              <td className="border px-2 py-1 text-right font-mono text-[10px]">{item.staff_paid?.toLocaleString() || 0}</td>
              <td className="border px-2 py-1 text-right font-mono text-blue-600 text-[10px]">{Number(item.total_basic || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-right font-mono text-emerald-600 text-[10px]">{Number(item.total_allowances || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-right font-mono text-red-600 text-[10px]">{Number(item.total_deductions || 0).toLocaleString()}</td>
              <td className="border px-2 py-1 text-right font-mono font-bold text-purple-700 bg-purple-50 text-[10px]">{Number(item.total_net_payout || 0).toLocaleString()}</td>
            </tr>
          ))}
          {flatItems.length === 0 && (
            <tr>
              <td colSpan={7} className="border px-2 py-8 text-center text-gray-500 text-[10px]">
                No payroll records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 bg-row-blue font-semibold">
            <td className="border px-2 py-2 text-[10px]" colSpan={2}>Total</td>
            <td className="border px-2 py-2 text-right font-mono text-[10px]">{totalStaffPaid.toLocaleString()}</td>
            <td className="border px-2 py-2 text-right font-mono text-blue-600 text-[10px]">{totalBasic.toLocaleString()}</td>
            <td className="border px-2 py-2 text-right font-mono text-emerald-600 text-[10px]">{totalAllowances.toLocaleString()}</td>
            <td className="border px-2 py-2 text-right font-mono text-red-600 text-[10px]">{totalDeductions.toLocaleString()}</td>
            <td className="border px-2 py-2 text-right font-mono font-bold text-purple-700 bg-purple-50 text-[10px]">{totalNet.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Months:</strong> {flatItems.length}
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
