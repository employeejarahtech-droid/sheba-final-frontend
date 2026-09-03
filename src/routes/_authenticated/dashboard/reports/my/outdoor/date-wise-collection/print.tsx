import { createFileRoute } from '@tanstack/react-router'
import { ReportPrintLayout } from '@/components/reports/ReportPrintLayout'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'
import { useAuthStore } from '@/stores/auth-store'
import { useMemo } from 'react'
import { z } from 'zod'

const printSearchSchema = z.object({
  search: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/my/outdoor/date-wise-collection/print')({
  validateSearch: (search) => printSearchSchema.parse(search),
  component: DateWiseCollectionPrint,
})

function DateWiseCollectionPrint() {
  const { search, start_date, end_date } = Route.useSearch()
  const token = getCookie('accessToken')
  const { currencySymbol } = useCurrency()
  const currentUserName = useAuthStore((s) => s.user?.name)
  const API_URL = import.meta.env.VITE_API_URL || ''

  // Fetch date-wise collection data
  const { data, isLoading } = useQuery({
    queryKey: ["my-outdoor-date-wise-collection-print", search, start_date, end_date],
    queryFn: async () => {
      // No date range = print everything, so the limit must not truncate the
      // full history (999 was too low for an unbounded "all time" fetch).
      const params = new URLSearchParams({ limit: '99999', search: search ?? '' })
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      const res = await fetch(`${API_URL}/api/outdoor-invoice/my-outdoor-invoice/date-wise-collection?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch date-wise collection")
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

  const items = useMemo(() => data?.data?.items || [], [data])
  const stats = useMemo(() => {
    const serverStats = data?.data?.stats || {}
    return [
      {
        label: "Total Payments",
        value: serverStats.payment_count || 0
      },
      {
        label: "Total Collected",
        value: `${currencySymbol}${(serverStats.total_collected || 0).toLocaleString()}`
      },
      {
        label: "Total Discount",
        value: `${currencySymbol}${(serverStats.total_discount || 0).toLocaleString()}`
      },
      {
        label: "Gross Bill",
        value: `${currencySymbol}${(serverStats.total_bill || 0).toLocaleString()}`
      },
    ]
  }, [data, currencySymbol])

  const companyLogo = companySettings?.company_logo
    ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
      ? companySettings.company_logo
      : `${API_URL}${companySettings.company_logo}`
    : null;
  const companyName = companySettings?.company_name || 'Sheba Hospital';
  const companyAddress = [companySettings?.address1, companySettings?.address2].filter(Boolean).join(', ') || 'Dhaka, Bangladesh'

  const columns = [
    { header: "#", render: (_: any, i: number) => String(i + 1) },
    { header: "Date", field: "payment_date" },
    { header: "Invoice ID", field: "id" },
    { header: "Patient Name", field: "patient_name" },
    { header: "Phone", field: "phone" },
    {
      header: "Reference Doctor",
      render: (row: any) => row.doctor?.doctor_name || "-"
    },
    {
      header: "Bill Amount",
      // total_amount is a Sequelize DECIMAL column, serialized as a string —
      // calling .toFixed() on it directly throws (strings have no .toFixed),
      // which ReportPrintLayout's render try/catch silently turns into "-".
      render: (row: any) => Number(row.total_amount || 0).toFixed(2)
    },
    {
      header: "Discount",
      render: (row: any) => {
        const total = Number(row.total_amount || 0)
        const net = Number(row.net_amount || 0)
        const discount = total - net
        return discount > 0 ? discount.toFixed(2) : "-"
      }
    },
    {
      header: "Collected",
      // payment_amount is also a DECIMAL-as-string column — same fix as Bill Amount.
      render: (row: any) => Number(row.payment_amount || 0).toFixed(2)
    },
    {
      header: "Payment Type",
      // No prior payment on the invoice before this one = the regular payment
      // made at billing time. Otherwise it's collecting an already-outstanding due.
      render: (row: any) => Number(row.previous_paid || 0) > 0 ? "Due Collection" : "Regular"
    },
    {
      header: "Collected By",
      render: (row: any) => row.payment_created_by?.name || row.creator?.name || "-"
    },
  ]

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const dateRangePart = start_date && end_date
    ? `from ${fmtDate(start_date)} to ${fmtDate(end_date)}`
    : start_date
      ? `from ${fmtDate(start_date)}`
      : end_date
        ? `up to ${fmtDate(end_date)}`
        : '(all time)'
  const subtitle = currentUserName
    ? `Collected by ${currentUserName} — ${dateRangePart}`
    : `Your payment collection history ${dateRangePart}`

  return (
    <ReportPrintLayout
      title="Date-wise Collection Report"
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