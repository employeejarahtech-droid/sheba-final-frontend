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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const reducingSubstanceSchema = z.object({
    result: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type StoolReducingSubstanceFormValues = z.infer<typeof reducingSubstanceSchema>;

interface StoolReducingSubstanceFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditStoolReducingSubstanceForm({ open, setOpen, reportId, invoiceId }: StoolReducingSubstanceFormProps) {
    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<StoolReducingSubstanceFormValues>({
        resolver: zodResolver(reducingSubstanceSchema),
        defaultValues: {
            result: "",
            comments: "",
            testCarriedOutBy: "",
            machineId: "",
            status: "incomplete",
        },
    });


    // Fetching existing data
    const { data: reducingSubstanceData } = useQuery({
        queryKey: ["reducing-substance", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/reducing-substance/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch reducing substance test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    useEffect(() => {
        if (reducingSubstanceData) {
            form.reset({
                result: reducingSubstanceData.test_result || '',
                comments: reducingSubstanceData.remarks || '',
                testCarriedOutBy: reducingSubstanceData.test_carried_out_by || '',
                machineId: reducingSubstanceData.machine_id?.toString() || '',
                status: String(reducingSubstanceData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
            })
        }
    }, [reducingSubstanceData, form]);

    //PUT api call

    const updateReducingSubstanceMutation = useMutation({
        mutationFn: async (payload: StoolReducingSubstanceFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reducing-substance/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    test_result: payload.result,
                    remarks: payload.comments,
                    test_carried_out_by: payload.testCarriedOutBy,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                    status: payload.status,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update reducing substance test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/stool/reducing-substance" });
            // optional:
            // form.reset();
            queryClient.invalidateQueries({
                queryKey: ["reducing-substance", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });


    function onSubmit(values: StoolReducingSubstanceFormValues) {
        console.log("Stool Reducing Substance Report:", values);
        updateReducingSubstanceMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => {
        setOpen(false);
        navigate({ to: "/dashboard/pathology/stool/reducing-substance" });
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
                            <SheetTitle className="text-lg font-bold">Edit Stool Reducing Substance Test</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update reducing substance level and remarks</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{
                        invoiceNo: reducingSubstanceData?.invoice_id ? `RPT-${reducingSubstanceData.invoice_id}` : "—",
                        patientName: reducingSubstanceData?.outdoor_invoice?.patient_name || "—",
                        age: reducingSubstanceData?.outdoor_invoice?.age_text || reducingSubstanceData?.outdoor_invoice?.age || "—",
                        gender: reducingSubstanceData?.outdoor_invoice?.sex || "—",
                    }} />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-4"
                    >

                        {/* Result */}
                        <FormField
                            control={form.control}
                            name="result"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Result / Level</FormLabel>
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

                            <Link to="/dashboard/pathology/stool/reducing-substance/report/$reportId" params={{ reportId: reportId.toString() }} className="flex-1">
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
