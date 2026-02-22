import WidalTestReportDetails from '@/features/pathology/immunology/WidalTestReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { widalTestReports } from '@/data/data'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/pathology/immunology/widal-test/report/$reportId',
)({
  component: WidalTestReport,
})

function WidalTestReport() {
  const { reportId } = Route.useParams()
  const token = getCookie('accessToken')
  const [paddingTop, setPaddingTop] = useState(100);

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  // Try to fetch from API first
  const { data: widalData, isLoading, isError, error } = useQuery({
    queryKey: ['widal', reportId],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/widal/${reportId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (!res.ok) {
          console.error('API Response:', res.status, res.statusText)
          throw new Error(`Failed to fetch widal test report: ${res.status} ${res.statusText}`)
        }
        const data = await res.json()
        console.log('Widal test data:', data)
        return data
      } catch (err) {
        console.error('Error fetching widal test:', err)
        throw err
      }
    },
    enabled: !!token && !!reportId,
    retry: 1,
  })

  // Fallback to static data if API fails or during development
  const reportData = widalData?.data || widalData || widalTestReports.find((r) => r.id === Number(reportId))

  console.log('Report data passed to component:', reportData)

  // Show loading only when fetching from API (not when using fallback)
  if (isLoading && !widalTestReports.find((r) => r.id === Number(reportId))) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading report...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Report Not Found</h2>
            <p className="text-yellow-600 mb-4">
              The widal test report with ID <span className="font-mono">{reportId}</span> could not be found.
            </p>
            <p className="text-sm text-gray-500">
              Available report IDs: <span className="font-mono">1, 2, 3</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/pathology/immunology/widal-test">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Widal Test
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="padding-select" className="text-sm font-medium">Padding Top:</label>
              <select
                id="padding-select"
                value={paddingTop}
                onChange={(e) => setPaddingTop(Number(e.target.value))}
                className="h-8 px-2 text-sm border rounded-md bg-background"
              >
                {paddingOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}px
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>
        <WidalTestReportDetails data={reportData} paddingTop={paddingTop} />
      </Main>
    </>
  )
}
