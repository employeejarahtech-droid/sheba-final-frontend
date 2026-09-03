import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

import { Main } from "@/components/layout/main";
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";
import { LegacyCustomTestForm } from "@/features/pathology/custom-tests/components/LegacyCustomTestForm";
import { DynamicCustomTestForm } from "@/features/pathology/custom-tests/components/DynamicCustomTestForm";

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/custom-tests/edit/$id',
)({
  component: EditCustomTest,
})

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────
function EditCustomTest() {
  const { id } = Route.useParams();

  const navigate = useNavigate();
  const token = getCookie('accessToken');

  const reportId = Number(id);

  // Fetch custom test data. When the underlying test is linked to a
  // custom-form-designer template (test_tables.is_custom_form_designer), the
  // API attaches `form_template` — that's what decides which form renders.
  const { data: customTestData } = useQuery({
    queryKey: ["custom-tests-detail", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/custom-tests-results/${reportId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch custom test report");
      const result = await res.json();
      return result.data;
    },
    enabled: !!token && !!reportId,
  });

  // Fetch machines from API
  const { data: machinesData } = useQuery({
    queryKey: ["machine"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/machine`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch machines");
      return res.json();
    },
    enabled: !!token,
  });

  const machineList = machinesData?.data?.items || [];

  const formTemplate = customTestData?.form_template;
  const isTemplateDriven = !!(formTemplate?.is_custom_form_designer && formTemplate?.form_schema?.length);

  return (
    <>
      {/* Header */}
      <AppHeader fixed />
      {/* Main Content */}
      <Main className="flex flex-1 flex-col gap-6">
        <div className="w-full min-w-[650px] max-w-[1200px] mx-auto px-4 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: '/dashboard/pathology/custom-tests' })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Custom Test Report
                </h1>
                <p className="text-muted-foreground text-sm">Review and update custom test laboratory findings</p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Patient Information</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Invoice and patient details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <PatientInvoiceInfo
                invoiceInfo={{
                  invoiceNo: customTestData?.invoice_id ? `RPT-${customTestData.invoice_id}` : "—",
                  patientName: customTestData?.outdoor_invoice?.patient_name || "—",
                  age: customTestData?.outdoor_invoice?.age_text || customTestData?.outdoor_invoice?.age || "—",
                  gender: customTestData?.outdoor_invoice?.sex || "—",
                }}
              />
            </CardContent>
          </Card>

          {customTestData && (
            isTemplateDriven ? (
              <DynamicCustomTestForm
                reportId={reportId}
                customTestData={customTestData}
                machineList={machineList}
                formTemplate={formTemplate}
              />
            ) : (
              <LegacyCustomTestForm
                reportId={reportId}
                customTestData={customTestData}
                machineList={machineList}
              />
            )
          )}
        </div>
      </Main>
    </>
  );
}
