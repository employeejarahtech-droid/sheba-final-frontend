import { useEffect, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Activity, Trash2, Plus } from "lucide-react";
import { CustomReportHtmlEditor, type CustomReportHtmlEditorHandle } from "@/components/pathology/CustomReportHtmlEditor";

// The original (pre-template-designer) free-form custom test format: a
// flat, repeatable list of {test_name, test_result, normal_range} rows,
// serialized as { report_name, items } into result_text. Kept byte-for-byte
// unchanged so existing rows (e.g. edit/1, edit/2) keep working exactly as
// before — the dynamic, schema-driven path lives in DynamicCustomTestForm.
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

export function LegacyCustomTestForm({
  reportId,
  customTestData,
  machineList,
}: {
  reportId: number;
  customTestData: any;
  machineList: any[];
}) {
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

  const htmlEditorRef = useRef<CustomReportHtmlEditorHandle>(null);
  const [customHtml, setCustomHtml] = useState('');

  useEffect(() => {
    if (customTestData) {
      let items = [];
      let reportName = "Custom Test Report";
      let html = '';
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
            html = parsed.custom_html || '';
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

      setCustomHtml(html);
      form.reset({
        reportName: reportName,
        items: items,
        testCarriedOutBy: customTestData.test_carried_out_by || '',
        machineId: customTestData.machine_id ? String(customTestData.machine_id) : '',
        status: String(customTestData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTestData]);

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
        items: values.items,
        custom_html: htmlEditorRef.current?.getContent() || '',
      })
    };
    updateMutation.mutate(payload);
  };

  return (
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
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Form Type</Label>
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded">
                Legacy Format
              </span>
            </div>
          </div>
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

            {/* Additional Report Content */}
            <div>
              <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800 border-b pb-2">Additional Report Content</h2>
              <CustomReportHtmlEditor ref={htmlEditorRef} initialValue={customHtml} ready={!!customTestData} />
            </div>

            {/* Test Carried Out By — last field before submitting */}
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
  );
}
