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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const serviceSchema = z.object({
    serviceCategoryId: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
});

type ServiceValues = z.infer<typeof serviceSchema>;

interface EditServiceFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    serviceId: number | null;
}

export function EditServiceForm({ open, setOpen, serviceId }: EditServiceFormProps) {
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<ServiceValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            serviceCategoryId: "none",
            name: "",
            description: "",
            price: "",
            status: "Active",
        },
    });

    // Fetch service data
    const { data } = useQuery({
        queryKey: ["service", serviceId],
        queryFn: async () => {
            if (!serviceId) return null;
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service/${serviceId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch service");
            const result = await res.json();
            return result.data;
        },
        enabled: !!serviceId && open,
    });

    // Fetch service categories for dropdown
    const { data: categoriesData } = useQuery({
        queryKey: ["service-categories"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service-category?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch service categories");
            return res.json();
        },
        enabled: open,
    });

    const categories = categoriesData?.data?.items || [];

    // Populate form when data is loaded
    useEffect(() => {
        if (data) {
            form.reset({
                name: data.name || "",
                description: data.description || "",
                price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0),
                status: data.status || "Active",
                serviceCategoryId: data.serviceCategoryId?.toString() || "none",
            });
        }
    }, [data, form]);

    const updateMutation = useMutation({
        mutationFn: async (values: ServiceValues) => {
            if (!serviceId) throw new Error("Service ID is required");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service/${serviceId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: values.name,
                        price: values.price ? parseFloat(values.price) : 0,
                        description: values.description,
                        status: values.status,
                        service_category_id: (values.serviceCategoryId && values.serviceCategoryId !== "none") ? parseInt(values.serviceCategoryId) : null,
                    }),
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update service");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Service updated successfully");
            queryClient.invalidateQueries({ queryKey: ["service", serviceId] });
            queryClient.invalidateQueries({ queryKey: ["services"] });
            queryClient.invalidateQueries({ queryKey: ["services-overall-stats"] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update service");
        },
    });

    const onSubmit = (values: ServiceValues) => {
        updateMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Service</DialogTitle>
                    <DialogDescription>
                        Update service information
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="serviceCategoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category (optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">No Category</SelectItem>
                                            {categories.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter service name" {...field} />
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
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (৳)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
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
