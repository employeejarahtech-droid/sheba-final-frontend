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

const anasthesiaTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type AnasthesiaTypeValues = z.infer<typeof anasthesiaTypeSchema>;

interface EditAnasthesiaTypeFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    anasthesiaTypeId: number | null;
}

export function EditAnasthesiaTypeForm({ open, setOpen, anasthesiaTypeId }: EditAnasthesiaTypeFormProps) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<AnasthesiaTypeValues>({
        resolver: zodResolver(anasthesiaTypeSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Fetch anasthesia type data
    const { data } = useQuery({
        queryKey: ["anasthesia-type", anasthesiaTypeId],
        queryFn: async () => {
            if (!anasthesiaTypeId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/anasthesia-type/${anasthesiaTypeId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch anasthesia type");
            const result = await res.json();
            return result.data;
        },
        enabled: !!anasthesiaTypeId && open,
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
        mutationFn: async (values: AnasthesiaTypeValues) => {
            if (!anasthesiaTypeId) throw new Error("Anasthesia type ID is required");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/anasthesia-type/${anasthesiaTypeId}`,
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
                throw new Error(error.message || "Failed to update anasthesia type");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Anasthesia type updated successfully");
            queryClient.invalidateQueries({ queryKey: ["anasthesia-type", anasthesiaTypeId] });
            queryClient.invalidateQueries({ queryKey: ["anasthesia-types"] });
            queryClient.invalidateQueries({ queryKey: ["anasthesia-types-overall-stats"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update anasthesia type");
        },
    });

    const onSubmit = (values: AnasthesiaTypeValues) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Anasthesia Type</DialogTitle>
                    <DialogDescription>
                        Update anasthesia type information
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
                                        <Input placeholder="Enter anasthesia type name" {...field} />
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
