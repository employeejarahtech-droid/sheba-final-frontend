import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCookie } from '@/lib/cookies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { ArrowLeft, FlaskConical, Sparkles, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/hematology/all/edit/$id/',
)({
  component: EditReportHematology,
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
  hematology_all_info: LabTest[]
}



const TEST_DEFAULTS: Record<string, { range: string; val: string }> = {
  "Blood for HB %": {
    range: "Male: 13.5 - 17.5 g/dL\nFemale: 12.0 - 15.5 g/dL",
    val: "14.0 g/dL"
  },
  "Blood for RBC": {
    range: "Male: 4.5 - 5.9 M/cmm\nFemale: 3.8 - 5.2 M/cmm",
    val: "4.8 M/cmm"
  },
  "Blood for ESR.": {
    range: "Male: 0 - 10 mm/1st hr\nFemale: 0 - 20 mm/1st hr",
    val: "10 mm/1st hr"
  },
  "Total WBC Count": {
    range: "4,000 - 11,000 /cmm",
    val: "7,500 /cmm"
  },
  "Neutrophil": {
    range: "40 - 75 %",
    val: "60%"
  },
  "Lymphocyte": {
    range: "20 - 50 %",
    val: "30%"
  },
  "Monocyte": {
    range: "2 - 10 %",
    val: "6%"
  },
  "Eosinophil": {
    range: "0 - 6 %",
    val: "3%"
  },
  "Basophil": {
    range: "0 - 2 %",
    val: "0.5%"
  },
  "APTT": {
    range: "25 - 35 Sec",
    val: "30 Sec"
  },
  "Bleeding Time (BT)": {
    range: "1 - 3 Min",
    val: "2 Min"
  },
  "Clotting Time (CT)": {
    range: "2 - 7 Min",
    val: "5 Min"
  },
  "Platelet Count": {
    range: "1.5 - 4.0 lac/cmm",
    val: "2.5 lac/cmm"
  },
  "Platelate count": {
    range: "1.5 - 4.0 lac/cmm",
    val: "2.5 lac/cmm"
  },
  "Reticulocyte Count": {
    range: "0.5 - 2.5 %",
    val: "1.5%"
  },
  "Blood for MP": {
    range: "Negative / Not Found",
    val: "Negative"
  },
  "Total Circulating Eosinophil": {
    range: "40 - 440 /cmm",
    val: "200 /cmm"
  },
  "Blood Sugar 2hr (CUS)": {
    range: "< 140 mg/dL",
    val: "110 mg/dL"
  },
  "Serum Electrolytess": {
    range: "Na: 135-145, K: 3.5-5.0, Cl: 98-107, HCO3: 22-29 mmol/L",
    val: "Na: 140, K: 4.0, Cl: 102, HCO3: 25 mmol/L"
  },
  "Semen Analysis": {
    range: "Volume: 1.5-5.0 ml, Count: >15 M/ml, Motility: >40%",
    val: "Volume: 3.0 ml, Count: 60 M/ml, Motility: 65%"
  },
  "Sputum For AFB": {
    range: "Negative / Not Found",
    val: "Negative"
  },
  "Skin Scraping for Fungus": {
    range: "No fungal elements seen",
    val: "No fungal elements seen"
  },
  "Culture & Sensitivity": {
    range: "No growth after 48 hrs incubation",
    val: "No growth after 48 hours of incubation"
  },
  "Fungal Culture": {
    range: "No fungal growth after incubation",
    val: "No fungal growth after incubation"
  }
};

function EditReportHematology() {
  const { id } = Route.useParams();
  const router = useRouter();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();


  const [testResults, setTestResults] = useState<Record<number, string>>({});

  // Fetch Hematology data for this invoice (includes invoice info + Hematology records)
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["hematology-invoice", id],
    queryFn: async (): Promise<InvoiceData> => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hematology-all/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch Hematology data (${res.status}: ${res.statusText})`);
      }

      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
  });

  // Initialize test results when data loads
  useEffect(() => {
    if (invoiceData?.hematology_all_info) {
      const initialResults: Record<number, string> = {};
      invoiceData.hematology_all_info.forEach(test => {
        if (test.id) {
          initialResults[test.id] = test.test_result || '';
        }
      });
      setTestResults(initialResults);
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: async (hematologyId: number) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hematology-all/${hematologyId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test_result: testResults[hematologyId],
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update Hematology record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hematology-all", id] });
      queryClient.invalidateQueries({ queryKey: ["outdoor-invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["hematology-all"] });
      // Navigate back to list page after successful save
      router.navigate({ to: '/dashboard/pathology/hematology/all' });
    },
  });

  const handleSaveAll = () => {
    // Save all test results and test IDs
    Object.keys(testResults).forEach(hematologyId => {
      updateMutation.mutate(Number(hematologyId));
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getNormalValue = (testName: string | null) => {
    if (!testName) return null;
    const keys = Object.keys(TEST_DEFAULTS);
    const matchedKey = keys.find(k => k.toLowerCase().trim() === testName.toLowerCase().trim());
    return matchedKey ? TEST_DEFAULTS[matchedKey] : null;
  };

  const handleFillNormalValue = (testId: number, testName: string | null) => {
    const defaultInfo = getNormalValue(testName);
    if (defaultInfo) {
      setTestResults(prev => ({ ...prev, [testId]: defaultInfo.val }));
      toast.success(`Filled normal value for "${testName}"`);
    } else {
      toast.error(`No default normal value configured for "${testName || 'this test'}"`);
    }
  };

  const handleFillAllEmpty = () => {
    let filledCount = 0;
    const updatedResults = { ...testResults };
    tests.forEach(test => {
      if (test.id && (!updatedResults[test.id] || updatedResults[test.id].trim() === '')) {
        const defaultInfo = getNormalValue(test.test_name);
        if (defaultInfo) {
          updatedResults[test.id] = defaultInfo.val;
          filledCount++;
        }
      }
    });
    if (filledCount > 0) {
      setTestResults(updatedResults);
      toast.success(`Successfully filled normal values for ${filledCount} empty field(s).`);
    } else {
      toast.info("No empty fields were eligible for auto-filling.");
    }
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

  const tests = invoiceData?.hematology_all_info || [];
  const invoiceInformation = invoiceData?.invoice_information;

  return (
    <>
      {/* Header */}
      <AppHeader fixed /> 

      {/* Main */}
      <Main className="flex flex-1 flex-col gap-6">
        <div className="w-full min-w-[650px] max-w-[1100px] mx-auto px-4 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.navigate({ to: '/dashboard/pathology/hematology/all' })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Hematology Report
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

          {/* Test Results */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Hematology Test Results</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enter findings for each test</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAll(); }}>
              
              {/* Auto-fill Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-rose-50/50 border border-rose-100 p-4 rounded-xl">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-rose-800">Quick Tools:</span> Fill in the laboratory test findings below. Use the button to automatically populate normal default values for all empty fields.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillAllEmpty}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border-rose-200 gap-1.5 flex items-center shadow-sm self-stretch sm:self-auto justify-center"
                >
                  <Sparkles className="h-4 w-4" />
                  Auto-fill Normal Values
                </Button>
              </div>

              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-[15%]">Record ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-[25%]">Test Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-[25%]">Reference Range</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-[25%]">Test Result</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-[10%]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {tests.map((test, index) => {
                    const normalInfo = getNormalValue(test.test_name);
                    return (
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
                        <td className="px-4 py-3 text-sm text-gray-600 border-b whitespace-pre-line">
                          {normalInfo?.range || (
                            <span className="text-gray-400 text-xs italic">No range configured</span>
                          )}
                        </td>

                        {/* Input field for testResult */}
                        <td className="px-4 py-3 text-sm text-gray-700 border-b">
                          <textarea
                            value={testResults[test.id] || ''}
                            onChange={(e) => setTestResults(prev => ({ ...prev, [test.id]: e.target.value }))}
                            className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring focus:ring-blue-300 transition-shadow bg-white text-gray-900"
                            rows={2}
                            placeholder="Enter test result..."
                          />
                        </td>

                        {/* Quick Actions */}
                        <td className="px-4 py-3 text-sm border-b text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            {normalInfo && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                                onClick={() => handleFillNormalValue(test.id, test.test_name)}
                                title="Set to Normal Value"
                              >
                                <Sparkles className="h-3 w-3" />
                                Normal
                              </Button>
                            )}
                            {testResults[test.id] && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setTestResults(prev => ({ ...prev, [test.id]: '' }))}
                                title="Clear result"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
export default EditReportHematology
