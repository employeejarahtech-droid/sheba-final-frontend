import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from "@/components/layout/main";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Card, CardContent } from "@/components/ui/card";
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topNav } from '@/data/data';
import { useState, useEffect } from 'react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/x-ray/all/edit/$id',
)({
  component: EditXRayReport,
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
  xray_all_info: LabTest[]
}



function EditXRayReport() {
  const { id } = Route.useParams();
  const router = useRouter();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();


  const [testResults, setTestResults] = useState<Record<number, string>>({});

  // Fetch X-Ray data for this invoice (includes invoice info + X-Ray records)
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["xray-invoice", id],
    queryFn: async (): Promise<InvoiceData> => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/xray-all/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch X-Ray data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize test results when data loads
  useEffect(() => {
    if (invoiceData?.xray_all_info) {
      const initialResults: Record<number, string> = {};
      invoiceData.xray_all_info.forEach(test => {
        if (test.id) {
          initialResults[test.id] = test.test_result || '';
        }
      });
      setTestResults(initialResults);
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: async (xrayId: number) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/xray-all/${xrayId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test_result: testResults[xrayId],
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update X-Ray record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xray-all", id] });
      queryClient.invalidateQueries({ queryKey: ["outdoor-invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["xray-all"] });
      // Navigate back to list page after successful save
      router.navigate({ to: '/dashboard/x-ray/all' });
    },
  });

  const handleSaveAll = () => {
    // Save all test results
    Object.keys(testResults).forEach(xrayId => {
      updateMutation.mutate(Number(xrayId));
    });
  };

  // const handlePrint = () => {
  //   // Navigate to print page in same tab
  //   router.navigate({ to: '/dashboard/x-ray/all/print/$id', params: { id } });
  // };

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <TopNav links={topNav} />
          <div className="ms-auto flex items-center space-x-4">
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        </Main>
      </>
    );
  }

  const tests = invoiceData?.xray_all_info || [];
  const invoiceInformation = invoiceData?.invoice_information;

  return (
    <>
      {/* Header */}
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main */}
      <Main>
        <div className="mb-4">
          <Link to="/dashboard/all">
            <Button variant="outline" size="sm">
              ← Back to X-Ray Reports
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Report - X-Ray</h1>

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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">X-Ray Record ID</th>
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
                          <div className="flex gap-2">
                            <Link to="/dashboard/all/edit/builder/$id" params={{ id: String(test.id) }} className="flex-1">
                              <Button type="button" size="sm" variant="secondary" className="w-full">
                                Update Content
                              </Button>
                            </Link>
                            <Link to="/dashboard/all/print/$id" params={{ id: String(test.id) }} className="flex-1">
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
            </form>

          </CardContent>
        </Card>
      </Main>
    </>
  );
}
export default EditXRayReport
