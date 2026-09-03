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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Link, useNavigate } from "@tanstack/react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MachineSelect } from "./MachineSelect";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { toast } from "sonner";

// --- Schema ---
const ptSchema = z.object({
    pt_test: z.number().min(1, { message: "Required" }),           // Prothrombin Time
    control_pt: z.number().min(1, { message: "Required" }),      // Control Time
    inr: z.number().min(1, { message: "Required" }),          // INR value
    remarks: z.string().optional(),
    machineId: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type ProthrombinFormValues = z.infer<typeof ptSchema>;

interface ProthrombinTimeFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditProthrombinTimeForm({ open, setOpen, reportId, invoiceId }: ProthrombinTimeFormProps) {
    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<ProthrombinFormValues>({
        resolver: zodResolver(ptSchema),
        defaultValues: {
            pt_test: 0,
            control_pt: 0,
            inr: 0,
            remarks: "",
            machineId: "",
            testCarriedOutBy: "",
            status: "incomplete",
        },
    });

    // Fetching existing data
    const { data: prothombinTime } = useQuery({
        queryKey: ["prothombin-time", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/prothombin-time/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch prothombin time report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    console.log('prothombinTime', prothombinTime);

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
        if (prothombinTime) {
            form.reset({
                pt_test: parseFloat(prothombinTime.pt_test) || 0,
                control_pt: parseFloat(prothombinTime.control_pt) || 0,
                inr: parseFloat(prothombinTime.inr) || 0,
                remarks: prothombinTime.remarks || "",
                machineId: prothombinTime.machine_id?.toString() || "",
                testCarriedOutBy: prothombinTime.test_carried_out_by || "",
                status: String(prothombinTime.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
            })
        }
    }, [prothombinTime]);


    //PUT api call

    const updateProthombinTimeMutation = useMutation({
        mutationFn: async (data: ProthrombinFormValues) => {
            // Build the API payload
            const apiPayload: any = {
                invoice_id: invoiceId,
                pt_test: data.pt_test?.toString() || null,
                control_pt: data.control_pt?.toString() || null,
                inr: data.inr?.toString() || null,
                remarks: data.remarks,
                test_carried_out_by: data.testCarriedOutBy,
                status: data.status,
            };

            // Only include machine_id if it exists
            if (data.machineId && data.machineId !== '') {
                apiPayload.machine_id = parseInt(data.machineId);
            }

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/prothombin-time/${reportId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(apiPayload),
                }
            );
            if (!res.ok) throw new Error("Failed to update prothombin time report");
            return res.json();
        },
        onSuccess: (data) => {
            console.log("Prothombin Time Updated API Response:", data);
            queryClient.invalidateQueries({ queryKey: ["prothombin-time", reportId] });
            queryClient.invalidateQueries({ queryKey: ["prothombin-time"] });
            toast.success("Prothombin Time updated successfully");
            navigate({ to: "/dashboard/pathology/hematology/prothom-bin-time-full" });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update prothombin time report");
        },
    })

    function onSubmit(values: ProthrombinFormValues) {
        console.log("Prothrombin Time Report:", values);
        updateProthombinTimeMutation.mutate(values);
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
                            <SheetTitle className="text-lg font-bold">Edit Prothrombin Time (PT)</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update prothrombin time results</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{
                        invoiceNo: prothombinTime?.invoice_id ? `RPT-${prothombinTime.invoice_id}` : "—",
                        patientName: prothombinTime?.outdoor_invoice?.patient_name || "—",
                        age: prothombinTime?.outdoor_invoice?.age_text || prothombinTime?.outdoor_invoice?.age || "—",
                        gender: prothombinTime?.outdoor_invoice?.sex || "—",
                    }} />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* PT Field */}
                        <FormField
                            control={form.control}
                            name="pt_test"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prothrombin Time (PT) — seconds</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter PT value" value={field.value ?? ""} onChange={(e) => field.onChange(Number(e.target.valueAsNumber))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Control Field */}
                        <FormField
                            control={form.control}
                            name="control_pt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Control Value — seconds</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter control value" value={field.value ?? ""} onChange={(e) => field.onChange(Number(e.target.valueAsNumber))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* INR Field */}
                        <FormField
                            control={form.control}
                            name="inr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>INR</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter INR value" value={field.value ?? ""} onChange={(e) => field.onChange(Number(e.target.valueAsNumber))} />
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
                                    <FormLabel>Remarks / Comments</FormLabel>
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
                            name="machineId"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Test Carried Out By (Machine)</FormLabel>
                                    <FormControl>
                                        <MachineSelect
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                // Find the machine and update testCarriedOutBy with the name
                                                const selectedMachine = machineList.find((m: any) => m.id === parseInt(value));
                                                if (selectedMachine) {
                                                    form.setValue('testCarriedOutBy', selectedMachine.name);
                                                }
                                            }}
                                            placeholder="Select machine"
                                        />
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
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/dashboard/pathology/hematology/prothom-bin-time-full/report/$reportId" params={{ reportId: reportId.toString() }}>
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
