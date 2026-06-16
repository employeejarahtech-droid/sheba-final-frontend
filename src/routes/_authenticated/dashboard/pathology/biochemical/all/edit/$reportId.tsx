import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Card, CardContent } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topNav } from '@/data/data';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/biochemical/all/edit/$reportId',
)({
  component: EditBiochemicalReport,
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
  biochemical_all_info: LabTest[]
}



function EditBiochemicalReport() {
  const { reportId } = Route.useParams();
  const router = useRouter();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();


  const [testResults, setTestResults] = useState<Record<number, string>>({});

  // Fetch Biochemical data for this invoice (includes invoice info + Biochemical records)
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["biochemical-invoice", reportId],
    queryFn: async (): Promise<InvoiceData> => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/biochemical-all/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch Biochemical data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize test results when data loads
  useEffect(() => {
    if (invoiceData?.biochemical_all_info) {
      const initialResults: Record<number, string> = {};
      invoiceData.biochemical_all_info.forEach(test => {
        if (test.id) {
          initialResults[test.id] = test.test_result || '';
        }
      });
      setTestResults(initialResults);
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: async (biochemicalId: number) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/biochemical-all/${biochemicalId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test_result: testResults[biochemicalId],
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update Biochemical record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biochemical-all", reportId] });
      queryClient.invalidateQueries({ queryKey: ["outdoor-invoice", reportId] });
      queryClient.invalidateQueries({ queryKey: ["biochemical-all"] });
      // Navigate back to list page after successful save
      router.navigate({ to: '/dashboard/pathology/biochemical/all' });
    },
  });

  const handleSaveAll = () => {
    // Save all test results and test IDs
    Object.keys(testResults).forEach(biochemicalId => {
      updateMutation.mutate(Number(biochemicalId));
    });
  };

  const handlePrint = () => {
    window.print();
  };

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

  const tests = invoiceData?.biochemical_all_info || [];
  const invoiceInformation = invoiceData?.invoice_information;

  return (
    <>
      {/* Header */}
      <AppHeader fixed />

      {/* Main */}
      <Main>
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard/biochemical/all">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Reports
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Report - Biochemical</h1>
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Biochemical Record ID</th>
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
                        <textarea
                          value={testResults[test.id] || ''}
                          onChange={(e) => setTestResults(prev => ({ ...prev, [test.id]: e.target.value }))}
                          className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                          rows={3}
                          placeholder="Enter test result..."
                        />
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