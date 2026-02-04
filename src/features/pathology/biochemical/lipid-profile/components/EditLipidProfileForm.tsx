import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"; // Adjust import path as needed
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"; // Adjust import path as needed
import { Input } from "@/components/ui/input"; // Adjust import path as needed
import { Button } from "@/components/ui/button"; // Assuming Button is available
import PatientInvoiceInfo from "@/components/pathology/PatientInvoiceInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";
import { useEffect } from "react";
//import { outdoorInvoices } from "@/data/data";

// --- 1. Define the Schema using Zod ---
// This schema defines the shape and validation rules for your form data.
const formSchema = z.object({
    // Use .string().regex() for number-only input or .coerce.number() for actual numbers
    cholesterol: z.string().min(1, { message: "Required" }),
    ldl: z.string().min(1, { message: "Required" }),
    hdl: z.string().min(1, { message: "Required" }),
    triglycerides: z.string().min(1, { message: "Required" }),
    vldl: z.string().min(1, { message: "Required" }),
    cholesterol_ratio: z.string().min(1, { message: "Required" }),
    testCarriedOutBy: z.string().optional(),
});

// Infer the TypeScript type from the Zod schema
type LipidProfileFormValues = z.infer<typeof formSchema>;

// Define the component props
interface EditLipidProfileFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
    // Optionally, you might pass initial data here:
    // initialData?: LipidProfileFormValues;
}

export function EditLipidProfileForm({ open, setOpen, reportId, invoiceId }: EditLipidProfileFormProps) {

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const token = getCookie('accessToken');
    // --- 2. Initialize the form using useForm ---
    const form = useForm<LipidProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cholesterol: '',
            ldl: '',
            hdl: '',
            triglycerides: '',
            vldl: '',
            cholesterol_ratio: '',
            testCarriedOutBy: "",
        },
        // You could set initial data here if passed via props
        // values: initialData,
    });

    // Fetching existing data
    const { data: lipidProfileData } = useQuery({
        queryKey: ["lipid-profile", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/lipid-profile/${reportId}`,
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

    console.log('lipid-profile', lipidProfileData);

    useEffect(() => {
        if (lipidProfileData) {
            form.reset({
                cholesterol: lipidProfileData.total_cholesterol || '',
                hdl: lipidProfileData.hdl || '',
                ldl: lipidProfileData.ldl || '',
                triglycerides: lipidProfileData.triglycerides || '',
                vldl: lipidProfileData.vldl || '',
                cholesterol_ratio: lipidProfileData.cholesterol_ratio || '',
            })
        }
    }, [lipidProfileData]);

    //POST api call

    const updateLipidProfileMutation = useMutation({
        mutationFn: async (payload: LipidProfileFormValues) => {
            console.log("Payload:", payload);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lipid-profile/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    total_cholesterol:payload.cholesterol,
                    hdl: payload.hdl,
                    ldl:payload.ldl,
                    triglycerides: payload.triglycerides,
                    vldl: payload.vldl,
                    cholesterol_ratio: payload.cholesterol_ratio,
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            console.log("Updated API Response:", data);
            queryClient.invalidateQueries({ queryKey: ["lipid-profile", reportId] });
            toast.success(data.message || "lipid-profile created successfully!");
            navigate({ to: "/pathology/biochemical/lipid-profile" });
        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    // --- 3. Define the submission handler ---
    function onSubmit(values: LipidProfileFormValues) {
        // The 'values' object is guaranteed to be validated against formSchema
        console.log("Form submitted with validated data:", values);

        updateLipidProfileMutation.mutate(values);
        setOpen(false); // close drawer on successful submission
    }

    // Helper to handle the other button actions
    const handleView = () => alert("View action triggered.");


    const machineList = [
        "Sysmex XN-1000",
        "Sysmex XP-300",
        "Mindray BC-20",
        "Abbott CELL-DYN Ruby",
        "Nihon Kohden MEK-9100",
    ];

    //const invoice = outdoorInvoices.find((item) => item.id === reportId);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="max-w-[400px] sm:max-w-[450px] w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Lipid Profile</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{ invoiceNo: "RPT-1001", patientName: "Maksudul Haque", age: "40 Years", gender: "Male" }} />
                </div>
                {/* --- 4. Wrap the form content with the <Form> component --- */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 p-4">

                        {/* --- Cholesterol Field --- */}
                        <FormField
                            control={form.control}
                            name="cholesterol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Cholesterol (mg/dL)</FormLabel>
                                    <FormControl>
                                        {/* The {...field} spreads value, onChange, onBlur */}
                                        <Input type="number" placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- LDL Field --- */}
                        <FormField
                            control={form.control}
                            name="ldl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>LDL Cholesterol (mg/dL)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- HDL Field --- */}
                        <FormField
                            control={form.control}
                            name="hdl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>HDL Cholesterol (mg/dL)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* --- Triglycerides Field --- */}
                        <FormField
                            control={form.control}
                            name="triglycerides"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Triglycerides (mg/dL)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                         <FormField
                            control={form.control}
                            name="vldl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>VLDL Cholesterol (mg/dL)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        
                         <FormField
                            control={form.control}
                            name="cholesterol_ratio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cholesterol Ratio</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter value" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />



                        {/* TEST CARRIED OUT BY */}
                        <FormField
                            control={form.control}
                            name="testCarriedOutBy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Test carried out by</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select lab technician" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {machineList.map((machine) => (
                                                    <SelectItem key={machine} value={machine}>
                                                        {machine}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        {/* --- Action Buttons --- */}
                        <div className="flex justify-center gap-2 pt-4">
                            {/* This button triggers form.handleSubmit(onSubmit) */}
                            <Button type="submit" variant="success" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to="/pathology/biochemical/lipid-profile/report/$reportId" params={{ reportId: String(reportId) }}>
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