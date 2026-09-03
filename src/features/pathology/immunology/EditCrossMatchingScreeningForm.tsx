import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { TestTube2, Activity } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

// Result options for the ICT screening selects (as designed in the
// cross_matching_screening form schema).
const ICT_OPTIONS = ["Negetive (-Ve)", "Possitive (+Ve)"];

// The 11 designed fields. `key` matches the API column 1:1.
const ICT_FIELDS: { label: string; key: string }[] = [
    { label: "ICT for TPHA", key: "ictForTpha" },
    { label: "ICT for HBsAg", key: "ictForHbsag" },
    { label: "ICT for HIV", key: "ictForHiv" },
    { label: "ICT for HCV", key: "ictForHcv" },
    { label: "ICT for Malaria Parasite (MP)", key: "ictForMalariaParasiteMp" },
];

const TEXT_FIELDS: { label: string; key: string; placeholder: string }[] = [
    { label: "Major Crossmatch", key: "majorCrossmatch", placeholder: "e.g., Compatible" },
    { label: "Antibody Identification", key: "antibodyIdentification", placeholder: "e.g., Not Detected" },
    { label: "Compatible Blood Unit", key: "compatibleBloodUnit", placeholder: "e.g., 1 Unit" },
    { label: "Bag No", key: "bagNo", placeholder: "e.g., BAG-2041" },
    { label: "Donor ABO/Rh", key: "donorAboRh", placeholder: "e.g., O Positive" },
    { label: "Crossmatch Method", key: "crossmatchMethod", placeholder: "e.g., Saline / Albumin" },
];

// camelCase (form) → snake_case (API) for the 11 result fields.
const API_KEY_MAP: Record<string, string> = {
    ictForTpha: 'ict_for_tpha',
    ictForHbsag: 'ict_for_hbsag',
    ictForHiv: 'ict_for_hiv',
    ictForHcv: 'ict_for_hcv',
    ictForMalariaParasiteMp: 'ict_for_malaria_parasite_mp',
    majorCrossmatch: 'major_crossmatch',
    antibodyIdentification: 'antibody_identification',
    compatibleBloodUnit: 'compatible_blood_unit',
    bagNo: 'bag_no',
    donorAboRh: 'donor_abo_rh',
    crossmatchMethod: 'crossmatch_method',
};

// API snake_case → form camelCase for loading existing data.
const FROM_API_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(API_KEY_MAP).map(([camel, snake]) => [snake, camel])
);

// --- Schema ---
const crossMatchingSchema = z.object({
    ictForTpha: z.string().optional(),
    ictForHbsag: z.string().optional(),
    ictForHiv: z.string().optional(),
    ictForHcv: z.string().optional(),
    ictForMalariaParasiteMp: z.string().optional(),
    majorCrossmatch: z.string().optional(),
    antibodyIdentification: z.string().optional(),
    compatibleBloodUnit: z.string().optional(),
    bagNo: z.string().optional(),
    donorAboRh: z.string().optional(),
    crossmatchMethod: z.string().optional(),
    comments: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
    machineId: z.string().optional(),
    status: z.union([z.literal('complete'), z.literal('incomplete')]),
});

type CrossMatchingFormValues = z.infer<typeof crossMatchingSchema>;

interface CrossMatchingFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditCrossMatchingScreeningForm({ open, setOpen, reportId, invoiceId }: CrossMatchingFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const token = getCookie('accessToken');

    const form = useForm<CrossMatchingFormValues>({
        resolver: zodResolver(crossMatchingSchema),
        defaultValues: {
            ictForTpha: "",
            ictForHbsag: "",
            ictForHiv: "",
            ictForHcv: "",
            ictForMalariaParasiteMp: "",
            majorCrossmatch: "",
            antibodyIdentification: "",
            compatibleBloodUnit: "",
            bagNo: "",
            donorAboRh: "",
            crossmatchMethod: "",
            comments: "",
            testCarriedOutBy: "",
            machineId: "",
            status: "incomplete",
        },
    });


    // Fetching existing data
    const { data: cmsData } = useQuery({
        queryKey: ["cross-matching-screening", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/cross-matching-screening/${reportId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Cross Matching & Screening report");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    useEffect(() => {
        if (cmsData) {
            const values: any = {
                comments: cmsData.remarks || '',
                testCarriedOutBy: cmsData.test_carried_out_by || '',
                machineId: cmsData.machine_id ? String(cmsData.machine_id) : '',
                status: String(cmsData.status).trim().toLowerCase() === 'complete' ? 'complete' : 'incomplete',
            };
            for (const [snake, camel] of Object.entries(FROM_API_MAP)) {
                values[camel] = (cmsData as any)[snake] || '';
            }
            form.reset(values)
        }
    }, [cmsData]);


    //PUT api call

    const updateCrossMatchingMutation = useMutation({
        mutationFn: async (payload: CrossMatchingFormValues) => {
            const body: Record<string, any> = {
                invoice_id: invoiceId,
                remarks: payload.comments,
                test_carried_out_by: payload.testCarriedOutBy,
                machine_id: payload.machineId ? parseInt(payload.machineId) : null,
                status: payload.status,
            };
            for (const [camel, snake] of Object.entries(API_KEY_MAP)) {
                body[snake] = (payload as any)[camel] || '';
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cross-matching-screening/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update Cross Matching & Screening test");
            }

            return res.json();
        },

        onSuccess: (data) => {
            toast.success(data.message || "Test updated successfully!");
            navigate({ to: "/dashboard/pathology/immunology/cross-matching-screening" });
            queryClient.invalidateQueries({
                queryKey: ["cross-matching-screening", reportId],
            });
            queryClient.invalidateQueries({
                queryKey: ["cross-matching-screening"],
            });

        },

        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    function onSubmit(values: CrossMatchingFormValues) {
        updateCrossMatchingMutation.mutate(values);
        setOpen(false);
    }

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

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-b py-3 px-4 gap-0">
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-md text-white">
                            <TestTube2 className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">Edit Cross Matching &amp; Screening</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update cross match &amp; screening results</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo invoiceInfo={{
                        invoiceNo: cmsData?.invoice_id ? `RPT-${cmsData.invoice_id}` : "—",
                        patientName: cmsData?.outdoor_invoice?.patient_name || "—",
                        age: cmsData?.outdoor_invoice?.age_text || cmsData?.outdoor_invoice?.age || "—",
                        gender: cmsData?.outdoor_invoice?.sex || "—",
                    }} />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* ICT screening selects */}
                        <div className="space-y-4">
                            {ICT_FIELDS.map((f) => (
                                <FormField
                                    key={f.key}
                                    control={form.control}
                                    name={f.key as keyof CrossMatchingFormValues}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{f.label}</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select result" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ICT_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        {/* Cross match / blood unit text fields */}
                        <div className="space-y-4">
                            {TEXT_FIELDS.map((f) => (
                                <FormField
                                    key={f.key}
                                    control={form.control}
                                    name={f.key as keyof CrossMatchingFormValues}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{f.label}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={f.placeholder} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

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

                        {/* TEST CARRIED OUT BY */}
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
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border rounded-lg p-4">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-md">
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
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Saving..." : "Save"}
                            </Button>

                            <Link to={`/dashboard/pathology/immunology/cross-matching-screening/report/$reportId`} params={{ reportId: reportId.toString() }}>
                                <Button type="button" variant="warning">
                                    Print Preview
                                </Button>
                            </Link>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
