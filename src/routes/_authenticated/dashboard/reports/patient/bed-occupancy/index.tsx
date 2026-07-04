import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bed, CheckCircle, XCircle, Percent, Printer, FileText } from 'lucide-react'
import { useDateFormat } from '@/hooks/use-date-format'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface BedItem {
  id: number
  name: string
  code: string | null
  type: string | null
  ward_name: string | null
  ward: string | null
  status: 'occupied' | 'available' | 'maintenance' | string
  patient_name: string | null
  notes: string | null
  current_admission?: {
    patient_name: string | null
  } | null
  admission?: {
    patient_name: string | null
  } | null
  patient?: {
    name: string | null
  } | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authenticated/dashboard/reports/patient/bed-occupancy/')({
  component: BedOccupancyPage,
})

function BedOccupancyPage() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();
  const { formatDate } = useDateFormat();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };

  const token = getCookie('accessToken')

  const { data, isLoading } = useQuery({
    queryKey: ['bed-occupancy', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
      })
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch bed occupancy data')
      return res.json()
    },
    enabled: !!token,
    placeholderData: (prev) => prev ? prev : { data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } } },
  })

  const items: BedItem[] = data?.data?.items || []
  const meta: Meta = data?.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Calculate statistics
  const stats = useMemo(() => {
    const occupiedCount = items.filter((i) => i.status === 'occupied').length
    const availableCount = items.filter((i) => i.status === 'available').length
    const maintenanceCount = items.filter((i) => i.status === 'maintenance').length
    const occupancyRate = items.length > 0 ? Math.round((occupiedCount / items.length) * 100) : 0

    return [
      { label: 'Total Beds', value: meta.total, icon: Bed, grad: 'from-blue-500 to-blue-600' },
      { label: 'Occupied', value: occupiedCount, icon: XCircle, grad: 'from-pink-500 to-pink-600' },
      { label: 'Available', value: availableCount, icon: CheckCircle, grad: 'from-green-500 to-green-600' },
      { label: 'Maintenance', value: maintenanceCount, icon: Bed, grad: 'from-yellow-500 to-yellow-600' },
      { label: 'This Page', value: items.length, icon: Bed, grad: 'from-teal-500 to-teal-600' },
      { label: 'Occupancy Rate (%)', value: occupancyRate, icon: Percent, grad: 'from-orange-500 to-orange-600' },
    ]
  }, [items, meta])

  const columns = useMemo(() => [
    {
      data: null,
      title: "#",
      orderable: false,
      render: function(_data: any, _type: string, _row: BedItem, dtMeta: any) {
        // DataTables row index (0-based, for current page only)
        const rowIndex = dtMeta?.row?.index ?? 0;
        // Calculate global index across all pages
        const displayIndex = (meta.page - 1) * meta.limit + rowIndex + 1;
        return `<span class="text-sm text-gray-500 font-mono">${displayIndex}</span>`;
      },
    },
    {
      data: "code",
      title: "Bed Name",
      render: (data: string) => {
        return `<div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4v16"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4v16"></path>
            </svg>
          </div>
          <span class="font-medium">${data || '-'}</span>
        </div>`;
      },
    },
    {
      data: "type",
      title: "Type",
      render: (data: string | null) => {
        return `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">${data || '-'}</span>`;
      },
    },
    {
      data: "ward",
      title: "Ward",
      render: (data: string | null) => {
        return `<div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <span class="font-medium">${data || '-'}</span>
        </div>`;
      },
    },
    {
      data: "status",
      title: "Status",
      render: (data: string | null) => {
        const status = (data || '').toLowerCase();
        const colorMap: Record<string, string> = {
          occupied: 'bg-red-100 text-red-700 border-red-200',
          available: 'bg-green-100 text-green-700 border-green-200',
          maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
        const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
        return `<span class="px-3 py-1 rounded-full text-xs font-semibold capitalize border ${colorClass}">${status || '-'}</span>`;
      },
    },
    {
      data: "patient_name",
      title: "Current Patient",
      render: (_data: any, _type: string, row: BedItem) => {
        // Check multiple possible fields for patient name
        const patientName = row.current_admission?.patient_name
          ?? row.admission?.patient_name
          ?? row.patient?.name
          ?? row.patient_name
          ?? null;

        if (!patientName) return `<span class="text-gray-400 italic">None</span>`;
        return `<div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
            <svg class="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <span class="font-medium">${patientName}</span>
        </div>`;
      },
    },
    {
      data: "notes",
      title: "Notes",
      render: (data: string | null) => {
        if (!data) return `<span class="text-gray-400 italic">No notes</span>`;
        return `<span class="text-sm text-gray-600">${data}</span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      render: (_data: any, _type: string, row: BedItem) => {
        const id = row.id;
        return `<div class="flex gap-2">
          <a href="/dashboard/reports/patient/bed-occupancy/print" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            Print
          </a>
          <a href="/dashboard/bed-cabin/${id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M14 8V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v12"/><path d="M20 18v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4"/><path d="M22 8h-6"/></svg>
            View
          </a>
        </div>`;
      },
    },
  ], [meta]);

  return (
    <>
      <AppHeader
        title="Bed Occupancy Report"
        description="Track bed availability and occupancy rates with detailed filtering and statistics"
        fixed
      />

      <main className="">
        {/* Enhanced Stats Cards - 6 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#14B8A6', '#F97316']
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: colors[index % 6] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: colors[index % 6] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="Bed Occupancy List"
          columns={columns}
          data={items}
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          filterSlot={
            <Link
              to="/dashboard/reports/patient/bed-occupancy/print"
              search={{ search: search || undefined }}
            >
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </Link>
          }
          emptyState={
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bed records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          }
        />
      </main>
    </>
  )
}
