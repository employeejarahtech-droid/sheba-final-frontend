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
import { useEffect } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const hcgSchema = z.object({
    hcgValue: z.string().min(1, { message: "Required" }),
    result: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
});

type HCGFormValues = z.infer<typeof hcgSchema>;

interface HCGTestFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditBetaHCGTestForm({ open, setOpen, reportId, invoiceId }: HCGTestFormProps) {
    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();


    const form = useForm<HCGFormValues>({
        resolver: zodResolver(hcgSchema),
        defaultValues: {
            hcgValue: "",
            result: "",
            comments: "",
        },
    });


    // Fetching existing data
    const { data: betaHCGData } = useQuery({
        queryKey: ["hcg", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/hcg/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Tuberculin (MT) Test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    useEffect(() => {
        if (betaHCGData) {
            form.reset({
                hcgValue: betaHCGData.hcg_level || '',
                result: betaHCGData.result || '',
                comments: betaHCGData.remarks || '',
            })
        }
    }, [betaHCGData, form]);

     //PUT api call

    const updateBetaHCGMutation = useMutation({
        mutationFn: async (payload: HCGFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mt/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    hcg_level: payload.hcgValue,
                    result: payload.result,
                    remarks: payload.comments
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Beta HCG test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/pathology/immunology/beta-hcg" });
            // optional:
            // form.reset();
            queryClient.invalidateQueries({
                queryKey: ["mt", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });


    function onSubmit(values: HCGFormValues) {
        console.log("HCG Test Report:", values);
        updateBetaHCGMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit HCG Test</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1010",
                            patientName: "Afsana Begum",
                            age: "28 Years",
                            gender: "Female",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* HCG Value */}
                        <FormField
                            control={form.control}
                            name="hcgValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>HCG Value (IU/mL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 25 IU/mL" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Result */}
                        <FormField
                            control={form.control}
                            name="result"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Result</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Positive / Negative" {...field} />
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

                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to={`/pathology/immunology/beta-hcg/report/$reportId`} params={{ reportId: reportId.toString() }}>
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