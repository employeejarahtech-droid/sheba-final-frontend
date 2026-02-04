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
import { Link, useNavigate } from "@tanstack/react-router";
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

    useEffect(() => {
        if (prothombinTime) {
            form.reset({
                pt_test: prothombinTime.pt_test || 0,
                control_pt: prothombinTime.control_pt || 0,
                inr: prothombinTime.inr || 0,
                remarks: prothombinTime.remarks || "",
            })
        }
    }, [prothombinTime]);


    //PUT api call

    const updateProthombinTimeMutation = useMutation({
        mutationFn: async (data: ProthrombinFormValues) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/prothombin-time/${reportId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ...data, invoice_id: invoiceId }),
                }
            );
            if (!res.ok) throw new Error("Failed to update prothombin time report");
            return res.json();
        },
        onSuccess: (data) => {
            console.log("Peripheral Blood Film Updated API Response:", data);
            queryClient.invalidateQueries({ queryKey: ["prothombin-time", reportId] });
            toast.success("Peripheral Blood Film updated successfully");
            navigate({ to: "/pathology/hematology/prothom-bin-time-full" });
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
                <SheetHeader>
                    <SheetTitle>Edit Prothrombin Time (PT)</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1005",
                            patientName: "Hasina Khatun",
                            age: "45 Years",
                            gender: "Female",
                        }}
                    />
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
                                    <FormLabel>INR</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Comments" {...field} />
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

                            <Link to={`/pathology/hematology/prothom-bin-time-full/report/$reportId`} params={{ reportId: reportId.toString() }}>
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
