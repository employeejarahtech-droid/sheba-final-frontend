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
const urineSugarSchema = z.object({
    glucoseLevel: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
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
                    remarks: payload.comments
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
            navigate({ to: "/pathology/urine/urine-for-sugar" });
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

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Urine for Sugar</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1011",
                            patientName: "Sadia Rahman",
                            age: "35 Years",
                            gender: "Female",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* Glucose Level */}
                        <FormField
                            control={form.control}
                            name="glucoseLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Glucose Level / Result</FormLabel>
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

                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to={`/pathology/urine/urine-for-sugar/report/$reportId`} params={{ reportId: reportId.toString() }}>
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