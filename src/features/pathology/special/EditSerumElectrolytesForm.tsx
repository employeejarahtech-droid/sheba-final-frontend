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
import { toast } from "sonner";
import { getCookie } from "@/lib/cookies";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

// --- Schema ---
const serumElectrolytesSchema = z.object({
    sodium: z.string().min(1, { message: "Required" }),
    potassium: z.string().min(1, { message: "Required" }),
    chloride: z.string().min(1, { message: "Required" }),
    bicarbonate: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
});

type SerumElectrolytesFormValues = z.infer<typeof serumElectrolytesSchema>;

interface SerumElectrolytesFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditSerumElectrolytesForm({ open, setOpen, reportId, invoiceId }: SerumElectrolytesFormProps) {
    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<SerumElectrolytesFormValues>({
        resolver: zodResolver(serumElectrolytesSchema),
        defaultValues: {
            sodium: "",
            potassium: "",
            chloride: "",
            bicarbonate: "",
            comments: "",
        },
    });



    // Fetching existing data
    const { data: serumElectrolytesData } = useQuery({
        queryKey: ["electrolytes", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/electrolytes/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch electrolytes test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    console.log("Sputum Data:", serumElectrolytesData);

    useEffect(() => {
        if (serumElectrolytesData) {
            form.reset({
                sodium: serumElectrolytesData.sodium || '',
                potassium: serumElectrolytesData.potassium || '',
                chloride: serumElectrolytesData.chloride || '',
                bicarbonate: serumElectrolytesData.bicarbonate || '',
                comments: serumElectrolytesData.remarks || '',
            })
        }
    }, [serumElectrolytesData, form]);

    //PUT api call

    const updateSerumElectrolytesMutation = useMutation({
        mutationFn: async (payload: SerumElectrolytesFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/electrolytes/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    sodium: payload.sodium,
                    potassium: payload.potassium,
                    chloride: payload.chloride,
                    bicarbonate: payload.bicarbonate,
                    remarks: payload.comments
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update electrolytes test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/pathology/hormone/electrolytes" });
            // optional:
            // form.reset();
            queryClient.invalidateQueries({
                queryKey: ["electrolytes", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });




    function onSubmit(values: SerumElectrolytesFormValues) {
        console.log("Serum Electrolytes Report:", values);
        updateSerumElectrolytesMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Serum Electrolytes Test</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1016",
                            patientName: "Farhana Akter",
                            age: "42 Years",
                            gender: "Female",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* Sodium */}
                        <FormField
                            control={form.control}
                            name="sodium"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sodium (Na⁺) (mEq/L)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Potassium */}
                        <FormField
                            control={form.control}
                            name="potassium"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Potassium (K⁺) (mEq/L)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Chloride */}
                        <FormField
                            control={form.control}
                            name="chloride"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chloride (Cl⁻) (mEq/L)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Bicarbonate */}
                        <FormField
                            control={form.control}
                            name="bicarbonate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bicarbonate (HCO₃⁻) (mEq/L)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter value" {...field} />
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

                            <Link to={`/pathology/hormone/electrolytes/report/$reportId`} params={{ reportId: reportId.toString() }}>
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
