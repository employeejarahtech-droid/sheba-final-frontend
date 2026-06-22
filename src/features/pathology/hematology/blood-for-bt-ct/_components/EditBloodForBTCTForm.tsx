import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Droplets } from "lucide-react";

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
            form.reset({
                bt: bloodForBTCTData.bleeding_time,
                ct: bloodForBTCTData.clotting_time,
                testCarriedOutBy: bloodForBTCTData.test_carried_out_by || '',
                machineId: bloodForBTCTData.machine_id ? String(bloodForBTCTData.machine_id) : '',
            })
        }
    }, [bloodForBTCTData]);

    const updateBTCTMutation = useMutation({
        mutationFn: async (payload: BTCTFormValues) => {
            console.log("Payload:", payload);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/btct/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    bleeding_time: payload.bt,
                    clotting_time: payload.ct,
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
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/hematology/blood-for-bt-ct" });
            // optional:
            queryClient.invalidateQueries({ queryKey: ["btct", reportId] });
        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: BTCTFormValues) {
        console.log("BT & CT Report:", values);
        updateBTCTMutation.mutate(values);
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
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <Droplets className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">Edit BT & CT Report</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update bleeding & clotting time results</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1004",
                            patientName: "Nur Mohammad",
                            age: "32 Years",
                            gender: "Male",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* BT Field */}
                        <FormField
                            control={form.control}
                            name="bt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bleeding Time (BT)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter BT (minutes)" {...field} />
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
                                    <FormLabel>Clotting Time (CT)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter CT (minutes)" {...field} />
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
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
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
