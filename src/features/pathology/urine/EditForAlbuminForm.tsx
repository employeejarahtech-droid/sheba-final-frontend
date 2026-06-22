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

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const urineAlbuminSchema = z.object({
    albuminLevel: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
});

type UrineAlbuminFormValues = z.infer<typeof urineAlbuminSchema>;

interface UrineAlbuminFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditUrineForAlbuminForm({ open, setOpen, reportId, invoiceId }: UrineAlbuminFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const token = getCookie('accessToken');

    const form = useForm<UrineAlbuminFormValues>({
        resolver: zodResolver(urineAlbuminSchema),
        defaultValues: {
            albuminLevel: "",
            comments: "",
            testCarriedOutBy: "",
            machineId: "",
        },
    });

    // Fetching existing data
    const { data: urineAlbuminData } = useQuery({
        queryKey: ["urine-albumin", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/urine-albumin/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Urine Albumin Test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    useEffect(() => {
        if (urineAlbuminData) {
            form.reset({
                albuminLevel: urineAlbuminData.albumin || '',
                comments: urineAlbuminData.remarks || '',
                testCarriedOutBy: urineAlbuminData.test_carried_out_by || '',
                machineId: urineAlbuminData.machine_id ? String(urineAlbuminData.machine_id) : '',
            })
        }
    }, [urineAlbuminData, form]);

    //PUT api call
    const updateUrineAlbuminMutation = useMutation({
        mutationFn: async (payload: UrineAlbuminFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/urine-albumin/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    albumin: payload.albuminLevel,
                    remarks: payload.comments,
                    test_carried_out_by: payload.testCarriedOutBy,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Urine Albumin test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/urine/urine-for-albumin" });
            queryClient.invalidateQueries({
                queryKey: ["urine-albumin", reportId],
            });
        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: UrineAlbuminFormValues) {
        console.log("Urine for Albumin Report:", values);
        updateUrineAlbuminMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => {
        setOpen(false);
        navigate({ to: "/dashboard/pathology/urine/urine-for-albumin" });
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
                            <SheetTitle className="text-lg font-bold">Edit Urine for Albumin</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update albumin level and remarks</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: urineAlbuminData?.invoice_id ? `RPT-${urineAlbuminData.invoice_id}` : "—",
                            patientName: urineAlbuminData?.outdoor_invoice?.patient_name || "—",
                            age: urineAlbuminData?.outdoor_invoice?.age ? `${urineAlbuminData.outdoor_invoice.age} Years` : "—",
                            gender: urineAlbuminData?.outdoor_invoice?.sex || "—",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-4"
                    >
                        {/* Albumin Level */}
                        <FormField
                            control={form.control}
                            name="albuminLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Albumin Level / Result</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Negative / Trace / + / ++ / +++" {...field} />
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

                        {/* TEST CARRIED OUT BY */}
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

                            <Link to="/dashboard/pathology/urine/urine-for-albumin/report/$reportId" params={{ reportId: reportId?.toString() }} className="flex-1">
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
