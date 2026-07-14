import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, Activity } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/ecg/all/edit/$id',
)({
  component: EditECGReport,
})

type LabTest = {
  id: number
  invoice_id: number
  test_id: number | null
  test_name: string | null
  test_result: string | null
  created_at: string | null
  updated_at: string | null
}

type InvoiceData = {
  invoice_information: {
    id: number
    patient_name: string
    age: string
    sex: string
    invoice_date: string
    phone: string
  } | null
  ecg_all_info: LabTest[]
}



function EditECGReport() {
  const { id } = Route.useParams();
  const router = useRouter();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();


  const [testResults, setTestResults] = useState<Record<number, string>>({});

  // Fetch ECG data for this invoice (includes invoice info + ECG records)
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["ecg-invoice", id],
    queryFn: async (): Promise<InvoiceData> => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ecg-all/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch ECG data (${res.status}: ${res.statusText})`);
      }

      return (await res.json()).data;
    },
    enabled: !!token,
  });

  // Initialize test results when data loads
  useEffect(() => {
    if (invoiceData?.ecg_all_info) {
      const initialResults: Record<number, string> = {};
      invoiceData.ecg_all_info.forEach(test => {
        if (test.id) {
          initialResults[test.id] = test.test_result || '';
        }
      });
      setTestResults(initialResults);
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: async (ecgId: number) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ecg-all/${ecgId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test_result: testResults[ecgId],
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update ECG record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecg-all", id] });
      queryClient.invalidateQueries({ queryKey: ["outdoor-invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["ecg-all"] });
      // Navigate back to list page after successful save
      router.navigate({ to: '/dashboard/ecg/all' });
    },
  });

  const handleSaveAll = () => {
    // Save all test results and test IDs
    Object.keys(testResults).forEach(ecgId => {
      updateMutation.mutate(Number(ecgId));
    });
  };

  if (isLoading) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        </Main>
      </>
    );
  }

  const tests = invoiceData?.ecg_all_info || [];
  const invoiceInformation = invoiceData?.invoice_information;

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <div className="space-y-5 w-full min-w-[650px] max-w-[950px] mx-auto px-4">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => router.navigate({ to: '/dashboard/ecg/all' })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Report - ECG
                </h1>
                <p className="text-muted-foreground text-sm">Update ECG test results for this invoice</p>
              </div>
            </div>
            <Button type="button" variant="default" onClick={handleSaveAll} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save All'}
            </Button>
          </div>

          {/* Patient Information Card */}
          {invoiceInformation && (
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Patient Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receipt and patient details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Invoice No</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      RPT-{invoiceInformation.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Patient Name</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {invoiceInformation.patient_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Age</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {invoiceInformation.age || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Gender</div>
                    <div className="bg-muted/40 p-2 rounded-md border text-sm font-medium">
                      {invoiceInformation.sex || '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ECG Test Records Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">ECG Test Records</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enter or update results for each ECG record</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAll(); }}>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-b">ECG Record ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-b">Test Information</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-b">Test Result</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tests.map((test) => (
                        <tr key={test.id} className="odd:bg-background even:bg-muted/20">
                          <td className="px-4 py-3 border-b">{test.id}</td>
                          <td className="px-4 py-3 border-b">
                            {test.test_name ? (
                              <div>
                                <div className="font-medium">{test.test_name}</div>
                                <div className="text-xs text-muted-foreground">Test ID: {test.test_id}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Input field for testResult */}
                          <td className="px-4 py-3 border-b">
                            <div className="space-y-2">
                              <textarea
                                value={testResults[test.id] || ''}
                                onChange={(e) => setTestResults(prev => ({ ...prev, [test.id]: e.target.value }))}
                                className="w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Enter test result..."
                              />
                              <div className="flex gap-2">
                                <Link to="/dashboard/ecg/all/edit/builder/$id" params={{ id: String(test.id) }} className="flex-1">
                                  <Button type="button" size="sm" variant="secondary" className="w-full">
                                    Update Content
                                  </Button>
                                </Link>
                                <Link to="/dashboard/ecg/all/print/$id" params={{ id: String(test.id) }} className="flex-1">
                                  <Button type="button" size="sm" variant="outline" className="w-full">
                                    Print
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
export default EditECGReport
