import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { FlaskConical, Activity } from "lucide-react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

// --- Schema ---
const skinScrapingSchema = z.object({
    site: z.string().min(1, { message: "Required" }),
    fungus_type: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type SkinScrapingFormValues = z.infer<typeof skinScrapingSchema>;

interface SkinScrapingFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditSkinScrapingForFungalForm({ open, setOpen, reportId, invoiceId }: SkinScrapingFormProps) {
     const navigate = useNavigate();

        const token = getCookie('accessToken');
        const queryClient = useQueryClient();

    const form = useForm<SkinScrapingFormValues>({
        resolver: zodResolver(skinScrapingSchema),
        defaultValues: {
            site: "",
            fungus_type: "",
            comments: "",
            testCarriedOutBy: "",
            machineId: "",
            status: "incomplete",
        },
    });


    // Fetching existing data
    const { data: skinScrappingData } = useQuery({
        queryKey: ["skin-scraping", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/skin-scraping/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch skin scraping test report");
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
        if (skinScrappingData) {
            form.reset({
                site: skinScrappingData.site || '',
                fungus_type: skinScrappingData.fungus_type || '',
                comments: skinScrappingData.remarks || '',
                testCarriedOutBy: skinScrappingData.test_carried_out_by || '',
                machineId: skinScrappingData.machine_id?.toString() || '',
                status: String(skinScrappingData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
            })
        }
    }, [skinScrappingData, form]);

    //PUT api call

    const updateSkinScrappingMutation = useMutation({
        mutationFn: async (payload: SkinScrapingFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/skin-scraping/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    site: payload.site,
                    fungus_type: payload.fungus_type,
                    remarks: payload.comments,
                    test_carried_out_by: payload.testCarriedOutBy,
                    machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                    status: payload.status,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update skin scraping test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test created successfully!");
            console.log("API Response:", data);
            navigate({ to: "/dashboard/pathology/hormone/skin-scrapping-for-fungus" });
            // optional:
            // form.reset();
            queryClient.invalidateQueries({
                queryKey: ["skin-scraping", reportId],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });



    function onSubmit(values: SkinScrapingFormValues) {
        console.log("Skin Scraping for Fungal Study:", values);
        updateSkinScrappingMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => {
        setOpen(false);
        navigate({ to: "/dashboard/pathology/hormone/skin-scrapping-for-fungus" });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="max-w-[400px] sm:max-w-[450px] w-full overflow-y-auto p-0">
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0 mb-4">
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <FlaskConical className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">Edit Skin Scraping for Fungal Study</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update KOH mount results and remarks</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{
                        invoiceNo: skinScrappingData?.invoice_id ? `RPT-${skinScrappingData.invoice_id}` : "—",
                        patientName: skinScrappingData?.outdoor_invoice?.patient_name || "—",
                        age: skinScrappingData?.outdoor_invoice?.age_text || skinScrappingData?.outdoor_invoice?.age || "—",
                        gender: skinScrappingData?.outdoor_invoice?.sex || "—",
                    }} />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-4"
                    >

                        {/* KOH Result */}
                        <FormField
                            control={form.control}
                            name="site"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>10% KOH Mount Result</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Positive / Negative" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        {/* Type of Fungus */}
                        <FormField
                            control={form.control}
                            name="fungus_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type of Fungus Identified (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Dermatophytes, Candida" {...field} />
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
                                    <FormLabel>Comments / Impression (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Add clinical notes..." {...field} />
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

                        {/* Report Status */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border rounded-lg p-4">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">Report Status</h3>
                                    <p className="text-xs text-gray-600">Mark report as complete or incomplete</p>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value === 'complete' ? 'complete' : 'incomplete'}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="incomplete">Incomplete</SelectItem>
                                                    <SelectItem value="complete">Complete</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-between gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                className="flex-1"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/dashboard/pathology/hormone/skin-scrapping-for-fungus/report/$reportId" params={{ reportId: reportId.toString() }} className="flex-1">
                                <Button type="button" variant="warning" className="w-full">
                                    Print Preview
                                </Button>
                            </Link>

                            <Button type="button" variant="info" className="flex-1" onClick={handleView}>
                                View
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}

