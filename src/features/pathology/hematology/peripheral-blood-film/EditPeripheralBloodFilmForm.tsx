import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Microscope } from "lucide-react";

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { toast } from "sonner";

// --- Schema ---
const pbfSchema = z.object({
    rbcMorphology: z.string().min(1, { message: "Required" }),
    wbcMorphology: z.string().min(1, { message: "Required" }),
    platelet: z.string().min(1, { message: "Required" }),
    comments: z.string().optional(),
    machineId: z.string().optional(),
    testCarriedOutBy: z.string().optional(),
});

type PBFFormValues = z.infer<typeof pbfSchema>;

interface PeripheralBloodFilmFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    reportId: number;
    invoiceId: number;
}

export function EditPeripheralBloodFilmForm({ open, setOpen, reportId, invoiceId }: PeripheralBloodFilmFormProps) {
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const queryClient = useQueryClient();

    const form = useForm<PBFFormValues>({
        resolver: zodResolver(pbfSchema),
        defaultValues: {
            rbcMorphology: "",
            wbcMorphology: "",
            platelet: "",
            comments: "",
            machineId: "",
            testCarriedOutBy: "",
        },
    });

    // Fetch existing peripheral blood film data
    const { data: peripheralBloodFilm } = useQuery({
        queryKey: ["peripheral-blood", reportId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/peripheral-blood/${reportId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch test");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!reportId,
    });

    console.log('peripheralBloodFilm', peripheralBloodFilm);

    // Fetch machines data
    const { data: machinesData } = useQuery({
        queryKey: ["machine"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/machine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        },
    });

    const machineList = machinesData?.data?.items || [];

    useEffect(() => {
        if (peripheralBloodFilm) {
            form.reset({
                rbcMorphology: peripheralBloodFilm.rbc,
                wbcMorphology: peripheralBloodFilm.wbc,
                platelet: peripheralBloodFilm.platelets,
                comments: peripheralBloodFilm.remarks,
                machineId: peripheralBloodFilm.machine_id?.toString() || "",
                testCarriedOutBy: peripheralBloodFilm.test_carried_out_by || "",
            })
        }
    }, [peripheralBloodFilm]);



    //PUT api call

    const updatePeripheralBloodFilmMutation = useMutation({
        mutationFn: async (data: PBFFormValues) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/peripheral-blood/${reportId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        invoice_id: invoiceId,
                        rbc: data.rbcMorphology,
                        wbc: data.wbcMorphology,
                        platelets: data.platelet,
                        remarks: data.comments,
                        machine_id: data.machineId ? parseInt(data.machineId) : null,
                        test_carried_out_by: data.testCarriedOutBy,
                    }),
                }
            );
            if (!res.ok) throw new Error("Failed to update Peripheral Blood Film");
            return res.json();
        },
        onSuccess: (data) => {
            console.log("Peripheral Blood Film Updated API Response:", data);
            queryClient.invalidateQueries({ queryKey: ["peripheral-blood", reportId] });
            toast.success("Peripheral Blood Film updated successfully");
            navigate({ to: "/dashboard/pathology/hematology/peripheral-blood-film" });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update Peripheral Blood Film");
        },
    })

    function onSubmit(values: PBFFormValues) {
        console.log("Peripheral Blood Film Report:", values);
        updatePeripheralBloodFilmMutation.mutate(values);
        setOpen(false);
    }

    const handleView = () => alert("View triggered.");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="max-w-[450px] w-full overflow-y-auto">
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <Microscope className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">Edit Peripheral Blood Film (PBF)</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Update peripheral blood film findings</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <PatientInvoiceInfo
                        invoiceInfo={{
                            invoiceNo: "RPT-1006",
                            patientName: "Sabbir Hossain",
                            age: "27 Years",
                            gender: "Male",
                        }}
                    />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 mt-4 p-4"
                    >

                        {/* RBC Morphology */}
                        <FormField
                            control={form.control}
                            name="rbcMorphology"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RBC Morphology</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Normocytic, Microcytic, Hypochromic" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* WBC Morphology */}
                        <FormField
                            control={form.control}
                            name="wbcMorphology"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>WBC Morphology</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Neutrophilia, Lymphocytosis" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Platelet Count / Morphology */}
                        <FormField
                            control={form.control}
                            name="platelet"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Platelet Count / Morphology</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Adequate, Decreased" {...field} />
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
                                        <Textarea placeholder="Enter additional notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Test Carried Out By (Machine) */}
                        <FormField
                            control={form.control}
                            name="testCarriedOutBy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Test Carried Out By (Machine)</FormLabel>
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

                        {/* Buttons */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="submit"
                                variant="success"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Updating..." : "Update"}
                            </Button>

                            <Link to={`/pathology/hematology/peripheral-blood-film/report/$reportId`} params={{ reportId: reportId.toString() }}>
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