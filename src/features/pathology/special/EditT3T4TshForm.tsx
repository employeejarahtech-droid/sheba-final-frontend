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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";

// --- Schema ---
const thyroidFunctionSchema = z.object({
    t3: z.string().min(1, { message: "Required" }),
    t4: z.string().min(1, { message: "Required" }),
    tsh: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
});

type ThyroidFunctionFormValues = z.infer<typeof thyroidFunctionSchema>;

interface ThyroidFunctionFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function ThyroidFunctionTestForm({ open, setOpen, reportId, invoiceId }: ThyroidFunctionFormProps) {
    const navigate = useNavigate();
    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<ThyroidFunctionFormValues>({
        resolver: zodResolver(thyroidFunctionSchema),
        defaultValues: {
            t3: "",
            t4: "",
            tsh: "",
            comments: "",
            testCarriedOutBy: "",
            machineId: "",
        },
    });

    // Fetching existing data
    const { data: t3t4tshData } = useQuery({
        queryKey: ["t3t4tsh", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/t3t4tsh/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch t3t4tsh report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

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

    useEffect(() => {
        if (t3t4tshData) {
            form.reset({
                t3: t3t4tshData.t3 || '',
                t4: t3t4tshData.t4 || '',
                tsh: t3t4tshData.tsh || '',
                comments: t3t4tshData.remarks || '',
                testCarriedOutBy: t3t4tshData.test_carried_out_by || '',
                machineId: t3t4tshData.machine_id?.toString() || '',
            })
        }
    }, [t3t4tshData, form]);

    //PUT api call
    const updateT3T4TSHMutation = useMutation({
        mutationFn: async (payload: ThyroidFunctionFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/t3t4tsh/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    t3: payload.t3,
                    t4: payload.t4,
                    tsh: payload.tsh,
                    remarks: payload.comments,
                    test_carried_out_by: payload.testCarriedOutBy,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update t3t4tsh test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/hormone/t3t4tsh" });
            queryClient.invalidateQueries({
                queryKey: ["t3t4tsh", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: ThyroidFunctionFormValues) {
        console.log("Thyroid Function Test Report:", values);
        updateT3T4TSHMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Thyroid Function Test (T3/T4/TSH)</SheetTitle>
                </SheetHeader>

              <div className="px-4">
                  <PatientInvoiceInfo
                    invoiceInfo={{
                        invoiceNo: "RPT-1017",
                        patientName: "Sadia Hossain",
                        age: "37 Years",
                        gender: "Female",
                    }}
                />
              </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* T3 */}
                        <FormField
                            control={form.control}
                            name="t3"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>T3 (Triiodothyronine) (ng/dL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter T3 value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* T4 */}
                        <FormField
                            control={form.control}
                            name="t4"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>T4 (Thyroxine) (µg/dL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter T4 value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* TSH */}
                        <FormField
                            control={form.control}
                            name="tsh"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>TSH (µIU/mL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter TSH value" {...field} />
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
                                        <Input placeholder="Additional notes..." {...field} />
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
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/dashboard/pathology/hormone/t3t4tsh/report/$reportId" params={{ reportId: reportId.toString() }}>
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
