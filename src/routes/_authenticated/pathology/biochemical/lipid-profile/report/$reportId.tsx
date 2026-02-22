import ReportDetails from '@/features/pathology/biochemical/lipid-profile/components/ReportDetails';
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
  '/_authenticated/pathology/biochemical/lipid-profile/report/$reportId',
)({
  component: LipidProfileReport,
})

function LipidProfileReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');

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
      <AppHeader fixed />
      <Main>
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link to="/pathology/biochemical/lipid-profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lipid Profile
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        <ReportDetails invoice={invoice} testName="Lipid Profile Report" />
      </Main>
    </>
  )
}
