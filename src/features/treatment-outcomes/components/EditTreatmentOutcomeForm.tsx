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

const treatmentOutcomeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type TreatmentOutcomeValues = z.infer<typeof treatmentOutcomeSchema>;

interface EditTreatmentOutcomeFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    treatmentOutcomeId: number | null;
}

export function EditTreatmentOutcomeForm({ open, setOpen, treatmentOutcomeId }: EditTreatmentOutcomeFormProps) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<TreatmentOutcomeValues>({
        resolver: zodResolver(treatmentOutcomeSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Fetch treatment outcome data
    const { data } = useQuery({
        queryKey: ["treatment-outcome", treatmentOutcomeId],
        queryFn: async () => {
            if (!treatmentOutcomeId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/treatment-outcome/${treatmentOutcomeId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch treatment outcome");
            const result = await res.json();
            return result.data;
        },
        enabled: !!treatmentOutcomeId && open,
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
        mutationFn: async (values: TreatmentOutcomeValues) => {
            if (!treatmentOutcomeId) throw new Error("Treatment outcome ID is required");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/treatment-outcome/${treatmentOutcomeId}`,
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
                throw new Error(error.message || "Failed to update treatment outcome");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Treatment outcome updated successfully");
            queryClient.invalidateQueries({ queryKey: ["treatment-outcome", treatmentOutcomeId] });
            queryClient.invalidateQueries({ queryKey: ["treatment-outcomes"] });
            queryClient.invalidateQueries({ queryKey: ["treatment-outcomes-overall-stats"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update treatment outcome");
        },
    });

    const onSubmit = (values: TreatmentOutcomeValues) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Treatment Outcome</DialogTitle>
                    <DialogDescription>
                        Update treatment outcome information
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
                                        <Input placeholder="Enter treatment outcome name" {...field} />
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
