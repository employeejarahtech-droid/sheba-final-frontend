import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { FlaskConical, Activity } from "lucide-react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const urineSugarSchema = z.object({
    glucoseLevel: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type UrineSugarFormValues = z.infer<typeof urineSugarSchema>;

interface UrineSugarFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditUrineForSugarForm({ open, setOpen, reportId, invoiceId }: UrineSugarFormProps) {

    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();


    const form = useForm<UrineSugarFormValues>({
        resolver: zodResolver(urineSugarSchema),
        defaultValues: {
            glucoseLevel: "",
            comments: "",
            testCarriedOutBy: "",
            machineId: "",
            status: "incomplete",
        },
    });


    // Fetching existing data
    const { data: urineSugarGData } = useQuery({
        queryKey: ["urine-sugar", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/urine-sugar/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Urine Sugar Test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    useEffect(() => {
        if (urineSugarGData) {
            form.reset({
                glucoseLevel: urineSugarGData.glucose || '',
                comments: urineSugarGData.remarks || '',
                testCarriedOutBy: urineSugarGData.test_carried_out_by || '',
                machineId: urineSugarGData.machine_id ? String(urineSugarGData.machine_id) : '',
                status: String(urineSugarGData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
            })
        }
    }, [urineSugarGData, form]);

    //PUT api call

    const updateUrineSugarMutation = useMutation({
        mutationFn: async (payload: UrineSugarFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/urine-sugar/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    glucose: payload.glucoseLevel,
                    remarks: payload.comments,
                    test_carried_out_by: payload.testCarriedOutBy,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                    status: payload.status,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Urine Sugar test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/urine/urine-for-sugar" });
            // optional:
            // form.reset();
            queryClient.invalidateQueries({
                queryKey: ["urine-sugar", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });


    function onSubmit(values: UrineSugarFormValues) {
        console.log("Urine for Sugar Report:", values);
        updateUrineSugarMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => {
        setOpen(false);
        navigate({ to: "/dashboard/pathology/urine/urine-for-sugar" });
    };

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
            <SheetContent side="right" className="max-w-[400px] sm:max-w-[450px] w-full overflow-y-auto p-0">
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0 mb-4">
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <FlaskConical className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">Edit Urine for Sugar</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update glucose level and remarks</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{
                        invoiceNo: urineSugarGData?.invoice_id ? `RPT-${urineSugarGData.invoice_id}` : "—",
                        patientName: urineSugarGData?.outdoor_invoice?.patient_name || "—",
                        age: urineSugarGData?.outdoor_invoice?.age_text || urineSugarGData?.outdoor_invoice?.age || "—",
                        gender: urineSugarGData?.outdoor_invoice?.sex || "—",
                    }} />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-4"
                    >

                        {/* Glucose Level */}
                        <FormField
                            control={form.control}
                            name="glucoseLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Glucose Level / Result</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select result" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["Negative", "Trace", "+", "++", "+++", "++++"].map((opt) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Comments */}
                        <FormField
                            control={form.control}
                            name="comments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comments / Remarks (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional notes..." {...field} />
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

                        {/* Report Status */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border rounded-lg p-4">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">Report Status</h3>
                                    <p className="text-xs text-gray-600">Mark report as complete or incomplete</p>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value === 'complete' ? 'complete' : 'incomplete'}
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
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-between gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                className="flex-1"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/dashboard/pathology/urine/urine-for-sugar/report/$reportId" params={{ reportId: reportId.toString() }} className="flex-1">
                                <Button type="button" variant="warning" className="w-full">
                                    Print Preview
                                </Button>
                            </Link>

                            <Button type="button" variant="info" className="flex-1" onClick={handleView}>
                                View
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}