import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";

const patientTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type PatientTypeValues = z.infer<typeof patientTypeSchema>;

interface EditPatientTypeFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    patientTypeId: number | null;
}

export function EditPatientTypeForm({ open, setOpen, patientTypeId }: EditPatientTypeFormProps) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<PatientTypeValues>({
        resolver: zodResolver(patientTypeSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Fetch patient type data
    const { data } = useQuery({
        queryKey: ["patient-type", patientTypeId],
        queryFn: async () => {
            if (!patientTypeId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient-type/${patientTypeId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch patient type");
            const result = await res.json();
            return result.data;
        },
        enabled: !!patientTypeId && open,
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (data) {
            form.reset({
                name: data.name || "",
                description: data.description || "",
            });
        }
    }, [data, form]);

    const updateMutation = useMutation({
        mutationFn: async (values: PatientTypeValues) => {
            if (!patientTypeId) throw new Error("Patient type ID is required");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient-type/${patientTypeId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(values),
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update patient type");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Patient type updated successfully");
            queryClient.invalidateQueries({ queryKey: ["patient-type", patientTypeId] });
            queryClient.invalidateQueries({ queryKey: ["patient-types"] });
            queryClient.invalidateQueries({ queryKey: ["patient-types-overall-stats"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update patient type");
        },
    });

    const onSubmit = (values: PatientTypeValues) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Patient Type</DialogTitle>
                    <DialogDescription>
                        Update patient type information
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter patient type name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter description (optional)"
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Update
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
