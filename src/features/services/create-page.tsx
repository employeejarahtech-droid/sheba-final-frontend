import { useNavigate } from '@tanstack/react-router'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ArrowLeft, Stethoscope } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
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
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const serviceSchema = z.object({
    serviceCategoryId: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
});


type ServiceValues = z.infer<typeof serviceSchema>;

export default function CreateServicePage() {
    const navigate = useNavigate();
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
    });


    const categories = categoriesData?.data?.items || [];

    const createMutation = useMutation({
        mutationFn: async (data: ServiceValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/service`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: data.name,
                    price: data.price ? parseFloat(data.price) : 0,
                    description: data.description,
                    status: data.status,
                    serviceCategoryId: (data.serviceCategoryId && data.serviceCategoryId !== "none") ? parseInt(data.serviceCategoryId) : null
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create service");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Service created successfully");
            queryClient.invalidateQueries({ queryKey: ["services"] });
            queryClient.invalidateQueries({ queryKey: ["services-overall-stats"] });
            navigate({ to: '/dashboard/indoor/master/services' });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create service");
        },
    });

    const onSubmit = (data: ServiceValues) => {
        createMutation.mutate(data);
    };

    return (
        <>
            <AppHeader fixed />

            <Main className="flex flex-1 flex-col gap-6">
                <Form {...form}>
                    <form
                        id="create-service-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 w-full min-w-[650px] max-w-[750px] mx-auto px-4"
                    >
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate({ to: '/dashboard/indoor/master/services' })}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        Create New Service
                                    </h1>
                                    <p className="text-muted-foreground text-sm">Add a new service to the system</p>
                                </div>
                            </div>
                        </div>

                        {/* Service Information */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Stethoscope className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Service Information</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Name, category, pricing, and status</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Service Name */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Name <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. General Consultation" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Category */}
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

                                        {/* Status */}
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
                                    </div>

                                    {/* Price */}
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price (৳) <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            className="pl-7"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Description */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter description (optional)"
                                                        className="min-h-[80px] resize-y"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pb-10">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate({ to: '/dashboard/indoor/master/services' })}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={createMutation.isPending}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
                            >
                                {createMutation.isPending ? "Creating..." : "Create Service"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Main>
        </>
    );
}
