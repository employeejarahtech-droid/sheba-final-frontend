import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Building2 } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const searchSchema = z.object({
  search: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/pathology/test-wise-count/print')({
  validateSearch: searchSchema,
  component: TestWiseCountPrint,
})

interface TestMaster {
  id: number
  name: string
  category_id: number
  match_table_name: number
  price: number
  category?: {
    id: number
    name: string
    department_id: number
    department?: {
      id: number
      name: string
    } | null
  }
}

interface InvoiceItem {
  id: number
  tests: string
  status: string
  bill_amount?: number
  collected_amount?: number
  created_at?: string
}

interface TestWithCount {
  id: number
  name: string
  category: string
  department: string
  price: number
  invoiceCount: number
  completedCount: number
  pendingCount: number
  totalAmount: number
  collectedAmount: number
  lastUsed?: string
}

function TestWiseCountPrint() {
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

  // Fetch all tests
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['print-all-tests', search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '99999', search: search || '' })
      const res = await fetch(`${API_URL}/api/tests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch tests')
      return res.json()
    },
    enabled: !!token,
  })

  // Fetch all invoices within date range
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['print-invoices-for-test-count', start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '99999' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/outdoor-invoice?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch invoices')
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

  const tests: TestMaster[] = testsData?.data?.items || []
  const invoices: InvoiceItem[] = invoicesData?.data?.items || []
  const testsMeta = testsData?.data?.meta || { total: 0 }

  // Match tests with invoice counts
  const testsWithCounts = useMemo(() => {
    // Create a map of test name to invoice data
    const invoiceMap = new Map<string, {
      count: number
      completed: number
      pending: number
      totalAmount: number
      collectedAmount: number
      lastUsed: string
    }>()

    for (const invoice of invoices) {
      const testNames = invoice.tests ? invoice.tests.split(',').map(t => t.trim()).filter(Boolean) : []
      const isCompleted = invoice.status === 'Completed' || invoice.status === 'completed'

      for (const testName of testNames) {
        const existing = invoiceMap.get(testName)
        if (existing) {
          existing.count += 1
          existing.completed += isCompleted ? 1 : 0
          existing.pending += isCompleted ? 0 : 1
          existing.totalAmount += Number(invoice.bill_amount || 0)
          existing.collectedAmount += Number(invoice.collected_amount || 0)
          if (invoice.created_at && (!existing.lastUsed || new Date(invoice.created_at) > new Date(existing.lastUsed))) {
            existing.lastUsed = invoice.created_at
          }
        } else {
          invoiceMap.set(testName, {
            count: 1,
            completed: isCompleted ? 1 : 0,
            pending: isCompleted ? 0 : 1,
            totalAmount: Number(invoice.bill_amount || 0),
            collectedAmount: Number(invoice.collected_amount || 0),
            lastUsed: invoice.created_at || '',
          })
        }
      }
    }

    // Combine tests with their invoice counts
    const result: TestWithCount[] = tests.map(test => {
      const stats = invoiceMap.get(test.name) || {
        count: 0,
        completed: 0,
        pending: 0,
        totalAmount: 0,
        collectedAmount: 0,
        lastUsed: '',
      }

      return {
        id: test.id,
        name: test.name,
        category: test.category?.name || 'Uncategorized',
        department: test.category?.department?.name || 'General',
        price: test.price,
        invoiceCount: stats.count,
        completedCount: stats.completed,
        pendingCount: stats.pending,
        totalAmount: stats.totalAmount,
        collectedAmount: stats.collectedAmount,
        lastUsed: stats.lastUsed,
      }
    })

    // Sort by invoice count (descending)
    return result.sort((a, b) => b.invoiceCount - a.invoiceCount)
  }, [tests, invoices])

  const stats = useMemo(() => {
    const totalTests = testsMeta.total
    const totalInvoices = invoices.length
    const testsWithOrders = testsWithCounts.filter(t => t.invoiceCount > 0).length
    const totalTestsOrdered = testsWithCounts.reduce((sum, t) => sum + t.invoiceCount, 0)
    const completedTests = testsWithCounts.reduce((sum, t) => sum + t.completedCount, 0)
    const pendingTests = testsWithCounts.reduce((sum, t) => sum + t.pendingCount, 0)
    const totalRevenue = testsWithCounts.reduce((sum, t) => sum + t.totalAmount, 0)

    return [
      { label: 'Total Tests', value: totalTests },
      { label: 'Tests Ordered', value: testsWithOrders },
      { label: 'Total Orders', value: totalTestsOrdered },
      { label: 'Completed', value: completedTests },
      { label: 'Pending', value: pendingTests },
      { label: 'Total Revenue', value: '৳${totalRevenue.toLocaleString()}' },
    ]
  }, [testsMeta, testsWithCounts, invoices])

  const isLoading = testsLoading || invoicesLoading

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
        <span className="text-gray-600">Loading test data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-8 bg-white">
      <style>{`
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
          .max-w-6xl {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-3 { margin-bottom: 0.75rem !important; }
          .mb-6 { margin-bottom: 1rem !important; }
          .mt-6 { margin-top: 1rem !important; }
          .bg-gray-50 { padding: 0.25rem 0.5rem !important; }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            color: #000 !important;
            margin-top: 0.5rem !important;
            table-layout: fixed !important;
          }
          th, td {
            padding: 4px 6px !important;
            border: 1px solid #ddd !important;
            color: #000 !important;
            font-size: 10px !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
          }
          th {
            background-color: #f0f9ff !important;
            color: #000 !important;
            font-weight: 600 !important;
          }
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #000 !important;
          }
          .text-2xl { font-size: 16px !important; }
          .text-xl { font-size: 14px !important; }
          .text-sm { font-size: 10px !important; }
          .text-xs { font-size: 9px !important; }
          .w-20 { width: 50px !important; height: 50px !important; }
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
              className="w-20 h-20 object-contain"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
          )}

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
          <h2 className="text-lg font-bold tracking-widest uppercase">Test-Wise Count Report</h2>
          <p className="text-xs text-gray-600 mt-1">Aggregated count of pathology tests by test name and department</p>
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
              <span className="text-gray-600">{stat.label}:</span>{" "}
              <span className="font-bold">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</span>
              {index < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <table className="w-full text-xs mt-2" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className="border-t border-b" style={{ backgroundColor: "#f0f9ff" }}>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: "3%" }}>#</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: "18%" }}>Test Name</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: "10%" }}>Category</th>
            <th className="px-1.5 py-1 text-left text-[10px]" style={{ width: "10%" }}>Department</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: "8%" }}>Price (৳)</th>
            <th className="px-1.5 py-1 text-center text-[10px]" style={{ width: "9%" }}>Orders</th>
            <th className="px-1.5 py-1 text-center text-[10px]" style={{ width: "9%" }}>Completed</th>
            <th className="px-1.5 py-1 text-center text-[10px]" style={{ width: "9%" }}>Pending</th>
            <th className="px-1.5 py-1 text-right text-[10px]" style={{ width: "12%" }}>Total Amount (৳)</th>
            <th className="px-1.5 py-1 text-center text-[10px]" style={{ width: "11%" }}>Completion %</th>
          </tr>
        </thead>
        <tbody>
          {testsWithCounts.map((row, idx) => (
            <tr key={idx} className="border-b border-dashed">
              <td className="px-1.5 py-1 text-[10px] text-gray-500">{idx + 1}</td>
              <td className="px-1.5 py-1 text-[10px] font-medium">{row.name}</td>
              <td className="px-1.5 py-1 text-[10px]">{row.category}</td>
              <td className="px-1.5 py-1 text-[10px]">{row.department}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{row.price ? row.price.toLocaleString() : "-"}</td>
              <td className="px-1.5 py-1 text-[10px] text-center font-mono font-bold">{row.invoiceCount}</td>
              <td className="px-1.5 py-1 text-[10px] text-center text-emerald-600">{row.completedCount}</td>
              <td className="px-1.5 py-1 text-[10px] text-center text-orange-600">{row.pendingCount}</td>
              <td className="px-1.5 py-1 text-[10px] text-right">{row.invoiceCount > 0 ? row.totalAmount.toLocaleString() : "-"}</td>
              <td className="px-1.5 py-1 text-[10px] text-center">
                {(() => {
                  if (row.invoiceCount === 0) return '-'
                  const rate = Math.round((row.completedCount / row.invoiceCount) * 100)
                  const color = rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  return <span className={`font-semibold ${color}`}>{rate}%</span>
                })()}
              </td>
            </tr>
          ))}
          {testsWithCounts.length === 0 && (
            <tr>
              <td colSpan={10} className="px-2 py-4 text-center text-gray-500" style={{ color: "#6b7280 !important" }}>
                <div className="font-semibold text-xs">No test records found for the selected criteria</div>
                <div className="text-[10px] mt-1">Try adjusting your search term or date range</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Tests in Master:</strong> {testsWithCounts.length}
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
