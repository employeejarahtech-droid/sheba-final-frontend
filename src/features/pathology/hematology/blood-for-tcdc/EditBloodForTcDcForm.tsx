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
        },
    });


    // Fetching existing data
    const { data: bloodForTcdcData } = useQuery({
        queryKey: ["tcdc", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/tcdc/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch lipid-profile report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    console.log('tcdc', bloodForTcdcData);

    useEffect(() => {
        if (bloodForTcdcData) {
            form.reset({
                total_count: bloodForTcdcData.total_count || '',
                neutrophils: bloodForTcdcData.neutrophils || '',
                lymphocytes: bloodForTcdcData.lymphocytes || '',
                monocytes: bloodForTcdcData.monocytes || '',
                eosinophils: bloodForTcdcData.eosinophils || '',
                basophils: bloodForTcdcData.basophils || '',
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
                    ...payload
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
            navigate({ to: "/pathology/hematology/blood-for-tcdc" });
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

    const machineList = [
        "Sysmex XN-1000",
        "Sysmex XP-300",
        "Mindray BC-20",
        "Abbott CELL-DYN Ruby",
        "Nihon Kohden MEK-9100",
    ];



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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select lab technician" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {machineList.map((machine) => (
                                                    <SelectItem key={machine} value={machine}>
                                                        {machine}
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

                            <Link to="/pathology/hematology/blood-for-tcdc/report/$reportId" params={{ reportId: reportId.toString() }}>
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
