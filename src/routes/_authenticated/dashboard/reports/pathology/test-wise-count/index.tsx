import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCookie } from '@/lib/cookies'
import { AppHeader } from '@/components/layout/app-header'
import { DataTable } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TestTube2, CheckCircle2, BarChart3, Database, FlaskConical, Users } from 'lucide-react'
import { z } from 'zod'

const COLORS = ['#10B981', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6']

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

interface TestWithCount {
  id: number
  name: string
  displayName: string
  tableName: string
  recordCount: number
}

const testWiseCountSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/reports/pathology/test-wise-count/')({
  validateSearch: (search) => testWiseCountSearchSchema.parse(search),
  component: TestWiseCountReport,
})

function TestWiseCountReport() {
  const searchParams: any = Route.useSearch();
  const navigate = Route.useNavigate();

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = searchParams?.search || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

  const setPage = (newPage: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
  };
  const setLimit = (newLimit: number) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
  };
  const setSearch = (newSearch: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
  };
  const setFrom = (newFrom: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
  };
  const setTo = (newTo: string) => {
    navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
  };

  const token = getCookie('accessToken')

  // Fetch all test tables for display names
  const { data: testTablesData, isLoading: testTablesLoading } = useQuery({
    queryKey: ['all-test-tables'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables?page=1&limit=9999`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch test tables')
      return res.json()
    },
    enabled: !!token,
  })

  // Fetch all tests from master
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

  // Fetch record counts for each test
  const { data: recordCountsData, isLoading: recordCountsLoading } = useQuery({
    queryKey: ['test-wise-record-counts', testsData?.data?.items, from, to],
    queryFn: async () => {
      const tests = testsData?.data?.items || []
      if (tests.length === 0) return {}

      const counts: Record<number, number> = {}
      const distinctTables = Array.from(new Set(tests.map((t: any) => t.match_table_name).filter(Boolean))) as string[];

      for (const tableName of distinctTables) {
        try {
          const actualTableName = tableName.replace(/_/g, '-')
          const params = new URLSearchParams({ page: '1', limit: '99999' })
          if (from) params.set('from', from)
          if (to) params.set('to', to)

          // Fetch all records from the matched table
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${actualTableName}?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            const items = data.data?.items || []
            const testsForTable = tests.filter((t: any) => t.match_table_name === tableName)

            // If the table returns 0 items, nothing to tally
            if (items.length > 0) {
              items.forEach((item: any) => {
                // Scenario 1: Backend provides test_id directly
                if (item.test_id) {
                  counts[item.test_id] = (counts[item.test_id] || 0) + 1
                } 
                // Scenario 2: Backend groups tests and returns TestNames and Tests (e.g. xray_all)
                else if (item.TestNames || item.test_name || item.test_names || item.Tests) {
                  const namesStr = item.TestNames || item.test_name || item.test_names || ''
                  const tNames = typeof namesStr === 'string' ? namesStr.split(',').map((n: string) => n.trim()).filter(Boolean) : []
                  
                  // The actual number of records in the table for this invoice
                  const recordIds = item.Tests ? String(item.Tests).split(',').filter(Boolean) : []
                  const actualRecordCount = recordIds.length > 0 ? recordIds.length : (tNames.length || 1)
                  
                  if (tNames.length > 0) {
                    const baseCount = Math.floor(actualRecordCount / tNames.length)
                    let remainder = actualRecordCount % tNames.length
                    let unassignedCount = 0;
                    
                    tNames.forEach((tName: string) => {
                      const matchedTest = testsForTable.find(t => (t.name || '').toLowerCase() === tName.toLowerCase())
                      const countToAdd = baseCount + (remainder > 0 ? 1 : 0)
                      if (remainder > 0) remainder--
                      
                      if (matchedTest) {
                        counts[matchedTest.id] = (counts[matchedTest.id] || 0) + countToAdd
                      } else {
                        unassignedCount += countToAdd
                      }
                    })
                    
                    // Prevent dropping counts for unmatched tests by assigning them to the first available test for this table
                    if (unassignedCount > 0 && testsForTable.length > 0) {
                      counts[testsForTable[0].id] = (counts[testsForTable[0].id] || 0) + unassignedCount
                    }
                  } else if (testsForTable.length > 0) {
                    // No test names found but records exist! Distribute across all tests for this table.
                    const baseCount = Math.floor(actualRecordCount / testsForTable.length)
                    let remainder = actualRecordCount % testsForTable.length
                    testsForTable.forEach(test => {
                       const countToAdd = baseCount + (remainder > 0 ? 1 : 0)
                       if (remainder > 0) remainder--
                       counts[test.id] = (counts[test.id] || 0) + countToAdd
                    })
                  }
                } 
                // Scenario 3: Backend doesn't provide test info (e.g. 1:1 mapped tables like urine_sugar)
                else {
                  testsForTable.forEach(test => {
                    counts[test.id] = (counts[test.id] || 0) + 1
                  })
                }
              })
            }
          }
        } catch (error) {
          console.error(`Failed to fetch records for table ${tableName}:`, error)
        }
      }
      return counts
    },
    enabled: !!token && testsData?.data?.items && testsData.data.items.length > 0,
  })

  const tests: TestItem[] = testsData?.data?.items || []
  const testTables = testTablesData?.data?.items || []
  const recordCounts: Record<number, number> = recordCountsData || {}

  // Map tests to their counts
  const testCounts = useMemo(() => {
    let result: TestWithCount[] = tests.map(test => {
      const recordCount = recordCounts[test.id] || 0
      
      const matchedTableObj = testTables.find((tb: any) => tb.table_name === test.match_table_name)
      const mappedTableName = matchedTableObj ? (matchedTableObj.display_name || matchedTableObj.table_name) : (test.match_table_name || '-')

      return {
        id: test.id,
        name: test.name,
        displayName: test.name,
        tableName: mappedTableName,
        recordCount,
      }
    })

    if (search) {
      const lowerSearch = search.toLowerCase().replace(/[-_ ]/g, '')
      result = result.filter(t => 
        (t.name || '').toLowerCase().replace(/[-_ ]/g, '').includes(lowerSearch) || 
        (t.tableName || '').toLowerCase().replace(/[-_ ]/g, '').includes(lowerSearch)
      )
    }

    // Sort by record count (descending), then by display name
    return result.sort((a, b) => b.recordCount - a.recordCount || a.displayName.localeCompare(b.displayName))
  }, [tests, testTables, recordCounts, search])

  // Paginate
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return {
      items: testCounts.slice(startIndex, endIndex),
      total: testCounts.length,
      totalPages: Math.ceil(testCounts.length / limit),
    }
  }, [testCounts, page, limit])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTests = tests.length
    const testsWithRecords = testCounts.filter(t => t.recordCount > 0).length
    const totalRecords = testCounts.reduce((sum, t) => sum + t.recordCount, 0)

    return [
      { label: 'Total Tests', value: totalTests, icon: FlaskConical },
      { label: 'Tests with Data', value: testsWithRecords, icon: TestTube2 },
      { label: 'Total Records', value: totalRecords, icon: BarChart3 },
    ]
  }, [testCounts, tests])

  const isLoading = testsLoading || recordCountsLoading

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
      title: 'Test Name',
      orderable: true,
      render: (d: any, _type: string, row: TestWithCount) => {
        return `<div class="flex flex-col">
          <span class="font-medium text-blue-600 dark:text-blue-400">${d}</span>
        </div>`
      },
      defaultContent: '-',
    },
    {
      data: 'tableName',
      title: 'Mapped Table',
      orderable: true,
      render: (d: any) => `<span class="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">${d}</span>`,
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
        title="Test-wise Count Report"
        description="Aggregated count of actual pathology test records by individual test"
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
          tableTitle="All Tests with Record Counts"
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
              <p className="text-gray-500 font-medium">No tests found</p>
              <p className="text-sm text-gray-400">Try adjusting your search term</p>
            </div>
          }
        />
      </main>
    </>
  )
}
