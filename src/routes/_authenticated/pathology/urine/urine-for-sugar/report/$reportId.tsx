import UrineForSugarFullReportDetails from '@/features/pathology/urine/UrineForSugarReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { topNav } from '@/data/data'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-sugar/report/$reportId',
)({
  component: UrineForSugarReport,
})

function UrineForSugarReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');

  // Fetch urine sugar report data
  const { data: reportData } = useQuery({
    queryKey: ["urine-sugar", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/urine-sugar/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch urine sugar report");
      return res.json();
    },
    enabled: !!token && !!reportId,
  });

  // Fetch invoice data
  const { data: invoiceData } = useQuery({
    queryKey: ["invoice", reportData?.data?.invoice_id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${reportData?.data?.invoice_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json();
    },
    enabled: !!token && !!reportData?.data?.invoice_id,
  });

  const report = reportData?.data;
  const invoice = invoiceData?.data;

  return (
    <>
      <Header fixed className="print:hidden">
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/pathology/urine/urine-for-re-full">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Urine For Sugar Tests
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        <UrineForSugarFullReportDetails report={report} invoice={invoice} />
      </Main>
    </>
  )
}

