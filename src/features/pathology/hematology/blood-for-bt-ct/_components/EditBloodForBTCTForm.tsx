import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Droplets, Activity, Check } from "lucide-react";

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
import { MachineSelect } from "./MachineSelect";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";

// --- Schema ---
const btctSchema = z.object({
    bt: z.string().min(1, { message: "Required" }), // Bleeding Time
    ct: z.string().min(1, { message: "Required" }), // Clotting Time
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type BTCTFormValues = z.infer<typeof btctSchema>;

interface BTCTFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditBloodForBTCTForm({ open, setOpen, reportId, invoiceId }: BTCTFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const token = getCookie('accessToken');

    const form = useForm<BTCTFormValues>({
        resolver: zodResolver(btctSchema),
        defaultValues: {
            bt: '',
            ct: '',
            testCarriedOutBy: '',
            machineId: '',
            status: 'incomplete',
        },
    });

     // Fetching existing data
    const { data: bloodForBTCTData, error: btctError, isLoading: btctLoading } = useQuery({
        queryKey: ["btct", reportId],
        queryFn: async () => {
            console.log('Fetching BTCT record for reportId:', reportId);
            const url = `${import.meta.env.VITE_API_URL}/api/btct/${reportId}`;
            console.log('Fetch URL:', url);
            const res = await fetch(
                url,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log('BTCT record response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('BTCT record fetch failed:', errorText);
                throw new Error(`Failed to fetch BT/CT report: ${errorText}`);
            }
            const result = await res.json();
            console.log('BTCT record response:', result);
            return result.data;
        },
        enabled: !!token && !!reportId && reportId !== 0,
    });

    console.log('BTCT Form State:', { bloodForBTCTData, btctError, btctLoading, reportId });

    useEffect(() => {
        if (bloodForBTCTData) {
            // Normalize status to one of the two valid Select options.
            // Anything else (null, empty, legacy/whitespace value) would make the
            // Radix Select render blank, so it must collapse to 'incomplete'.
            const normalizedStatus =
                String(bloodForBTCTData.status).trim().toLowerCase() === 'complete'
                    ? 'complete'
                    : 'incomplete';

            form.reset({
                bt: bloodForBTCTData.bleeding_time,
                ct: bloodForBTCTData.clotting_time,
                testCarriedOutBy: bloodForBTCTData.test_carried_out_by || '',
                machineId: bloodForBTCTData.machine_id ? String(bloodForBTCTData.machine_id) : '',
                status: normalizedStatus,
            })
        }
    }, [bloodForBTCTData]);

    const updateBTCTMutation = useMutation({
        mutationFn: async (payload: BTCTFormValues) => {
            console.log("Payload:", payload);

            // Build the API payload
            const apiPayload: any = {
                invoice_id: invoiceId,
                bleeding_time: payload.bt,
                clotting_time: payload.ct,
                test_carried_out_by: payload.testCarriedOutBy,
            };

            // Only include machine_id if it exists
            if (payload.machineId && payload.machineId !== '') {
                apiPayload.machine_id = parseInt(payload.machineId);
            }

            // Only include status if it exists (for backwards compatibility)
            if (payload.status) {
                apiPayload.status = payload.status;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/btct/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(apiPayload),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/hematology/blood-for-bt-ct" });
            // Invalidate both the single record query and the list query
            queryClient.invalidateQueries({ queryKey: ["btct", reportId] });
            queryClient.invalidateQueries({ queryKey: ["btct"] });
        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: BTCTFormValues) {
        console.log("BT & CT Report:", values);

        // Get current status value from form to ensure dynamic status is captured
        const currentStatus = form.watch('status');

        // Create payload with current status
        const submitPayload = {
            ...values,
            status: currentStatus
        };

        console.log("Submit Payload with Status:", submitPayload);
        updateBTCTMutation.mutate(submitPayload);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

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
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                    <div className="flex items-center justify-between gap-2.5 pr-8">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                <Droplets className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold">
                                    {btctLoading ? 'Loading...' : `Edit BT & CT Report #${bloodForBTCTData?.invoice_id || reportId}`}
                                </SheetTitle>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {bloodForBTCTData ? `Patient: ${bloodForBTCTData.patient_name}` : 'Update bleeding & clotting time results'}
                                </p>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{
                        invoiceNo: bloodForBTCTData?.invoice_id ? `RPT-${bloodForBTCTData.invoice_id}` : "—",
                        patientName: bloodForBTCTData?.outdoor_invoice?.patient_name || "—",
                        age: bloodForBTCTData?.outdoor_invoice?.age_text || bloodForBTCTData?.outdoor_invoice?.age || "—",
                        gender: bloodForBTCTData?.outdoor_invoice?.sex || "—",
                    }} />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >
                        {btctLoading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-sm text-gray-600">Loading report data...</span>
                            </div>
                        )}

                        {btctError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                Failed to load report data. Please try again.
                            </div>
        )}

                        {/* BT Field */}
                        <FormField
                            control={form.control}
                            name="bt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bleeding Time (BT) {field.value && `- Current: ${field.value} min`}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter BT (minutes)"
                                            {...field}
                                            className={field.value ? "border-blue-300 bg-blue-50" : ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* CT Field */}
                        <FormField
                            control={form.control}
                            name="ct"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clotting Time (CT) {field.value && `- Current: ${field.value} min`}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter CT (minutes)"
                                            {...field}
                                            className={field.value ? "border-blue-300 bg-blue-50" : ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Dynamic BT/CT Ratio Indicator */}
                        {(form.watch('bt') && form.watch('ct')) && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">BT/CT Ratio</p>
                                        <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                                            {(parseFloat(form.watch('ct') || '0') / parseFloat(form.watch('bt') || '0')).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Normal Range</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300">Ratio: 1.2 - 1.8</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TEST CARRIED OUT BY */}
                        <FormField
                            control={form.control}
                            name="machineId"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Test Carried Out By</FormLabel>
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
                                    <p className="text-xs text-gray-600">Manually select the report status</p>
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
                                                    <SelectItem value="incomplete">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                            <span>Incomplete</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="complete">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                            <span>Complete</span>
                                                        </div>
                                                    </SelectItem>
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
                                className="min-w-[150px]"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Report
                                    </>
                                )}
                            </Button>

                            <Link to="/dashboard/pathology/hematology/blood-for-bt-ct/report/$reportId" params={{ reportId: reportId.toString() }}>
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
