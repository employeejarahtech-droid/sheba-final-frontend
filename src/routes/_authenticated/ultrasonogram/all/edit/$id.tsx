import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Card, CardContent } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/ultrasonogram/all/edit/$id',
)({
  component: EditUltrasonogramReport,
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
  ultrasonogram_all_info: LabTest[]
}



function EditUltrasonogramReport() {
  const { id } = Route.useParams();
  const router = useRouter();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();


  const [testResults, setTestResults] = useState<Record<number, string>>({});

  // Fetch Ultrasonogram data for this invoice (includes invoice info + Ultrasonogram records)
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["ultrasonogram-invoice", id],
    queryFn: async (): Promise<InvoiceData> => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch Ultrasonogram data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize test results when data loads
  useEffect(() => {
    if (invoiceData?.ultrasonogram_all_info) {
      const initialResults: Record<number, string> = {};
      invoiceData.ultrasonogram_all_info.forEach(test => {
        if (test.id) {
          initialResults[test.id] = test.test_result || '';
        }
      });
      setTestResults(initialResults);
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: async (ultrasonogramId: number) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ultrasonogram-all/${ultrasonogramId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test_result: testResults[ultrasonogramId],
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update Ultrasonogram record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ultrasonogram-all", id] });
      queryClient.invalidateQueries({ queryKey: ["outdoor-invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["ultrasonogram-all"] });
      // Navigate back to list page after successful save
      router.navigate({ to: '/ultrasonogram/all' });
    },
  });

  const handleSaveAll = () => {
    // Save all test results and test IDs
    Object.keys(testResults).forEach(ultrasonogramId => {
      updateMutation.mutate(Number(ultrasonogramId));
    });
  };

  const handlePrint = () => {
    // Navigate to print page in same tab
    router.navigate({ to: '/ultrasonogram/all/print/$id', params: { id } });
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

  const tests = invoiceData?.ultrasonogram_all_info || [];
  const invoiceInformation = invoiceData?.invoice_information;

  return (
    <>
      {/* Header */}
    <AppHeader fixed />

      {/* Main */}
      <Main>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Edit Report - Ultrasonogram</h1>
          <Link to="/ultrasonogram/all" className="ms-auto">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to All
            </Button>
          </Link>
        </div>

        {invoiceInformation && (
          <Card>
            <CardContent>
              <PatientInvoiceInfo
                invoiceInfo={{
                  invoiceNo: `RPT-${invoiceInformation.id}`,
                  patientName: invoiceInformation.patient_name,
                  age: invoiceInformation.age,
                  gender: invoiceInformation.sex,
                }}
              />
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveAll(); }}>
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Ultrasonogram Record ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Test Information</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Test Result</th>
                  </tr>
                </thead>

                <tbody>
                  {tests.map((test, index) => (
                    <tr
                      key={test.id}
                      className={`${index % 2 === 0 ? `bg-white` : `bg-gray-50`} hover:bg-gray-100`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">{test.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">
                        {test.test_name ? (
                          <div>
                            <div className="font-medium">{test.test_name}</div>
                            <div className="text-xs text-gray-500">Test ID: {test.test_id}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Input field for testResult */}
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">
                        <div className="space-y-2">
                          <textarea
                            value={testResults[test.id] || ''}
                            onChange={(e) => setTestResults(prev => ({ ...prev, [test.id]: e.target.value }))}
                            className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                            rows={3}
                            placeholder="Enter test result..."
                          />
                          <Link to="/ultrasonogram/all/edit/builder/$id" params={{ id: String(test.id) }}>
                            <Button type="button" size="sm" variant="secondary" className="w-full">
                              Update Content
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center gap-3 pt-4">
                <Button type="submit" variant="default" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Report'}
                </Button>

                <Button type="button" variant="outline" onClick={handlePrint}>
                  Print
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export default EditUltrasonogramReport
