import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { toast } from "sonner";

const bedResourceTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type BedResourceTypeValues = z.infer<typeof bedResourceTypeSchema>;

export function CreateBedResourceTypeForm() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<BedResourceTypeValues>({
        resolver: zodResolver(bedResourceTypeSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: BedResourceTypeValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-resource-type`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create resource type");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Resource type created successfully");
            queryClient.invalidateQueries({ queryKey: ["bed-resource-types"] });
            queryClient.invalidateQueries({ queryKey: ["bed-resource-types-overall-stats"] });
            form.reset();
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create resource type");
        },
    });

    const onSubmit = (data: BedResourceTypeValues) => {
        createMutation.mutate(data);
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Add Resource Type
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Resource Type</DialogTitle>
                        <DialogDescription>
                            Add a new bed resource type to the system
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
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending && (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    )}
                                    Create
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
