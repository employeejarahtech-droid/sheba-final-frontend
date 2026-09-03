import { createFileRoute } from '@tanstack/react-router'
import { ReportPrintLayout } from '@/components/reports/ReportPrintLayout'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useMemo } from 'react'
import { z } from 'zod'
import type { Income } from '@/types/accounting.types'

const printSearchSchema = z.object({
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/dashboard/accounting/income/print')({
  validateSearch: (search) => printSearchSchema.parse(search),
  component: IncomePrint,
})

function IncomePrint() {
  const { search, from, to } = Route.useSearch()
  const token = getCookie('accessToken')
  const { currencySymbol } = useCurrency()
  const API_URL = import.meta.env.VITE_API_URL || ''

  const { data, isLoading } = useQuery({
    queryKey: ['income-print', search, from, to],
    queryFn: async () => {
      // No date range = print everything, so the limit must not truncate the
      // full history (matches the pattern used by the collections print pages).
      const params = new URLSearchParams({ limit: '99999', search: search ?? '' })
      if (from) params.set('start_date', from)
      if (to) params.set('end_date', to)
      const res = await fetch(`${API_URL}/api/accounting/incomes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch incomes')
      return res.json()
    },
    enabled: !!token,
  })

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/company-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch company settings')
      const result = await res.json()
      return result.data
    },
    enabled: !!token,
  })

  const items: Income[] = useMemo(() => data?.data || [], [data])
  const stats = useMemo(() => {
    const totalAmount = items.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    return [
      { label: 'Total Records', value: items.length },
      { label: 'Total Income', value: `${currencySymbol}${totalAmount.toLocaleString()}` },
    ]
  }, [items, currencySymbol])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null
  const companyName = companySettings?.company_name || 'Sheba Hospital'
  const companyAddress = [companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ') || 'Dhaka, Bangladesh'

  const columns = [
    { header: '#', render: (_: any, i: number) => String(i + 1) },
    { header: 'Date', field: 'income_date' },
    { header: 'ID', field: 'id' },
    { header: 'Title', field: 'title' },
    {
      header: 'Category',
      render: (row: Income) => row.creditHead?.name || '-',
    },
    {
      header: 'Amount',
      align: 'right' as const,
      render: (row: Income) => Number(row.amount || 0).toFixed(2),
    },
    { header: 'Payment Method', field: 'payment_method' },
    { header: 'Reference', field: 'reference_number' },
    { header: 'Status', field: 'status' },
  ]

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '')
  const dateRangePart = from && to
    ? `from ${fmtDate(from)} to ${fmtDate(to)}`
    : from
      ? `from ${fmtDate(from)}`
      : to
        ? `up to ${fmtDate(to)}`
        : '(all time)'
  const subtitle = `All income transactions ${dateRangePart}`

  return (
    <ReportPrintLayout
      title="Income Report"
      subtitle={subtitle}
      hospitalName={companyName}
      hospitalAddress={companyAddress}
      companyLogo={companyLogo}
      stats={stats}
      columns={columns}
      data={items}
      isLoading={isLoading}
      totalCount={items.length}
    />
  )
}
