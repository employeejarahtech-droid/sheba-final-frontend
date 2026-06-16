// /pathology/semen/reports/edit/$reportId.tsx
import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, Link } from '@tanstack/react-router'

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";

import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute(
  "/_authenticated/dashboard/pathology/hormone/semen/edit/$reportId"
)({
  component: EditSemenReport,
});

// ------------- Zod Schema -------------
const semenAnalysisSchema = z.object({
  sampleCollection: z.string().min(1, "Required"),
  timeOfEjaculation: z.string().min(1, "Required"),
  timeOfExamination: z.string().min(1, "Required"),

  volume: z.string().min(1, "Required"),
  color: z.string().min(1, "Required"),
  odour: z.string().min(1, "Required"),
  consistency: z.string().min(1, "Required"),

  ph: z.string().min(1, "Required"),
  fructose: z.string().min(1, "Required"),

  pusCells: z.string().min(1, "Required"),
  epithelial: z.string().min(1, "Required"),
  rbc: z.string().min(1, "Required"),

  spermCount: z.string().min(1, "Required"),
  motility: z.string().min(1, "Required"),
  morphology: z.string().min(1, "Required"),

  comment: z.string().optional(),
  testCarriedOutBy: z.string().optional(),
  machineId: z.string().optional(),
});

type SemenFormValues = z.infer<typeof semenAnalysisSchema>;

// ------------- Component -------------
function EditSemenReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');

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

  const form = useForm<SemenFormValues>({
    resolver: zodResolver(semenAnalysisSchema),
    defaultValues: {
      sampleCollection: "",
      timeOfEjaculation: "",
      timeOfExamination: "",
      volume: "",
      color: "",
      odour: "",
      consistency: "",
      ph: "",
      fructose: "",
      pusCells: "",
      epithelial: "",
      rbc: "",
      spermCount: "",
      motility: "",
      morphology: "",
      comment: "",
      testCarriedOutBy: "",
      machineId: "",
    },
  });

  const onSubmit = (values: SemenFormValues) => {
    // Replace with actual save API call
    console.log("Semen Analysis Report saved:", values);
  };

  // TODO: Implement report generation
  // const handleReport = () => {
  //   // Placeholder for report generation (PDF/view)
  //   alert("Generate report (placeholder)");
  // };

  const handleClose = () => {
    // Placeholder for closing dialog / navigating back
    alert("Close (placeholder)");
  };
  return (
    <>
      <AppHeader fixed />

      <Main className="px-6 py-8 max-w-5xl mx-auto">

        <div className='max-w-[800px] mx-auto'>
          {/* Title */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Semen Analysis Report</h1>
            <Link to="/dashboard/hormone/semen">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back to Semen Tests
              </Button>
            </Link>
          </div>

          {/* Invoice / Patient info */}
          <div className="bg-white shadow rounded-xl p-6 border mb-8">
            <PatientInvoiceInfo
              invoiceInfo={{
                invoiceNo: "SEM-1207",
                patientName: "Patient Name",
                age: "—",
                gender: "Male",
              }}
            />
          </div>

          {/* Form Card */}
          <div className="bg-white shadow rounded-xl p-6 border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* GROUP 1: Report of Examination of Seminal Fluid */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Report of Examination of Seminal Fluid</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormField
                        control={form.control}
                        name="sampleCollection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Collection</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Masturbation / Coitus Interruptus" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="timeOfEjaculation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time of Ejaculation</FormLabel>
                            <FormControl>
                              <Input placeholder="HH:MM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="timeOfExamination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time of Examination</FormLabel>
                            <FormControl>
                              <Input placeholder="HH:MM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </section>

                {/* GROUP 2: Physical Examination */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Physical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume (mL)</FormLabel>
                            <FormControl><Input placeholder="Enter volume" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl><Input placeholder="Enter colour" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="odour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Odour</FormLabel>
                            <FormControl><Input placeholder="e.g., Foul / Normal" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="consistency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consistency</FormLabel>
                            <FormControl><Input placeholder="e.g., Viscous / Watery" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </section>

                {/* GROUP 3: Chemical Examination */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Chemical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ph"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>pH</FormLabel>
                          <FormControl><Input placeholder="Enter pH" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fructose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fructose</FormLabel>
                          <FormControl><Input placeholder="Enter fructose result" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* GROUP 4: Others */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Others</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="pusCells"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pus Cells (per HPF)</FormLabel>
                          <FormControl><Input placeholder="e.g., 0-2" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="epithelial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Epithelial</FormLabel>
                          <FormControl><Input placeholder="Enter epithelial cells" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rbc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RBC (per HPF)</FormLabel>
                          <FormControl><Input placeholder="Enter RBC" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* GROUP 5: Total Sperm Count */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Total Sperm Count</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="spermCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sperm Count (million/mL)</FormLabel>
                          <FormControl><Input placeholder="Enter count" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="motility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motility (%)</FormLabel>
                          <FormControl><Input placeholder="Enter motility %" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="morphology"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Morphology of Sperm (%)</FormLabel>
                          <FormControl><Input placeholder="Enter morphology %" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* COMMENT */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Comment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment / Conclusion</FormLabel>
                          <FormControl>
                            {/* I use a Textarea for longer notes; swap to Select if you prefer the dropdown in the screenshot */}
                            <Textarea placeholder="Add remarks, conclusion or select standard comment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* TEST CARRIED OUT BY */}
                <section className="border rounded-md p-4">
                  <h3 className="text-sm font-semibold mb-3">Test Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="testCarriedOutBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test carried out by</FormLabel>
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
                </section>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                  <Button type="submit" variant="success" className="flex-1">
                    {form.formState.isSubmitting ? "Saving..." : "Save"}
                  </Button>

                  <Link to="/dashboard/hormone/semen/report/$reportId" params={{ reportId: reportId }}>
                    <Button type="button" variant="default" className="flex-1">
                      Print Preview
                    </Button>
                  </Link>

                  <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
                    Close
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