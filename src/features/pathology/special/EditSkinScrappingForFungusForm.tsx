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
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
 
// --- Schema ---
const skinScrapingSchema = z.object({
    site: z.string().min(1, { message: "Required" }),
    fungus_type: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
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

    console.log("Sputum Data:", skinScrappingData);

    useEffect(() => {
        if (skinScrappingData) {
            form.reset({
                site: skinScrappingData.site || '',
                fungus_type: skinScrappingData.fungus_type || '',
                comments: skinScrappingData.remarks || '',
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
            navigate({ to: "/pathology/hormone/skin-scrapping-for-fungus" });
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
 
    const handleView = () => alert("View triggered.");
 
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Skin Scraping for Fungal Study</SheetTitle>
                </SheetHeader>
 
                <div className="px-4">
                    <PatientInvoiceInfo
                    invoiceInfo={{
                        invoiceNo: "RPT-1010",
                        patientName: "Jannatul Ferdous",
                        age: "33 Years",
                        gender: "Female",
                    }}
                />
                </div>
 
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
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
                                        <Input placeholder="Add clinical notes..." {...field} />
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
 
                            <Link to={`/pathology/hormone/skin-scrapping-for-fungus/report/$reportId`} params={{ reportId: reportId.toString() }} >
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
 