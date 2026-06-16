import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

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

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { useEffect } from "react";

// --- Schema ---
const formSchema = z.object({
    total_count: z.string().min(1, { message: "Required" }),
    neutrophils: z.string().min(1, { message: "Required" }),
    lymphocytes: z.string().min(1, { message: "Required" }),
    monocytes: z.string().min(1, { message: "Required" }),
    eosinophils: z.string().min(1, { message: "Required" }),
    basophils: z.string().min(1, { message: "Required" }),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
});

type TCDCFormValues = z.infer<typeof formSchema>;

interface BloodForTCDCFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditBloodForTcDcForm({ open, setOpen, reportId, invoiceId }: BloodForTCDCFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const token = getCookie('accessToken');

    const form = useForm<TCDCFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            total_count: "",
            neutrophils: "",
            lymphocytes: "",
            monocytes: "",
            eosinophils: "",
            basophils: "",
            testCarriedOutBy: "",
            machineId: "",
        },
    });


    // Fetching existing data
    const { data: bloodForTcdcData, error: tcdcError, isLoading: tcdcLoading } = useQuery({
        queryKey: ["tcdc", reportId],
        queryFn: async () => {
            console.log('Fetching TCDC record for reportId:', reportId);
            const url = `${import.meta.env.VITE_API_URL}/api/tcdc/${reportId}`;
            console.log('Fetch URL:', url);
            const res = await fetch(
                url,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log('TCDC record response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('TCDC record fetch failed:', errorText);
                throw new Error(`Failed to fetch TCDC report: ${errorText}`);
            }
            const result = await res.json();
            console.log('TCDC record response:', result);
            return result.data;
        },
        enabled: !!token && !!reportId && reportId !== 0,
    });

    console.log('TCDC Form State:', { bloodForTcdcData, tcdcError, tcdcLoading, reportId });

    useEffect(() => {
        if (bloodForTcdcData) {
            form.reset({
                total_count: bloodForTcdcData.total_count || '',
                neutrophils: bloodForTcdcData.neutrophils || '',
                lymphocytes: bloodForTcdcData.lymphocytes || '',
                monocytes: bloodForTcdcData.monocytes || '',
                eosinophils: bloodForTcdcData.eosinophils || '',
                basophils: bloodForTcdcData.basophils || '',
                testCarriedOutBy: bloodForTcdcData.test_carried_out_by || '',
                machineId: bloodForTcdcData.machine_id ? String(bloodForTcdcData.machine_id) : '',
            })
        }
    }, [bloodForTcdcData]);



    const updateBloodForTcDcMutation = useMutation({
        mutationFn: async (payload: TCDCFormValues) => {
            console.log("Payload:", payload);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tcdc/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    total_count: payload.total_count,
                    neutrophils: payload.neutrophils,
                    lymphocytes: payload.lymphocytes,
                    monocytes: payload.monocytes,
                    eosinophils: payload.eosinophils,
                    basophils: payload.basophils,
                    test_carried_out_by: payload.testCarriedOutBy,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success("Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/hematology/blood-for-tcdc" });
            // optional:
            queryClient.invalidateQueries({ queryKey: ["tcdc", reportId]});
        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: TCDCFormValues) {
        console.log("TCDC Data:", values);
        updateBloodForTcDcMutation.mutate(values);
        setOpen(false);
        form.reset();

    }

    const handleView = () => alert("View action triggered.");

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



    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Blood for TCDC</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{ invoiceNo: "RPT-1002", patientName: "Abdul Karim", age: "36 Years", gender: "Male" }} />
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 p-4">

                        {/* Fields */}
                        {[
                            { name: "total_count", label: "Total Count (TC)" },
                            { name: "neutrophils", label: "Neutrophil (%)" },
                            { name: "lymphocytes", label: "Lymphocyte (%)" },
                            { name: "monocytes", label: "Monocyte (%)" },
                            { name: "eosinophils", label: "Eosinophil (%)" },
                            { name: "basophils", label: "Basophil (%)" },
                        ].map((f) => (
                            <FormField
                                key={f.name}
                                control={form.control}
                                name={f.name as keyof TCDCFormValues}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{f.label}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter value" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}



                        {/* TEST CARRIED OUT BY */}
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


                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button type="submit" variant="success" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/dashboard/pathology/hematology/blood-for-tcdc/report/$reportId" params={{ reportId: reportId.toString() }}>
                                <Button type="button" variant="warning">
                                    Print Preview
                                </Button>
                            </Link>

                            <Button type="button" variant="info" onClick={handleView}>
                                View
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
