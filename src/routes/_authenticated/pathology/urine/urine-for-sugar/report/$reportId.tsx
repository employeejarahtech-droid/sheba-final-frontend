import UrineForSugarFullReportDetails from '@/features/pathology/urine/UrineForSugarReportDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'

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
      <UrineForSugarFullReportDetails report={report} invoice={invoice} />
    </>
  )
}
