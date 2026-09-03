import { useRouter } from '@tanstack/react-router'
import { Printer, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PrintColumn {
  header: string
  field?: string
  render?: (row: any, index: number) => string
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface PrintStat {
  label: string
  value: string | number
}

export interface PrintFilterChip {
  label: string
  value: string
}

interface ReportPrintLayoutProps {
  title: string
  subtitle?: string
  hospitalName?: string
  hospitalAddress?: string
  companyLogo?: string | null
  stats?: PrintStat[]
  columns: PrintColumn[]
  data: any[]
  filters?: PrintFilterChip[]
  isLoading?: boolean
  totalCount?: number
}

export function ReportPrintLayout({
  title,
  subtitle,
  hospitalName = 'Sheba Hospital',
  hospitalAddress = 'Dhaka, Bangladesh',
  companyLogo = null,
  stats = [],
  columns,
  data,
  filters = [],
  isLoading = false,
  totalCount,
}: ReportPrintLayoutProps) {
  const router = useRouter()
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const activeFilters = filters.filter(f => f.value)

  return (
    <div className="max-w-6xl mx-auto w-full p-8 bg-white">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
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
          #print-content {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          /* Reduce spacing */
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-3 { margin-bottom: 0.75rem !important; }
          .mb-6 { margin-bottom: 1rem !important; }
          .mt-2 { margin-top: 0.5rem !important; }
          .mt-3 { margin-top: 0.75rem !important; }
          .mt-6 { margin-top: 1rem !important; }
          /* Reduce font sizes */
          .text-xl { font-size: 16px !important; }
          .text-lg { font-size: 14px !important; }
          .text-xs { font-size: 9px !important; }
          /* Stats section */
          .bg-gray-50 { padding: 0.25rem 0.5rem !important; }
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
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #000 !important;
          }
          .w-20 {
            width: 50px !important;
            height: 50px !important;
          }
        }
      `}</style>

      {/* Back & Print Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.history.back()}>
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
          ) : null}

          <div>
            <h1 className="text-xl font-bold">{hospitalName}</h1>
            <p className="text-xs mt-1 leading-4">
              {hospitalAddress}
            </p>
          </div>
        </div>

        <div className="w-1/2 text-right">
          <h2 className="text-lg font-bold tracking-widest uppercase">{title}</h2>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
          <p className="text-xs mt-1 leading-4">Generated: {now}</p>
        </div>
      </div>

        {/* Active Filters (e.g. date range) */}
        {activeFilters.length > 0 && (
          <div className="mb-2 p-2 bg-gray-50 rounded border text-xs">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {activeFilters.map((f, i) => (
                <span key={i}>
                  <span className="text-gray-600">{f.label}:</span>{' '}
                  <span className="font-semibold">{f.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded border text-[10px]">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {stats.map((s, i) => (
                <span key={i}>
                  <span className="text-gray-600">{s.label}:</span>{' '}
                  <span className="font-bold">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
                  {i < stats.length - 1 && <span className="mx-2 text-gray-400">|</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Data Table ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
            <span className="ml-3 text-gray-500 text-xs">Fetching all records…</span>
          </div>
        ) : (
          <table className="w-full text-xs mt-2">
            <thead>
              <tr className="border-t border-b" style={{ backgroundColor: '#f0f9ff' }}>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-1.5 py-1 text-left text-[10px] whitespace-nowrap"
                    style={{ textAlign: col.align || 'left', width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 py-4 text-center text-gray-500 text-xs">
                    No records found for the selected criteria
                  </td>
                </tr>
              ) : (
                data.map((row, ri) => (
                  <tr key={ri} className="border-b border-dashed">
                    {columns.map((col, ci) => {
                      let val: string = '-'
                      if (col.render) {
                        try { val = col.render(row, ri) } catch { val = '-' }
                      } else if (col.field) {
                        const raw = row[col.field]
                        val = raw !== null && raw !== undefined ? String(raw) : '-'
                      }
                      return (
                        <td
                          key={ci}
                          className="px-1.5 py-1 text-[10px]"
                          style={{ textAlign: col.align || 'left' }}
                        >
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

      {/* ── Summary Footer ───────────────────────────────────────────────── */}
      <div className="mt-3 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Total Records:</strong> {data.length}
          </div>
          <div className="text-right">
            <strong>Generated:</strong> {now}
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
