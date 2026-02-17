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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute(
  '/_authenticated/pathology/urine/urine-for-re-full/edit/$id',
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
      navigate({ to: "/pathology/urine/urine-for-re-full" });
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
      <Header>
        <TopNav
          links={[
            { title: "Overview", href: "dashboard/overview", isActive: true },
          ]}
        />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* MAIN */}
      <Main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Urine Examination Report</h1>

          {/* Loading State */}
          {!urineReData && (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500">Loading report data...</p>
            </div>
          )}

          {/* INVOICE */}
          <div className="bg-white shadow rounded-xl p-6 border mb-8">
            <PatientInvoiceInfo
              invoiceInfo={{
                invoiceNo: "UEX-4021",
                patientName: "Hasina Begum",
                age: "29 Years",
                gender: "Female",
              }}
            />
          </div>

          {/* FORM */}
          <div className="bg-white shadow rounded-xl p-6 border">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>

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



                {/* BUTTONS */}
                <div className="flex justify-between gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="success"
                    className="flex-1"
                    disabled={updateUrineReMutation.isPending || !urineReData}
                  >
                    {updateUrineReMutation.isPending ? "Saving..." : "Save Report"}
                  </Button>
                  <Link to="/pathology/urine/urine-for-re-full/report/$reportId" params={{ reportId: id }}>
                      <Button type="button" variant="warning" className="flex-1">
                      Print Preview
                    </Button>
                  </Link>
                  <Button type="button" variant="info" className="flex-1" onClick={handleView}>
                    View
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </Main>
    </>
  );
}

