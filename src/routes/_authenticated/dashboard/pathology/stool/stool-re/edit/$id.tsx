import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Main } from "@/components/layout/main";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { AppHeader } from "@/components/layout/app-header";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FlaskConical, User } from "lucide-react";

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/stool/stool-re/edit/$id',
)({
  component: EditStoolRe,
})

// --------------------------------------------------
// ZOD SCHEMA
// --------------------------------------------------
const stoolSchema = z.object({
  // --- PHYSICAL ---
  colour: z.string().min(1, "Required"),
  consistency: z.string().min(1, "Required"),
  mucous: z.string().optional(),
  blood: z.string().optional(),
  helminths: z.string().optional(),

  // --- CHEMICAL ---
  reaction: z.string().optional(),
  reducingSubstance: z.string().optional(),
  occultBlood: z.string().optional(),
  bilePigments: z.string().optional(),
  bileSalts: z.string().optional(),

  // --- MICROSCOPIC ---
  ovaOf: z.string().optional(),
  cystsOf: z.string().optional(),
  larvaOf: z.string().optional(),
  trophozoiteOf: z.string().optional(),
  pusCells: z.string().optional(),
  epithelialCells: z.string().optional(),
  rbc: z.string().optional(),
  macrophage: z.string().optional(),
  vegetableCells: z.string().optional(),
  undigestedFood: z.string().optional(),
  fatGlobules: z.string().optional(),
  others: z.string().optional(),

  comments: z.string().optional(),
  testCarriedOutBy: z.string().optional(),
  machineId: z.string().optional(),
});

type StoolFormValues = z.infer<typeof stoolSchema>;

// Helper function to format form field names to friendly labels
const getFieldLabel = (fieldName: string) => {
  if (fieldName === "colour") return "Colour";
  if (fieldName === "rbc") return "RBC";
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------
function EditStoolRe() {
  const { id } = Route.useParams();
  const token = getCookie('accessToken');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<StoolFormValues>({
    resolver: zodResolver(stoolSchema),
    defaultValues: {
      colour: "",
      consistency: "",
      mucous: "",
      blood: "",
      helminths: "",
      reaction: "",
      reducingSubstance: "",
      occultBlood: "",
      bilePigments: "",
      bileSalts: "",
      ovaOf: "",
      cystsOf: "",
      larvaOf: "",
      trophozoiteOf: "",
      pusCells: "",
      epithelialCells: "",
      rbc: "",
      macrophage: "",
      vegetableCells: "",
      undigestedFood: "",
      fatGlobules: "",
      others: "",
      comments: "",
      testCarriedOutBy: "",
      machineId: "",
    },
  });

  // Fetch existing stool R/E data
  const { data: stoolData } = useQuery({
    queryKey: ["stool-re", id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stool-re/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch stool RE report");
      const result = await res.json();
      return result.data;
    },
    enabled: !!token && !!id,
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

  // Reset form values when loaded
  useEffect(() => {
    if (stoolData) {
      form.reset({
        colour: stoolData.color || stoolData.colour || "",
        consistency: stoolData.consistency || "",
        mucous: stoolData.mucous || "",
        blood: stoolData.blood || stoolData.occult_blood || "",
        helminths: stoolData.helminths || "",
        reaction: stoolData.reaction || "",
        reducingSubstance: stoolData.reducingSubstance || "",
        occultBlood: stoolData.occultBlood || "",
        bilePigments: stoolData.bilePigments || "",
        bileSalts: stoolData.bileSalts || "",
        ovaOf: stoolData.ovaOf || "",
        cystsOf: stoolData.cystsOf || "",
        larvaOf: stoolData.larvaOf || "",
        trophozoiteOf: stoolData.trophozoiteOf || "",
        pusCells: stoolData.pusCells || stoolData.pus_cells || "",
        epithelialCells: stoolData.epithelialCells || stoolData.epithelium || "",
        rbc: stoolData.rbc || "",
        macrophage: stoolData.macrophage || "",
        vegetableCells: stoolData.vegetableCells || "",
        undigestedFood: stoolData.undigestedFood || "",
        fatGlobules: stoolData.fatGlobules || "",
        others: stoolData.others || "",
        comments: stoolData.remarks || stoolData.comments || "",
        testCarriedOutBy: stoolData.test_carried_out_by || "",
        machineId: stoolData.machine_id?.toString() || "",
      });
    }
  }, [stoolData, form]);

  // PUT mutation
  const updateStoolMutation = useMutation({
    mutationFn: async (data: StoolFormValues) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stool-re/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            invoice_id: stoolData?.invoice_id,
            color: data.colour,
            consistency: data.consistency,
            mucous: data.mucous || null,
            blood: data.blood || null,
            helminths: data.helminths || null,
            reaction: data.reaction || null,
            reducingSubstance: data.reducingSubstance || null,
            occultBlood: data.occultBlood || null,
            bilePigments: data.bilePigments || null,
            bileSalts: data.bileSalts || null,
            ovaOf: data.ovaOf || null,
            cystsOf: data.cystsOf || null,
            larvaOf: data.larvaOf || null,
            trophozoiteOf: data.trophozoiteOf || null,
            pusCells: data.pusCells || null,
            epithelialCells: data.epithelialCells || null,
            rbc: data.rbc || null,
            macrophage: data.macrophage || null,
            vegetableCells: data.vegetableCells || null,
            undigestedFood: data.undigestedFood || null,
            fatGlobules: data.fatGlobules || null,
            others: data.others || null,
            remarks: data.comments || null,
            test_carried_out_by: data.testCarriedOutBy || null,
            machine_id: data.machineId ? parseInt(data.machineId) : null,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update stool RE report");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stool-re", id] });
      toast.success(data.message || "Stool RE report updated successfully");
      navigate({ to: '/dashboard/pathology/stool/stool-re' });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update stool RE report");
    },
  });

  const onSubmit = (values: StoolFormValues) => {
    console.log("Stool Examination Report:", values);
    updateStoolMutation.mutate(values);
  };

  return (
    <>
      {/* Header */}
      <AppHeader fixed />

      {/* Main Content */}
      <Main className="flex flex-1 flex-col gap-6">
        <div className="w-full min-w-[650px] max-w-[800px] mx-auto px-4 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: '/dashboard/pathology/stool/stool-re' })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Stool Examination Report
                </h1>
                <p className="text-muted-foreground text-sm">Review and update stool routine examination findings</p>
              </div>
            </div>
          </div>

          {/* Patient Information Card */}
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
                  invoiceNo: stoolData?.invoice_id ? `RPT-${stoolData.invoice_id}` : "—",
                  patientName: stoolData?.outdoor_invoice?.patient_name || "—",
                  age: stoolData?.outdoor_invoice?.age ? `${stoolData.outdoor_invoice.age} Years` : "—",
                  gender: stoolData?.outdoor_invoice?.sex || "—",
                }}
              />
            </CardContent>
          </Card>

          {/* Test Results Card */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Stool Test Results</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enter findings for physical, chemical, and microscopic examinations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Physical Examination */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Physical Examination</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {["colour", "consistency", "mucous", "blood", "helminths"].map(
                        (fieldName) => (
                          <FormField
                            key={fieldName}
                            control={form.control}
                            name={fieldName as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{getFieldLabel(fieldName)}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Chemical Examination */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Chemical Examination</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        "reaction",
                        "reducingSubstance",
                        "occultBlood",
                        "bilePigments",
                        "bileSalts",
                      ].map((fieldName) => (
                        <FormField
                          key={fieldName}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{getFieldLabel(fieldName)}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Microscopic Examination */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Microscopic Examination</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        "ovaOf",
                        "cystsOf",
                        "larvaOf",
                        "trophozoiteOf",
                        "pusCells",
                        "epithelialCells",
                        "rbc",
                        "macrophage",
                        "vegetableCells",
                        "undigestedFood",
                        "fatGlobules",
                        "others",
                      ].map((fieldName) => (
                        <FormField
                          key={fieldName}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{getFieldLabel(fieldName)}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Test Comments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Additional Information</h2>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="comments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comments / Remarks</FormLabel>
                            <FormControl>
                              <Input placeholder="Additional notes..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Test Carried Out By */}
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
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-between gap-3 pt-4">
                    <Button type="submit" variant="success" className="flex-1" disabled={updateStoolMutation.isPending}>
                      {updateStoolMutation.isPending ? "Saving..." : "Save Report"}
                    </Button>

                    <Link to="/dashboard/pathology/stool/stool-re/report/$reportId" params={{ reportId: id }}>
                      <Button type="button" variant="warning" className="flex-1">
                        Print Preview
                      </Button>
                    </Link>

                    <Button type="button" variant="info" className="flex-1" onClick={() => navigate({ to: '/dashboard/pathology/stool/stool-re' })}>
                      View
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
