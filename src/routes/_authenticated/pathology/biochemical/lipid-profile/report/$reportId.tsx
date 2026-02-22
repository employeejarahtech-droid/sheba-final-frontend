import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails';
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { topNav } from '@/data/data';
import { useState } from 'react';

export const Route = createFileRoute(
  '/_authenticated/pathology/biochemical/lipid-profile/report/$reportId',
)({
  component: LipidProfileReport,
})

function LipidProfileReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');
  const [paddingTop, setPaddingTop] = useState(100);

  // Generate padding options from 10 to 200 in increments of 5
  const paddingOptions = Array.from({ length: 39 }, (_, i) => (i + 2) * 5); // [10, 15, 20, ..., 200]

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["lipid-profile-report", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lipid-profile/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch lipid profile report");
      return res.json();
    },
    enabled: !!token && !!reportId,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error loading report</div>;
  }

  const invoice = reportData?.data;

  if (!invoice) {
    return <div className="flex items-center justify-center min-h-screen">Report not found</div>;
  }

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
          <Link to="/pathology/biochemical/lipid-profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lipid Profile
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
              Print
            </Button>
          </div>
        </div>
        <ReportDetails invoice={invoice} testName="Lipid Profile Report" paddingTop={paddingTop} />
      </Main>
    </>
  )
}
