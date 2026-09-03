import { useRef } from "react";
import { useForm } from "react-hook-form";
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
import { FileText, Activity } from "lucide-react";
import { CustomReportHtmlEditor, type CustomReportHtmlEditorHandle } from "@/components/pathology/CustomReportHtmlEditor";

type FormTemplateField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  unit?: string | null;
  normal_range?: string | null;
  required?: boolean;
  options?: string[];
  sort_order?: number;
};

type FormTemplate = {
  id: number;
  table_name: string;
  display_name: string;
  form_schema: FormTemplateField[];
};

// Values are kept as free text regardless of field.type (result_text is an
// opaque JSON blob with no downstream numeric computation) — "number" only
// changes which <input> renders, not how the value is validated/stored.
function buildDynamicSchema(schema: FormTemplateField[]) {
  const shape: Record<string, z.ZodTypeAny> = { status: z.union([z.literal('complete'), z.literal('incomplete')]), testCarriedOutBy: z.string().optional(), machineId: z.string().optional() };
  for (const f of schema) {
    shape[f.key] = f.required ? z.string().min(1, "Required") : z.string().optional();
  }
  return z.object(shape);
}

function buildDefaultValues(schema: FormTemplateField[], values: Record<string, string> | undefined) {
  const defaults: Record<string, string> = {};
  for (const f of schema) defaults[f.key] = values?.[f.key] ?? "";
  return defaults;
}

export function DynamicCustomTestForm({
  reportId,
  customTestData,
  machineList,
  formTemplate,
}: {
  reportId: number;
  customTestData: any;
  machineList: any[];
  formTemplate: FormTemplate;
}) {
  const navigate = useNavigate();
  const token = getCookie('accessToken');
  const queryClient = useQueryClient();

  const schema = formTemplate.form_schema || [];
  const sortedSchema = [...schema].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  let savedValues: Record<string, string> | undefined;
  let savedHtml = '';
  try {
    if (customTestData?.result_text) {
      const parsed = JSON.parse(customTestData.result_text);
      if (parsed && typeof parsed === 'object') {
        if (parsed.values) savedValues = parsed.values;
        savedHtml = parsed.custom_html || '';
      }
    }
  } catch (_) {
    // no prior structured data for this row yet — fields start blank
  }

  const htmlEditorRef = useRef<CustomReportHtmlEditorHandle>(null);

  const dynamicSchema = buildDynamicSchema(sortedSchema);
  // The field set is only known at runtime (built from form_template.form_schema),
  // so z.infer can't preserve literal key types here — type the form loosely
  // rather than fighting react-hook-form's generics with scattered `as` casts.
  type DynamicFormValues = Record<string, string>;

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(dynamicSchema) as any,
    defaultValues: {
      ...buildDefaultValues(sortedSchema, savedValues),
      testCarriedOutBy: customTestData?.test_carried_out_by || "",
      machineId: customTestData?.machine_id ? String(customTestData.machine_id) : "",
      status: String(customTestData?.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
    } as any,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: DynamicFormValues) => {
      const { status, testCarriedOutBy, machineId, ...fieldValues } = values as any;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/custom-tests-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_id: customTestData?.invoice_id,
          result_text: JSON.stringify({
            template_id: formTemplate.id,
            values: fieldValues,
            custom_html: htmlEditorRef.current?.getContent() || '',
          }),
          test_carried_out_by: testCarriedOutBy,
          machine_id: machineId ? parseInt(machineId) : null,
          status,
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

  const onSubmit = (values: DynamicFormValues) => updateMutation.mutate(values);

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
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 px-2 py-1 rounded">
                Custom Form &mdash; {formTemplate.display_name}
              </span>
            </div>
          </div>
          <FormField
            control={form.control}
            name={"status" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Status</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
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

      {/* Dynamic form fields */}
      <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{formTemplate.display_name}</CardTitle>
              <p className="text-xs text-gray-600 dark:text-gray-400">Enter findings for this custom test</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              {sortedSchema.map((f) => (
                <div key={f.key} className="flex gap-3 items-start border p-3 rounded-lg bg-gray-50/50">
                  {/* Test Name — fixed by the template, read-only here */}
                  <div className="flex-1">
                    <Label className="text-xs">Test Name</Label>
                    <div className="mt-2 flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      {f.label}{f.required ? <span className="text-destructive ml-1">*</span> : null}
                    </div>
                  </div>

                  {/* Result — the only editable cell in the row */}
                  <FormField
                    control={form.control}
                    name={f.key as any}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">
                          Result{f.unit ? <span className="text-muted-foreground font-normal"> ({f.unit})</span> : null}
                        </FormLabel>
                        <FormControl>
                          {f.type === 'textarea' ? (
                            <Textarea className="min-h-[80px]" {...field} />
                          ) : f.type === 'select' ? (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {(f.options || []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input type={f.type === 'number' ? 'number' : 'text'} {...field} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Normal Range — fixed by the template, read-only here */}
                  <div className="flex-1">
                    <Label className="text-xs">Normal Range</Label>
                    <div className="mt-2 flex min-h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                      {f.normal_range || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Report Content */}
            <div>
              <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800 border-b pb-2">Additional Report Content</h2>
              <CustomReportHtmlEditor ref={htmlEditorRef} initialValue={savedHtml} ready={!!customTestData} />
            </div>

            {/* Test Carried Out By — last field before submitting */}
            <div>
              <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800 border-b pb-2">Test Information</h2>
              <FormField
                control={form.control}
                name={"testCarriedOutBy" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Carried Out By</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          const selectedMachine = machineList.find((m: any) => m.name === value);
                          if (selectedMachine) {
                            field.onChange(value);
                            form.setValue('machineId' as any, String(selectedMachine.id));
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
