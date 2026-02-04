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
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const reducingSubstanceSchema = z.object({
    result: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
});

type UrineReducingSubstanceFormValues = z.infer<typeof reducingSubstanceSchema>;

interface UrineReducingSubstanceFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditStoolReducingSubstanceForm({ open, setOpen, reportId, invoiceId }: UrineReducingSubstanceFormProps) {
    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<UrineReducingSubstanceFormValues>({
        resolver: zodResolver(reducingSubstanceSchema),
        defaultValues: {
            result: "",
            comments: "",
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
            })
        }
    }, [reducingSubstanceData, form]);

    //PUT api call

    const updateReducingSubstanceMutation = useMutation({
        mutationFn: async (payload: UrineReducingSubstanceFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reducing-substance/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    test_result: payload.result,
                    remarks: payload.comments
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
            navigate({ to: "/pathology/stool/reducing-substance" });
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


    function onSubmit(values: UrineReducingSubstanceFormValues) {
        console.log("Urine Reducing Substance Report:", values);
        updateReducingSubstanceMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Urine Reducing Substance Test</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1014",
                            patientName: "Rumana Akter",
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

                        {/* Result */}
                        <FormField
                            control={form.control}
                            name="result"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Result / Level</FormLabel>
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

                            <Link to={`/pathology/stool/reducing-substance/report/$reportId`} params={{ reportId: reportId.toString() }}>
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
