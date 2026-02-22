import { createFileRoute, Link } from '@tanstack/react-router'
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Main } from "@/components/layout/main";
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { AppHeader } from '@/components/layout/app-header';

export const Route = createFileRoute(
    '/_authenticated/pathology/hematology/cbc-with-pbf/edit/$id',
)({
    component: EditCBCWithPBF,
})

// ─────────────────────────────
// FORM SCHEMA
// ─────────────────────────────
const cbcSchema = z.object({

    hemoglobin: z.string().min(1, "Required"),
    rbc_count: z.string().min(1, "Required"),
    wbc_count: z.string().min(1, "Required"),
    platelets: z.string().min(1, "Required"),

    hct: z.string().min(1, "Required"),
    mcv: z.string().min(1, "Required"),
    mch: z.string().min(1, "Required"),
    mchc: z.string().min(1, "Required"),

    neutrophils: z.string().min(1, "Required"),
    lymphocytes: z.string().min(1, "Required"),
    monocytes: z.string().min(1, "Required"),
    eosinophils: z.string().min(1, "Required"),
    basophils: z.string().min(1, "Required"),

    pbf_findings: z.string().optional(),
    machineId: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
});

type CBCFormValues = z.infer<typeof cbcSchema>;

function EditCBCWithPBF() {
    const { id } = Route.useParams();

    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<CBCFormValues>({
        resolver: zodResolver(cbcSchema),
        defaultValues: {
            hemoglobin: "",
            rbc_count: "",
            wbc_count: "",
            platelets: "",

            hct: "",
            mcv: "",
            mch: "",
            mchc: "",

            neutrophils: "",
            lymphocytes: "",
            monocytes: "",
            eosinophils: "",
            basophils: "",

            pbf_findings: "",
            machineId: "",
            testCarriedOutBy: "",
        },
    });

    // Fetch existing peripheral blood film data
    const { data: cbcWithPbfData } = useQuery({
        queryKey: ["cbc-pbf", id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/cbc-pbf/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch test");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!id,
    });

    console.log('cbcData', cbcWithPbfData);

    // Fetch machines data
    const { data: machinesData } = useQuery({
        queryKey: ["machine"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/machine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        },
    });

    const machineList = machinesData?.data?.items || [];

    useEffect(() => {
        if (cbcWithPbfData) {
            form.reset({
                hemoglobin: cbcWithPbfData.hemoglobin?.toString() || "",
                rbc_count: cbcWithPbfData.rbc_count?.toString() || "",
                wbc_count: cbcWithPbfData.wbc_count?.toString() || "",
                platelets: cbcWithPbfData.platelets?.toString() || "",

                hct: cbcWithPbfData.hct?.toString() || "",
                mcv: cbcWithPbfData.mcv?.toString() || "",
                mch: cbcWithPbfData.mch?.toString() || "",
                mchc: cbcWithPbfData.mchc?.toString() || "",

                neutrophils: cbcWithPbfData.neutrophils?.toString() || "",
                lymphocytes: cbcWithPbfData.lymphocytes?.toString() || "",
                monocytes: cbcWithPbfData.monocytes?.toString() || "",
                eosinophils: cbcWithPbfData.eosinophils?.toString() || "",
                basophils: cbcWithPbfData.basophils?.toString() || "",

                pbf_findings: cbcWithPbfData.pbf_findings || "",
                machineId: cbcWithPbfData.machine_id?.toString() || "",
                testCarriedOutBy: cbcWithPbfData.test_carried_out_by || "",
            })
        }
    }, [cbcWithPbfData, form]);

    //PUT api call

    const updateCBCWithPBFMutation = useMutation({
        mutationFn: async (data: CBCFormValues) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/cbc-pbf/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        invoice_id: cbcWithPbfData?.invoice_id,
                        ...data,
                        machine_id: data.machineId ? parseInt(data.machineId) : null,
                        test_carried_out_by: data.testCarriedOutBy,
                    }),
                }
            );
            if (!res.ok) throw new Error("Failed to update cbc with pbf test");
            return res.json();
        },
        onSuccess: (data) => {
            console.log("Updated API Response:", data);
            queryClient.invalidateQueries({ queryKey: ["cbc-pbf", id] });
            toast.success(data.message || "CBC with pbf test updated successfully");
            navigate({ to: "/pathology/hematology/cbc-with-pbf" });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update cbc with pbf test");
        },
    })

    const onSubmit = (values: CBCFormValues) => {
        console.log("CBC Report:", values);
        updateCBCWithPBFMutation.mutate(values);
    };

    return (
        <>
            {/* Header */}
          <AppHeader fixed />

            {/* Main Content */}
            <Main className="px-6 py-8 max-w-5xl mx-auto">
                <div className="max-w-[800px] mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Edit Blood For CBC Report</h1>

                    {/* Invoice + Patient Section */}
                    <div className="bg-white shadow rounded-xl p-6 border mb-8">
                        <PatientInvoiceInfo
                            invoiceInfo={{
                                invoiceNo: "INV-2002",
                                patientName: "Rahim Uddin",
                                age: "29 Years",
                                gender: "Male",
                            }}
                        />
                    </div>

                    {/* CBC Form */}
                    <div className="bg-white shadow rounded-xl p-6 border">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                {/* Group: Basic CBC */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Hematology Indices</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="hemoglobin" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hemoglobin (g/dL)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 14.5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="rbc_count" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>RBC Count (million/cmm)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 5.2" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="wbc_count" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WBC Count (/cmm)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 7800" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="platelets" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Platelets (/cmm)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 250000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold mb-4 mt-8">RBC Indices</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="hct" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>HCT (%)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 42.5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="mcv" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>MCV (fL)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 88.0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="mch" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>MCH (pg)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 29.5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="mchc" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>MCHC (g/dL)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 33.5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                    </div>

                                </div>

                                {/* Group: Differential Count */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">
                                        Differential Count
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Neutrophils */}
                                        <FormField
                                            control={form.control}
                                            name="neutrophils"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Neutrophils (%)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 60" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Lymphocytes */}
                                        <FormField
                                            control={form.control}
                                            name="lymphocytes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Lymphocytes (%)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 30" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Monocytes */}
                                        <FormField
                                            control={form.control}
                                            name="monocytes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Monocytes (%)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 6" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Eosinophils */}
                                        <FormField
                                            control={form.control}
                                            name="eosinophils"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Eosinophils (%)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 3" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Basophils */}
                                        <FormField
                                            control={form.control}
                                            name="basophils"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Basophils (%)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">PBF Findings</h2>
                                      <FormField
                                            control={form.control}
                                            name="pbf_findings"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PBF Findings</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Pbf findings..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                </div>

                                {/* Test Carried Out By */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 mt-8">Test Information</h2>
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

                                {/* Buttons */}
                                <div className="flex justify-between gap-3 pt-4">
                                    <Button type="submit" variant="success" className="flex-1">
                                        Save Report
                                    </Button>

                                    <Link to="/pathology/hematology/cbc-with-pbf/report/$reportId" params={{ reportId: id }}>
                                        <Button type="button" variant="warning" className="flex-1">
                                            Print Preview
                                        </Button>
                                    </Link>

                                    <Button type="button" variant="info" className="flex-1">
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
