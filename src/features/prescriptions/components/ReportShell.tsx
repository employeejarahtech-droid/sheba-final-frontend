import { useMemo } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/DataTable'

export interface ReportColumn {
  data: string | null
  title: string
  orderable?: boolean
  render?: (data: any, type: string, row: any, meta: any) => string
}

interface ReportShellProps {
  title: string
  subtitle: string
  start: string
  end: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onReset: () => void
  rows: any[]
  columns: ReportColumn[]
  isFetching: boolean
  filterSlot?: React.ReactNode
  page: number
  limit: number
  search: string
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onSearchChange: (search: string) => void
}

/** Shared page frame for the prescription report pages (doctor/medicine/patient-wise).
 *  Reports return every row for the date range (no server pagination), so
 *  search + paging is done here, client-side, the same way the Pharmacy
 *  report-style pages (low-stock, stock-report, …) do it. */
export function ReportShell({
  title, subtitle, start, end, onStartChange, onEndChange, onReset,
  rows, columns, isFetching, filterSlot,
  page, limit, search, onPageChange, onLimitChange, onSearchChange,
}: ReportShellProps) {
  const cols = useMemo(() => columns, [columns])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      Object.values(row).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
    )
  }, [rows, search])

  const total = filtered.length
  const startIdx = (page - 1) * limit
  const pageItems = filtered.slice(startIdx, startIdx + limit)

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} className="w-[150px]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={end} onChange={(e) => onEndChange(e.target.value)} className="w-[150px]" />
            </div>
            {filterSlot}
            <Button variant="outline" onClick={onReset}>Reset</Button>
          </div>
        </div>

        <DataTable
          columns={cols}
          data={pageItems}
          meta={{ page, limit, total }}
          search={search}
          onSearchChange={onSearchChange}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isLoading={isFetching}
          hideExport
        />
      </Main>
    </>
  )
}
