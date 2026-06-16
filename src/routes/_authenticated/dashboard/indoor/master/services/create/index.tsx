import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
;
;
;
;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Check, ChevronDown, Stethoscope } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard/indoor/master/services/create/')({
    component: CreateService,
})

const serviceSchema = z.object({
    serviceCategoryId: z.string().optional(),
    name: z.string().min(1, 'Service name is required'),
    price: z.coerce.number().min(0, 'Price must be zero or positive'),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
})

type ServiceValues = z.infer<typeof serviceSchema>

function CreateService() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');
    const [categoryOpen, setCategoryOpen] = useState(false);

    const form = useForm<ServiceValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            serviceCategoryId: "",
            name: "",
            price: 0,
            description: "",
            status: "Active",
        },
    })

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
            if (!res.ok) {
                // Return empty array instead of throwing error
                return { data: { items: [] } };
            }
            return res.json();
        },
        enabled: !!token,
        retry: false,
    });

    const categories = categoriesData?.data?.items || [];

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: ServiceValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/service`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    serviceCategoryId: (data.serviceCategoryId && data.serviceCategoryId !== "none") ? parseInt(data.serviceCategoryId) : null,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create service');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Service created successfully");
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['services-overall-stats'] });
            navigate({ to: '/dashboard/indoor/master/services' });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
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
                                                <FormLabel>Service Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. General Checkup, X-Ray" {...field} />
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
                                            render={({ field }) => {
                                                const selectedCategory = categories.find(
                                                    (cat: any) => cat.id.toString() === String(field.value)
                                                );
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
                                                                            (!field.value || field.value === "none") && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {selectedCategory
                                                                            ? selectedCategory.name
                                                                            : (field.value === "none" ? "No Category" : "Select category (optional)")}
                                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                                    </button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="Search category..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No category found.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            <CommandItem
                                                                                onSelect={() => { field.onChange("none"); setCategoryOpen(false); }}
                                                                            >
                                                                                No Category
                                                                                <Check className={cn("h-4 w-4 ml-auto", field.value === "none" ? "opacity-100" : "opacity-0")} />
                                                                            </CommandItem>
                                                                            {categories.map((cat: any) => (
                                                                                <CommandItem
                                                                                    key={cat.id}
                                                                                    onSelect={() => { field.onChange(cat.id.toString()); setCategoryOpen(false); }}
                                                                                >
                                                                                    {cat.name}
                                                                                    <Check className={cn("h-4 w-4 ml-auto", cat.id.toString() === String(field.value) ? "opacity-100" : "opacity-0")} />
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* Status */}
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
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
                                                <FormLabel>Price (৳)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                                                        <Input
                                                            type="number"
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
                                                        placeholder="Optional details about this service..."
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
    )
}
