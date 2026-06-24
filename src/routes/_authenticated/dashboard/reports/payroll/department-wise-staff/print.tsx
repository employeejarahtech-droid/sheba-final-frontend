import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Users, Building2, Briefcase, CheckCircle2, UserCheck } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/payroll/department-wise-staff/print')({
  validateSearch: searchSchema,
  component: DepartmentWiseStaffPrint,
})

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface StaffItem {
  id: number
  name: string
  email: string
  role: string
  department: string
  department_name: string
  status: string
  created_at: string
}

function DepartmentWiseStaffPrint() {
  const { search, from, to } = Route.useSearch()
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
    queryKey: ['dept-wise-staff-print', search, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: search ?? '' })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${API_URL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch staff')
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

  const items = useMemo(() => data?.data?.items ?? data?.data ?? [], [data])

  const stats = useMemo(() => {
    const active = items.filter((r: any) => r.status === 'active' || r.status === 'Active').length
    const depts = new Set(items.map((r: any) => r.department || r.department_name).filter(Boolean))
    const avgPerDept = depts.size > 0 ? Math.round(items.length / depts.size) : 0
    const totalFromMeta = data?.data?.meta?.total ?? items.length

    return [
      { label: 'Total Staff', value: totalFromMeta },
      { label: 'Active Staff', value: active },
      { label: 'Departments', value: depts.size },
      { label: 'Avg per Dept', value: avgPerDept },
    ]
  }, [items, data])

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
        <span className="text-gray-600">Loading staff data...</span>
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
        DEPARTMENT-WISE STAFF REPORT
      </h1>
      <p className="text-center text-xs text-gray-600 mb-2">Staff distribution across departments</p>

      {/* ── Filter Period ───────────────────────────────────────────────── */}
      {(from || to || search) && (
        <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-3 gap-2">
            {from && (
              <div><strong>From:</strong> {safeFormatDate(from)}</div>
            )}
            {to && (
              <div><strong>To:</strong> {safeFormatDate(to)}</div>
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

      {/* ── STAFF OVERVIEW ──────────────────────────────────────────────────── */}
      <div className="mb-3 border border-gray-300">
        <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
          <h2 className="font-bold text-gray-700 text-center text-xs flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> STAFF OVERVIEW
          </h2>
        </div>
        <div className="px-2 py-2">
          <div className="flex items-center justify-around text-sm font-bold">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-gray-600">Total Staff</div>
                <div className="text-lg text-blue-700">{items.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-gray-600">Active Staff</div>
                <div className="text-lg text-emerald-700">{items.filter((r: any) => r.status === 'active' || r.status === 'Active').length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-[10px] text-gray-600">Departments</div>
                <div className="text-lg text-purple-700">{new Set(items.map((r: any) => r.department || r.department_name).filter(Boolean)).size}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-[10px] text-gray-600">Avg per Dept</div>
                <div className="text-lg text-orange-700">
                  {(() => {
                    const depts = new Set(items.map((r: any) => r.department || r.department_name).filter(Boolean))
                    return depts.size > 0 ? Math.round(items.length / depts.size) : 0
                  })()}
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
            <th className="border px-2 py-1 text-left text-[10px] w-[5%]">#</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[20%]">Name</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[20%]">Email</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[12%]">Role</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[15%]">Department</th>
            <th className="border px-2 py-1 text-center text-[10px] w-[10%]">Status</th>
            <th className="border px-2 py-1 text-left text-[10px] w-[12%]">Joined Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: StaffItem, idx: number) => {
            const isActive = item.status === 'active' || item.status === 'Active'
            const statusClass = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'

            return (
              <tr key={item.id || idx} className="border-b border-dashed">
                <td className="border px-2 py-1 text-[10px] text-gray-500">{idx + 1}</td>
                <td className="border px-2 py-1 text-[10px] font-medium">{item.name || '-'}</td>
                <td className="border px-2 py-1 text-[10px] font-mono text-[9px]">{item.email || '-'}</td>
                <td className="border px-2 py-1 text-[10px]">{item.role || '-'}</td>
                <td className="border px-2 py-1 text-[10px]">{item.department || item.department_name || '-'}</td>
                <td className="border px-2 py-1 text-center text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize ${statusClass}`}>
                    {item.status || '-'}
                  </span>
                </td>
                <td className="border px-2 py-1 text-[10px]">{item.created_at ? safeFormatDate(item.created_at) : '-'}</td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="border px-2 py-8 text-center text-gray-500 text-[10px]">
                No staff records found for the selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Records:</strong> {items.length}
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
