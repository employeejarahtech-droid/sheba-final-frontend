import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Main } from "@/components/layout/main";
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, User, Activity, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/custom-tests/edit/$id',
)({
  component: EditCustomTest,
})

// ─────────────────────────────
// FORM SCHEMA
// ─────────────────────────────
const formSchema = z.object({
  reportName: z.string().min(1, "Required"),
  items: z.array(z.object({
    test_name: z.string().min(1, "Required"),
    test_result: z.string().optional(),
    normal_range: z.string().optional(),
  })),
  testCarriedOutBy: z.string().optional(),
  machineId: z.string().optional(),
  status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type CustomTestFormValues = z.infer<typeof formSchema>;

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────
function EditCustomTest() {
  const { id } = Route.useParams();

  const navigate = useNavigate();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();

  const form = useForm<CustomTestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportName: "Custom Test Report",
      items: [{ test_name: '', test_result: '', normal_range: '' }],
      testCarriedOutBy: "",
      machineId: "",
      status: "incomplete",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const reportId = Number(id);

  // Fetch custom test data
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

  useEffect(() => {
    if (customTestData) {
      let items = [];
      let reportName = "Custom Test Report";
      try {
        if (customTestData.result_text) {
          const parsed = JSON.parse(customTestData.result_text);
          if (Array.isArray(parsed)) {
            // Old format
            items = parsed.length > 0 ? parsed : [];
          } else if (parsed && typeof parsed === 'object') {
            // New format
            reportName = parsed.report_name || "Custom Test Report";
            items = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : [];
          }
        }
      } catch (e) {
        // Fallback for old single-text data
        if (customTestData.result_text) {
          items = [{ test_name: 'Test', test_result: customTestData.result_text, normal_range: '' }];
        }
      }

      if (items.length === 0) {
        items = [{ test_name: '', test_result: '', normal_range: '' }];
      }

      form.reset({
        reportName: reportName,
        items: items,
        testCarriedOutBy: customTestData.test_carried_out_by || '',
        machineId: customTestData.machine_id ? String(customTestData.machine_id) : '',
        status: String(customTestData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
      })
    }
  }, [customTestData, form]);

  const updateMutation = useMutation({
    mutationFn: async (payload: CustomTestFormValues & { result_text: string }) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/custom-tests-results`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                invoice_id: customTestData?.invoice_id,
                result_text: payload.result_text,
                test_carried_out_by: payload.testCarriedOutBy,
                machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                status: payload.status,
            }),
        });

        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Failed to update test");
        }
        return res.json();
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["custom-tests"] });
        queryClient.invalidateQueries({ queryKey: ["custom-tests-detail", reportId] });
        toast.success(data.message || "Custom test result updated successfully!");
        navigate({ to: '/dashboard/pathology/custom-tests' });
    },
    onError: (error: any) => {
        toast.error(error.message || "Something went wrong");
    },
  });

  const onSubmit = (values: CustomTestFormValues) => {
    const payload = {
      ...values,
      result_text: JSON.stringify({
        report_name: values.reportName,
        items: values.items
      })
    };
    updateMutation.mutate(payload);
  };

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

          <Form {...form}>
          {/* Status */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Report Status</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Mark report as complete or incomplete</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="incomplete">Incomplete</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom Test Form Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Custom Test Results</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enter findings for this custom test</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div>
                    <div className="mb-6">
                      <FormField
                        control={form.control}
                        name="reportName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-800">Report Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Lipid Profile" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex justify-between items-center mt-8">
                      <span>Test Content</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ test_name: '', test_result: '', normal_range: '' })}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add Row
                      </Button>
                    </h2>
                    
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-start border p-3 rounded-lg bg-gray-50/50">
                          <FormField
                            control={form.control}
                            name={`items.${index}.test_name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Test Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Blood Sugar" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.test_result`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Result</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="e.g. 5.5" className="min-h-[80px]" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.normal_range`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Normal Range</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="e.g. 4.0 - 6.0" className="min-h-[80px]" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Test Carried Out By */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800 border-b pb-2">Test Information</h2>
                    <FormField
                      control={form.control}
                      name="testCarriedOutBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Carried Out By</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                const selectedMachine = machineList.find((m: any) => m.name === value);
                                if (selectedMachine) {
                                  field.onChange(value);
                                  form.setValue('machineId', String(selectedMachine.id));
                                }
                              }}
                              value={field.value}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-between gap-3 pt-4">
                    <Button type="submit" variant="success" className="flex-1">
                      Save Report
                    </Button>

                    <Link to="/dashboard/pathology/custom-tests/report/$reportId" params={{ reportId: String(reportId) }}>
                      <Button type="button" variant="warning" className="flex-1 w-full">
                        Print Preview
                      </Button>
                    </Link>

                    <Button type="button" variant="info" className="flex-1" onClick={() => navigate({ to: '/dashboard/pathology/custom-tests' })}>
                      View
                    </Button>
                  </div>
                </form>
            </CardContent>
          </Card>
          </Form>
        </div>
      </Main>
    </>
  );
}
