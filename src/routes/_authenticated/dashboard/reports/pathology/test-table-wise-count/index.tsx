import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TestTube2, CheckCircle2, Clock, BarChart3, Users, FlaskConical, Database } from 'lucide-react'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

interface TestTable {
  id: string
  name: string
  table_name: string
  display_name: string
  description: string
  created_at: string
}

interface TestItem {
  id: number
  name: string
  category_id: number
  match_table_name: string
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

interface TestTableWithCount {
  id: string
  name: string
  displayName: string
  tableName: string
  recordCount: number // Actual count of records in the table
  testCount?: number // Number of tests mapped to this table
}

const testTableWiseCountSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/pathology/test-table-wise-count/')({
  validateSearch: (search) => testTableWiseCountSearchSchema.parse(search),
  component: TestTableWiseCountReport,
})

function TestTableWiseCountReport() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();

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

  // Fetch all test tables
  const { data: testTablesData, isLoading: testTablesLoading } = useQuery({
    queryKey: ['all-test-tables'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables?limit=9999`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch test tables')
      return res.json()
    },
    enabled: !!token,
  })

  // Fetch all tests from master (to get match_table_name mapping)
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['all-tests'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tests?page=1&limit=99999`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch tests')
      return res.json()
    },
    enabled: !!token,
  })

  // Fetch record counts for each test table
  const { data: recordCountsData, isLoading: recordCountsLoading } = useQuery({
    queryKey: ['test-table-record-counts', testTablesData?.data?.items],
    queryFn: async () => {
      const tables = testTablesData?.data?.items || []
      if (tables.length === 0) return {}

      const counts: Record<string, number> = {}
      for (const table of tables) {
        try {
          // Convert underscores to hyphens for the actual table name
          // test_tables.table_name uses underscores (e.g., "urine_sugar")
          // but actual DB tables use hyphens (e.g., "urine-sugar")
          const actualTableName = table.table_name.replace(/_/g, '-')

          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/record-count/${actualTableName}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            counts[table.table_name] = data.data?.count || 0
          } else {
            counts[table.table_name] = 0
          }
        } catch (error) {
          console.error(`Failed to fetch count for ${table.table_name}:`, error)
          counts[table.table_name] = 0
        }
      }
      return counts
    },
    enabled: !!token && testTablesData?.data?.items && testTablesData.data.items.length > 0,
  })

  const testTables: TestTable[] = testTablesData?.data?.items || []
  const tests: TestItem[] = testsData?.data?.items || []
  const recordCounts: Record<string, number> = recordCountsData || {}

  // Count by test_table (using actual table record counts)
  const testTableCounts = useMemo(() => {
    const result: TestTableWithCount[] = testTables.map(table => {
      // Get the actual record count from the database table
      const recordCount = recordCounts[table.table_name] || 0

      // Count how many tests are mapped to this table
      const mappedTestCount = tests.filter(t => {
        // match_table_name in tests stores the table name directly (e.g., "hematology-all")
        return t.match_table_name === table.table_name
      }).length

      return {
        id: table.id,
        name: table.name,
        displayName: table.display_name || table.name,
        tableName: table.table_name,
        recordCount,
        testCount: mappedTestCount,
      }
    })

    // Sort by record count (descending), then by display name
    return result.sort((a, b) => b.recordCount - a.recordCount || a.displayName.localeCompare(b.displayName))
  }, [testTables, tests, recordCounts])

  // Paginate
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return {
      items: testTableCounts.slice(startIndex, endIndex),
      total: testTableCounts.length,
      totalPages: Math.ceil(testTableCounts.length / limit),
    }
  }, [testTableCounts, page, limit])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTestTables = testTableCounts.length
    const totalTests = tests.length
    const tablesWithRecords = testTableCounts.filter(t => t.recordCount > 0).length
    const totalRecords = testTableCounts.reduce((sum, t) => sum + t.recordCount, 0)
    const tablesWithTests = testTableCounts.filter(t => t.testCount && t.testCount > 0).length
    const totalMappedTests = testTableCounts.reduce((sum, t) => sum + (t.testCount || 0), 0)

    return [
      { label: 'Test Tables', value: totalTestTables, icon: Database },
      { label: 'Total Tests', value: totalTests, icon: FlaskConical },
      { label: 'Tables with Data', value: tablesWithRecords, icon: TestTube2 },
      { label: 'Total Records', value: totalRecords, icon: BarChart3 },
      { label: 'Mapped Tests', value: totalMappedTests, icon: CheckCircle2 },
      { label: 'Tables Used', value: tablesWithTests, icon: Users },
    ]
  }, [testTableCounts, tests])

  const isLoading = testTablesLoading || testsLoading || recordCountsLoading

  const columns = [
    {
      data: null,
      title: '#',
      orderable: false,
      render: (_: any, __: string, ___: any, meta: any) => meta.row + 1 + (page - 1) * limit,
      defaultContent: '',
    },
    {
      data: 'displayName',
      title: 'Test Table',
      orderable: true,
      render: (d: any, _type: string, row: TestTableWithCount) => {
        return `<div class="flex flex-col">
          <span class="font-medium text-blue-600 dark:text-blue-400">${d}</span>
          <span class="text-xs text-muted-foreground">${row.tableName}</span>
        </div>`
      },
      defaultContent: '-',
    },
    {
      data: 'testCount',
      title: 'Mapped Tests',
      orderable: true,
      render: (d: any) => `<span class="font-mono text-xs">${d || 0}</span>`,
    },
    {
      data: 'recordCount',
      title: 'Total Records',
      orderable: false,
      render: (d: any) => `<span class="font-mono font-bold text-lg">${d || 0}</span>`,
    },
  ]

  return (
    <>
      <AppHeader
        title="Test Table-wise Count Report"
        description="Aggregated count of pathology test records by test table"
        fixed
      />

      <main className="">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <Icon className="w-4 h-4" style={{ color: COLORS[index % COLORS.length] }} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white/90">{stat.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTable
          tableTitle="All Test Tables with Record Counts"
          columns={columns}
          data={paginatedData.items}
          meta={{
            total: paginatedData.total,
            page,
            limit,
            totalPages: paginatedData.totalPages,
          }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-12">
              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No test tables found</p>
              <p className="text-sm text-gray-400">Try adjusting your search term</p>
            </div>
          }
        />
      </main>
    </>
  )
}
