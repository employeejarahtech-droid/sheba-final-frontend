import { ConfigDrawer } from '@/components/config-drawer';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { TopNav } from '@/components/layout/top-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { outdoorInvoices, topNav } from '@/data/data';
import HematologyReportDetails from '@/features/pathology/hematology/all-reports/HematologyReportDetails'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/pathology/hematology/all/report/$reportId',
)({
  component: HematologyAllReports,
})

function HematologyAllReports() {
  const { reportId } = Route.useParams();

  const invoice = outdoorInvoices.find((item) => item.id === parseInt(reportId!));
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
          <Link to="/pathology/hematology/all">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Reports
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        <HematologyReportDetails invoice={invoice!} />
      </Main>
    </>
  )
}
