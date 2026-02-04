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
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { useNavigate } from "@tanstack/react-router";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

// --- Schema ---
const bloodGroupSchema = z.object({
    aboGroup: z.string().min(1, { message: "Required" }),
    rhFactor: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
});

type BloodGroupFormValues = z.infer<typeof bloodGroupSchema>;

interface BloodGroupFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditBloodGroupForm({ open, setOpen, reportId, invoiceId }: BloodGroupFormProps) {
    const navigate = useNavigate();

    const token = getCookie('accessToken');
    const queryClient = useQueryClient();

    const form = useForm<BloodGroupFormValues>({
        resolver: zodResolver(bloodGroupSchema),
        defaultValues: {
            aboGroup: "",
            rhFactor: "",
            comments: "",
        },
    });


    // Fetching existing data
    const { data: bloodGroupData } = useQuery({
        queryKey: ["blood-group", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/blood-group/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Blood Group Test report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    useEffect(() => {
        if (bloodGroupData) {
            form.reset({
                aboGroup: bloodGroupData.blood_group || '',
                rhFactor: bloodGroupData.rh_factor || '',
                comments: bloodGroupData.remarks || '',
            })
        }
    }, [bloodGroupData]);


    //PUT api call

    const updateBloodGroupMutation = useMutation({
        mutationFn: async (payload: BloodGroupFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/blood-group/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    blood_group: payload.aboGroup,
                    rh_factor: payload.rhFactor,
                    remarks: payload.comments,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Blood Group test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/pathology/immunology/blood-group" });
            // optional:
            // form.reset();
            queryClient.invalidateQueries({
                queryKey: ["blood-group", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });


    function onSubmit(values: BloodGroupFormValues) {
        console.log("Blood Group Report:", values);
        updateBloodGroupMutation.mutate(values);
        setOpen(false);
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Blood Group</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1008",
                            patientName: "Jahid Hasan",
                            age: "25 Years",
                            gender: "Male",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* ABO Group */}
                        <FormField
                            control={form.control}
                            name="aboGroup"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ABO Group</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., A, B, AB, O" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Rh Factor */}
                        <FormField
                            control={form.control}
                            name="rhFactor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rh Factor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Positive / Negative" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Comments / Remarks */}
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

                            <Link to={`/pathology/immunology/blood-group/report/$reportId`} params={{ reportId: reportId.toString() }}>
                                <Button type="button" variant="warning">
                                    Print Preview
                                </Button>
                            </Link>

                            <Button type="button" variant="info">
                                View
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}