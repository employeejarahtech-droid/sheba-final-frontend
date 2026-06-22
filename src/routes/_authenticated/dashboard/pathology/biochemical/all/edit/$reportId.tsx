import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { ArrowLeft, FlaskConical, User, Activity } from 'lucide-react';

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
  machine_id: number | null
  test_carried_out_by: string | null
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
  const [testCarriedOutBy, setTestCarriedOutBy] = useState('');
  const [machineId, setMachineId] = useState('');

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

  // Fetch machines for "Test Carried Out By"
  const { data: machinesData } = useQuery({
    queryKey: ["machine"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/machine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch machines");
      return res.json();
    },
    enabled: !!token,
  });
  const machineList = machinesData?.data?.items || [];

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
      const first = invoiceData.biochemical_all_info[0];
      setTestCarriedOutBy(first?.test_carried_out_by || '');
      setMachineId(first?.machine_id ? String(first.machine_id) : '');
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
            machine_id: machineId ? parseInt(machineId) : null,
            test_carried_out_by: testCarriedOutBy || null,
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
    router.navigate({
      to: '/dashboard/pathology/biochemical/all/report/$reportId',
      params: { reportId },
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

  const tests = invoiceData?.biochemical_all_info || [];
  const invoiceInformation = invoiceData?.invoice_information;

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <div className="w-full min-w-[650px] max-w-[1100px] mx-auto px-4 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.navigate({ to: '/dashboard/pathology/biochemical/all' })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Biochemical Report
                </h1>
                <p className="text-muted-foreground text-sm">Review and update laboratory test findings</p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          {invoiceInformation && (
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
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
                    invoiceNo: `RPT-${invoiceInformation.id}`,
                    patientName: invoiceInformation.patient_name,
                    age: invoiceInformation.age,
                    gender: invoiceInformation.sex,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Test Carried Out By */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Test Carried Out By</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Select the machine used for these tests</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Select
                value={testCarriedOutBy}
                onValueChange={(value) => {
                  const selectedMachine = machineList.find((m: any) => m.name === value);
                  if (selectedMachine) {
                    setTestCarriedOutBy(value);
                    setMachineId(String(selectedMachine.id));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {machineList.map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.name}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Biochemical Test Results</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enter findings for each test</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAll(); }}>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full">
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
                          className={`${index % 2 === 0 ? `bg-white` : `bg-gray-50`} hover:bg-gray-100/80 transition-colors`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 border-b">{test.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 border-b">
                            {test.test_name ? (
                              <div>
                                <div className="font-medium text-gray-900">{test.test_name}</div>
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
                              className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring focus:ring-blue-300 transition-shadow bg-white text-gray-900"
                              rows={3}
                              placeholder="Enter test result..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6">
                  <Button type="button" variant="outline" size="lg" onClick={handlePrint}>
                    Print
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={updateMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Report'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}