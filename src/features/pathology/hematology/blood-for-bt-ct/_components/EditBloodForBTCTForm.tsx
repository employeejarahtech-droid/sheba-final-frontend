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
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";

// --- Schema ---
const btctSchema = z.object({
    bt: z.string().min(1, { message: "Required" }), // Bleeding Time
    ct: z.string().min(1, { message: "Required" }), // Clotting Time
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
        },
    });

     // Fetching existing data
    const { data: bloodForBTCTData } = useQuery({
        queryKey: ["btct", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/btct/${reportId}`,
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

    console.log('bloodForBTCTData', bloodForBTCTData);

    useEffect(() => {
        if (bloodForBTCTData) {
            form.reset({
                bt: bloodForBTCTData.bleeding_time,
                ct: bloodForBTCTData.clotting_time
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
            navigate({ to: "/pathology/hematology/blood-for-bt-ct" });
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

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit BT & CT Report</SheetTitle>
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

                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/pathology/hematology/blood-for-bt-ct/report/$reportId" params={{ reportId: reportId.toString() }}>
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