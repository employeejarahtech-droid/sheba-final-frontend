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

const bedResourceTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type BedResourceTypeValues = z.infer<typeof bedResourceTypeSchema>;

interface EditBedResourceTypeFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    bedResourceTypeId: number | null;
}

export function EditBedResourceTypeForm({ open, setOpen, bedResourceTypeId }: EditBedResourceTypeFormProps) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<BedResourceTypeValues>({
        resolver: zodResolver(bedResourceTypeSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Fetch resource type data
    const { data } = useQuery({
        queryKey: ["bed-resource-type", bedResourceTypeId],
        queryFn: async () => {
            if (!bedResourceTypeId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-resource-type/${bedResourceTypeId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch resource type");
            const result = await res.json();
            return result.data;
        },
        enabled: !!bedResourceTypeId && open,
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
        mutationFn: async (values: BedResourceTypeValues) => {
            if (!bedResourceTypeId) throw new Error("Resource type ID is required");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bed-resource-type/${bedResourceTypeId}`,
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
                throw new Error(error.message || "Failed to update resource type");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Resource type updated successfully");
            queryClient.invalidateQueries({ queryKey: ["bed-resource-type", bedResourceTypeId] });
            queryClient.invalidateQueries({ queryKey: ["bed-resource-types"] });
            queryClient.invalidateQueries({ queryKey: ["bed-resource-types-overall-stats"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update resource type");
        },
    });

    const onSubmit = (values: BedResourceTypeValues) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Resource Type</DialogTitle>
                    <DialogDescription>
                        Update resource type information
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
                                        <Input placeholder="Enter resource type name" {...field} />
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
