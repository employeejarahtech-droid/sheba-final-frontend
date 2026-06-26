// /pathology/semen/reports/edit/$reportId.tsx
import PatientInvoiceInfo from '@/components/pathology/PatientInvoiceInfo'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";
import { toast } from "sonner";

import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import {
  ArrowLeft,
  Calculator,
  Droplets,
  Eye,
  FlaskConical,
  Layers,
  MessageSquare,
  Stethoscope,
  User,
  Activity,
} from 'lucide-react';

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
  status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type SemenFormValues = z.infer<typeof semenAnalysisSchema>;

// ------------- Expected result option lists -------------
const SAMPLE_COLLECTION_OPTIONS = ["Masturbation", "Coitus Interruptus", "Condom Method"];
const COLOR_OPTIONS = ["Greyish White", "White", "Yellowish", "Yellow", "Brownish", "Reddish"];
const ODOUR_OPTIONS = ["Characteristic (Sui generis)", "Normal", "Foul", "Pungent"];
const CONSISTENCY_OPTIONS = ["Viscous", "Highly Viscous", "Watery", "Liquefied"];
const FRUCTOSE_OPTIONS = ["Present", "Absent"];
const EPITHELIAL_OPTIONS = ["Nil", "Few (0-2/HPF)", "Moderate (3-5/HPF)", "Plenty (>5/HPF)"];
const PUS_CELLS_OPTIONS = ["Nil", "0-2", "2-4", "4-6", "6-8", "8-10", "10-15", "Plenty"];
const RBC_OPTIONS = ["Nil", "0-2", "2-4", "4-6", "6-8", "8-10", "10-15", "Plenty"];

// Shared card header styling (matches outdoor/master/tests/create)
const cardHeaderClass =
  "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0";

// ------------- Component -------------
function EditSemenReport() {
  const { reportId } = Route.useParams();
  const token = getCookie('accessToken');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch existing semen report
  const { data: semenData } = useQuery({
    queryKey: ["semen", reportId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/semen/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch semen analysis report");
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
      status: "incomplete",
    },
  });

  // Populate the form once the existing report is loaded
  useEffect(() => {
    if (semenData) {
      form.reset({
        sampleCollection: semenData.sample_collection || "",
        timeOfEjaculation: semenData.time_of_ejaculation || "",
        timeOfExamination: semenData.time_of_examination || "",
        volume: semenData.volume || "",
        color: semenData.color || "",
        odour: semenData.odour || "",
        consistency: semenData.consistency || "",
        ph: semenData.ph || "",
        fructose: semenData.fructose || "",
        pusCells: semenData.pus_cells || "",
        epithelial: semenData.epithelial || "",
        rbc: semenData.rbc || "",
        spermCount: semenData.count || "",
        motility: semenData.motility || "",
        morphology: semenData.morphology || "",
        comment: semenData.remarks || "",
        testCarriedOutBy: semenData.test_carried_out_by || "",
        machineId: semenData.machine_id?.toString() || "",
        status: String(semenData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
      });
    }
  }, [semenData, form]);

  const updateSemenMutation = useMutation({
    mutationFn: async (values: SemenFormValues) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/semen/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_id: semenData?.invoice_id,
          sample_collection: values.sampleCollection,
          time_of_ejaculation: values.timeOfEjaculation,
          time_of_examination: values.timeOfExamination,
          volume: values.volume,
          color: values.color,
          odour: values.odour,
          consistency: values.consistency,
          ph: values.ph,
          fructose: values.fructose,
          pus_cells: values.pusCells,
          epithelial: values.epithelial,
          rbc: values.rbc,
          count: values.spermCount,
          motility: values.motility,
          morphology: values.morphology,
          remarks: values.comment,
          test_carried_out_by: values.testCarriedOutBy,
          machine_id: values.machineId ? parseInt(values.machineId) : null,
          status: values.status,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update semen analysis report");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Semen analysis report updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["semen", reportId] });
      navigate({ to: '/dashboard/pathology/hormone/semen' });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const onSubmit = (values: SemenFormValues) => {
    updateSemenMutation.mutate(values);
  };

  const handleClose = () => {
    navigate({ to: '/dashboard/pathology/hormone/semen' });
  };

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form
            id="semen-report-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 w-full max-w-[800px] mx-auto px-4"
          >
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    navigate({ to: '/dashboard/pathology/hormone/semen' })
                  }
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Edit Semen Analysis Report
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Review and update the seminal fluid examination findings
                  </p>
                </div>
              </div>
            </div>

            {/* Patient / Invoice info */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Patient Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Invoice and patient details
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <PatientInvoiceInfo
                  invoiceInfo={{
                    invoiceNo: semenData?.invoice_id ? `SEM-${semenData.invoice_id}` : "—",
                    patientName: semenData?.outdoor_invoice?.patient_name || "—",
                    age: semenData?.outdoor_invoice?.age_text || semenData?.outdoor_invoice?.age || "—",
                    gender: semenData?.outdoor_invoice?.sex || "—",
                  }}
                />
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
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

            {/* GROUP 1: Report of Examination of Seminal Fluid */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Report of Examination of Seminal Fluid</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Collection and timing details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sampleCollection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Collection</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select collection method" />
                            </SelectTrigger>
                            <SelectContent>
                              {SAMPLE_COLLECTION_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
              </CardContent>
            </Card>

            {/* GROUP 2: Physical Examination */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Physical Examination</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Volume, colour, odour and consistency</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
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
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select colour" />
                              </SelectTrigger>
                              <SelectContent>
                                {COLOR_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="odour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odour</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select odour" />
                              </SelectTrigger>
                              <SelectContent>
                                {ODOUR_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
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
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select consistency" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONSISTENCY_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
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
              </CardContent>
            </Card>

            {/* GROUP 3: Chemical Examination */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <FlaskConical className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Chemical Examination</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">pH and biochemical markers</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select fructose result" />
                            </SelectTrigger>
                            <SelectContent>
                              {FRUCTOSE_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* GROUP 4: Others */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Others</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Microscopic cellular findings</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pusCells"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pus Cells (per HPF)</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select pus cells" />
                            </SelectTrigger>
                            <SelectContent>
                              {PUS_CELLS_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select epithelial cells" />
                            </SelectTrigger>
                            <SelectContent>
                              {EPITHELIAL_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select RBC" />
                            </SelectTrigger>
                            <SelectContent>
                              {RBC_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* GROUP 5: Total Sperm Count */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Total Sperm Count</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Count, motility and morphology</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>

            {/* COMMENT */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Comment</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Remarks and conclusion</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment / Conclusion</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add remarks, conclusion or select standard comment"
                          className="min-h-[80px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* TEST INFORMATION */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Test Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Machine used for the test</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-10">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Close
              </Button>

              <Link
                to="/dashboard/pathology/hormone/semen/report/$reportId"
                params={{ reportId: reportId }}
              >
                <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                  Print Preview
                </Button>
              </Link>

              <Button
                type="submit"
                size="lg"
                disabled={updateSemenMutation.isPending || !semenData}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
              >
                {updateSemenMutation.isPending ? "Saving..." : "Save Report"}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  );
}
