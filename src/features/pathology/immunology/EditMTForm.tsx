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
import { useEffect } from "react";
import { getCookie } from "@/lib/cookies";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// --- Schema ---
const tuberculinSchema = z.object({
    induration: z.string().min(1, { message: "Required" }),
    result: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
});

type TuberculinFormValues = z.infer<typeof tuberculinSchema>;

interface TuberculinTestFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}


export function EditMTForm({ open, setOpen, reportId, invoiceId }: TuberculinTestFormProps) {
    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<TuberculinFormValues>({
        resolver: zodResolver(tuberculinSchema),
        defaultValues: {
            induration: "",
            result: "",
            comments: "",
        },
    });

      // Fetching existing data
    const { data: mtData } = useQuery({
        queryKey: ["mt", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/mt/${reportId}`,
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
        if (mtData) {
            form.reset({
                induration: mtData.induration_mm || '',
                result: mtData.result || '',
                comments: mtData.remarks || '',
            })
        }
    }, [mtData, form]);

     //PUT api call

    const updateMTMutation = useMutation({
        mutationFn: async (payload: TuberculinFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mt/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    induration_mm: payload.induration,
                    result: payload.result,
                    remarks: payload.comments
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Tuberculin (MT) test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/pathology/immunology/mt" });
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

    function onSubmit(values: TuberculinFormValues) {
        console.log("Tuberculin (MT) Test Report:", values);
        updateMTMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Tuberculin (MT) Test</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1009",
                            patientName: "Rafiq Ahmed",
                            age: "29 Years",
                            gender: "Male",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* Induration */}
                        <FormField
                            control={form.control}
                            name="induration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Induration (mm)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 10 mm" {...field} />
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
                                        <Input placeholder="Positive / Negative / Doubtful" {...field} />
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

                            <Link to={`/pathology/immunology/mt/report/$reportId`} params={{ reportId: String(reportId) }}>
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