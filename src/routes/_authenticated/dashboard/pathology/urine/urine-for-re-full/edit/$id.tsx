import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FlaskConical, User } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Main } from "@/components/layout/main";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";

export const Route = createFileRoute(
  '/_authenticated/dashboard/pathology/urine/urine-for-re-full/edit/$id',
)({
  component: EditUrineForReFull,
})

// --------------------------------------------------
// ZOD SCHEMA
// --------------------------------------------------
const urineSchema = z.object({
  // --- PHYSICAL ---
  color: z.string().min(1, "Required"),
  appearance: z.string().min(1, "Required"),
  sediment: z.string().optional(),

  // --- MICROSCOPIC ---
  epithelialCells: z.string().optional(),
  rbcCells: z.string().optional(),
  pusCells: z.string().optional(),
  yeastCells: z.string().optional(),
  spermatozoa: z.string().optional(),

  // --- CRYSTALS ---
  uricAcidCrystals: z.string().optional(),
  calciumOxalate: z.string().optional(),
  triplePhosphate: z.string().optional(),
  amorphousDeposits: z.string().optional(),

  // --- CASTS / LPE ---
  hyalineCasts: z.string().optional(),
  granularCasts: z.string().optional(),
  rbcCasts: z.string().optional(),
  wbcCasts: z.string().optional(),
  epithelialCasts: z.string().optional(),

  // --- CHEMICAL ---
  urobilinogen: z.string().optional(),
  bilirubin: z.string().optional(),
  ketone: z.string().optional(),
  blood: z.string().optional(),
  protein: z.string().optional(),
  nitrite: z.string().optional(),
  leukocytes: z.string().optional(),
  glucose: z.string().optional(),
  specificGravity: z.string().optional(),
  reactionPh: z.string().optional(),
  ascorbicAcid: z.string().optional(),

  comments: z.string().optional(),
  machineId: z.string().optional(),
  testCarriedOutBy: z.string().optional(),
});

type UrineFormValues = z.infer<typeof urineSchema>;

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------
function EditUrineForReFull() {
  const {id} = Route.useParams();
  const navigate = useNavigate();
  const token = getCookie('accessToken');

  const form = useForm<UrineFormValues>({
    resolver: zodResolver(urineSchema),
    defaultValues: {
      machineId: "",
      testCarriedOutBy: "",
    },
  });

  // Fetch existing urine RE data
  const { data: urineReData } = useQuery({
    queryKey: ["urine-re", id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/urine-re/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch Urine RE report");
      const result = await res.json();
      return result.data;
    },
    enabled: !!token && !!id,
  });

  // Fetch machines data
  const { data: machinesData } = useQuery({
    queryKey: ["machine"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/machine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!token,
  });

  const machineList = machinesData?.data?.items || [];

  // Reset form when data is loaded
  useEffect(() => {
    if (urineReData) {
      form.reset({
        color: urineReData.color || '',
        appearance: urineReData.appearance || '',
        sediment: '',
        epithelialCells: '',
        rbcCells: '',
        pusCells: '',
        yeastCells: '',
        spermatozoa: '',
        uricAcidCrystals: '',
        calciumOxalate: '',
        triplePhosphate: '',
        amorphousDeposits: '',
        hyalineCasts: '',
        granularCasts: '',
        rbcCasts: '',
        wbcCasts: '',
        epithelialCasts: '',
        urobilinogen: '',
        bilirubin: '',
        ketone: '',
        blood: '',
        protein: '',
        nitrite: '',
        leukocytes: '',
        glucose: '',
        specificGravity: '',
        reactionPh: '',
        ascorbicAcid: '',
        comments: urineReData.remarks || '',
        machineId: urineReData.machine_id?.toString() || "",
        testCarriedOutBy: urineReData.test_carried_out_by || "",
      });
    }
  }, [urineReData, form]);

  // Mutation to update urine RE
  const updateUrineReMutation = useMutation({
    mutationFn: async (payload: UrineFormValues) => {
      console.log("Payload:", payload);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/urine-re/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_id: urineReData?.invoice_id,
          color: payload.color,
          appearance: payload.appearance,
          protein: payload.protein,
          glucose: payload.glucose,
          ketones: payload.ketone,
          blood: payload.blood,
          nitrite: payload.nitrite,
          leukocytes: payload.leukocytes,
          ph: payload.reactionPh,
          remarks: payload.comments,
          machine_id: payload.machineId ? parseInt(payload.machineId) : null,
          test_carried_out_by: payload.testCarriedOutBy,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update Urine RE report");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Report saved successfully!");
      console.log("API Response:", data);
      navigate({ to: '/dashboard/pathology/urine/urine-for-re-full' });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const handleView = () => alert("View triggered.");

  const onSubmit = (values: UrineFormValues) => {
    console.log("Urine Examination Report:", values);
    updateUrineReMutation.mutate(values);
  };

  return (
    <>
      {/* HEADER */}
      <AppHeader fixed />
      {/* MAIN */}
      <Main className="flex flex-1 flex-col gap-6">
        <div className="w-full min-w-[650px] max-w-[1100px] mx-auto px-4 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: '/dashboard/pathology/urine/urine-for-re-full' })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edit Urine Examination Report
                </h1>
                <p className="text-muted-foreground text-sm">Review and update urine examination findings</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {!urineReData && (
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardContent className="p-4">
                <p className="text-gray-500">Loading report data...</p>
              </CardContent>
            </Card>
          )}

          {/* Patient Information */}
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
                  invoiceNo: "UEX-4021",
                  patientName: "Hasina Begum",
                  age: "29 Years",
                  gender: "Female",
                }}
              />
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
                  <CardTitle className="text-lg font-bold">Test Results</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enter urine examination findings</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                {/* ------------------------------- */}
                {/* PHYSICAL EXAMINATION            */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Physical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["color", "appearance", "sediment"].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName.replace(/([A-Z])/g, " $1")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* ------------------------------- */}
                {/* MICROSCOPIC EXAMINATION         */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Microscopic Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "epithelialCells",
                      "rbcCells",
                      "pusCells",
                      "yeastCells",
                      "spermatozoa",
                    ].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName.replace(/([A-Z])/g, " $1")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* ------------------------------- */}
                {/* CRYSTALS                        */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Crystals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "uricAcidCrystals",
                      "calciumOxalate",
                      "triplePhosphate",
                      "amorphousDeposits",
                    ].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName.replace(/([A-Z])/g, " $1")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* ------------------------------- */}
                {/* CASTS / LPE                     */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Casts / LPE</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "hyalineCasts",
                      "granularCasts",
                      "rbcCasts",
                      "wbcCasts",
                      "epithelialCasts",
                    ].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName.replace(/([A-Z])/g, " $1")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* ------------------------------- */}
                {/* CHEMICAL EXAMINATION            */}
                {/* ------------------------------- */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Chemical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "urobilinogen",
                      "bilirubin",
                      "ketone",
                      "blood",
                      "protein",
                      "nitrite",
                      "leukocytes",
                      "glucose",
                      "specificGravity",
                      "reactionPh",
                      "ascorbicAcid",
                    ].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {fieldName.replace(/([A-Z])/g, " $1")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </section>

                {/* COMMENTS */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments / Remarks</FormLabel>
                      <FormControl>
                        <Input placeholder="Write notes..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />



                {/* TEST CARRIED OUT BY - MACHINE */}
                <FormField
                  control={form.control}
                  name="testCarriedOutBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Carried Out By (Machine)</FormLabel>
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



                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6">
                  <Button type="button" variant="outline" size="lg" onClick={handleView}>
                    View
                  </Button>
                  <Link to="/dashboard/pathology/urine/urine-for-re-full/report/$reportId" params={{ reportId: id }}>
                    <Button type="button" variant="outline" size="lg">
                      Print Preview
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={updateUrineReMutation.isPending || !urineReData}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
                  >
                    {updateUrineReMutation.isPending ? "Saving..." : "Save Report"}
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

