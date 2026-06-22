import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { FlaskConical } from "lucide-react";

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

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const widalSchema = z.object({
    s_typhi_o: z.string().min(1, { message: "Required" }),
    s_typhi_h: z.string().min(1, { message: "Required" }),
    s_paratyphi_a: z.string().min(1, { message: "Required" }),
    s_paratyphi_b: z.string().min(1, { message: "Required" }),
    s_paratyphi_c: z.string().min(1, { message: "Required" }),
    remarks: z.string().optional(),
    machineId: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
});

type WidalFormValues = z.infer<typeof widalSchema>;

interface WidalTestFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}


export function WidalTestForm({ open, setOpen, reportId, invoiceId }: WidalTestFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const token = getCookie('accessToken');

    const form = useForm<WidalFormValues>({
        resolver: zodResolver(widalSchema),
        defaultValues: {
            s_typhi_o: "",
            s_typhi_h: "",
            s_paratyphi_a: "",
            s_paratyphi_b: "",
            s_paratyphi_c: "",
            remarks: "",
            machineId: "",
            testCarriedOutBy: "",
        },
    });

    // Fetching existing data
    const { data: widalTestData } = useQuery({
        queryKey: ["widal", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/widal/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Widal Test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    console.log('tcdc', widalTestData);

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
        if (widalTestData) {
            form.reset({
                s_typhi_o: widalTestData.s_typhi_o || '',
                s_typhi_h: widalTestData.s_typhi_h || '',
                s_paratyphi_a: widalTestData.s_paratyphi_a || '',
                s_paratyphi_b: widalTestData.s_paratyphi_b || '',
                s_paratyphi_c: widalTestData.s_paratyphi_c || '',
                remarks: widalTestData.remarks || '',
                machineId: widalTestData.machine_id?.toString() || "",
                testCarriedOutBy: widalTestData.test_carried_out_by || "",
            })
        }
    }, [widalTestData]);


    //PUT api call

    const updateWidalTestMutation = useMutation({
        mutationFn: async (payload: WidalFormValues) => {
            console.log("Payload:", payload);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/widal/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    s_typhi_o: payload.s_typhi_o,
                    s_typhi_h: payload.s_typhi_h,
                    s_paratyphi_a: payload.s_paratyphi_a,
                    s_paratyphi_b: payload.s_paratyphi_b,
                    s_paratyphi_c: payload.s_paratyphi_c,
                    remarks: payload.remarks,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                    test_carried_out_by: payload.testCarriedOutBy,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Widal Test report");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success("Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/immunology/widal-test" });
            // optional:
            queryClient.invalidateQueries({
                queryKey: ["widal", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: WidalFormValues) {
        console.log("Widal Test Report:", values);
        updateWidalTestMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <FlaskConical className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">Edit Widal Test</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update Widal test results</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1007",
                            patientName: "Shakil Hasan",
                            age: "33 Years",
                            gender: "Male",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* S. Typhi O */}
                        <FormField
                            control={form.control}
                            name="s_typhi_o"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Typhi O (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:80" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* S. Typhi H */}
                        <FormField
                            control={form.control}
                            name="s_typhi_h"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Typhi H (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:160" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* S. Paratyphi A (AH) */}
                        <FormField
                            control={form.control}
                            name="s_paratyphi_a"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Paratyphi A (AH) (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:40" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* S. Paratyphi B (BH) */}
                        <FormField
                            control={form.control}
                            name="s_paratyphi_b"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Paratyphi B (BH) (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:40" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField
                            control={form.control}
                            name="s_paratyphi_c"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>S. Paratyphi C (CH) (titer)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1:40" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Comments" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Test Carried Out By */}
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
                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/dashboard/pathology/immunology/widal-test/report/$reportId" params={{ reportId: reportId.toString() }}>
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
