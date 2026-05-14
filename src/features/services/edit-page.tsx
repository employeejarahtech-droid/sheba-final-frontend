import { useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Stethoscope, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const serviceSchema = z.object({
    serviceCategoryId: z.string().optional(),
    name: z.string().min(1, 'Service name is required'),
    price: z.coerce.number().min(0, 'Price must be zero or positive'),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
})

type ServiceValues = z.infer<typeof serviceSchema>

interface EditServicePageProps {
    id: string
}

export default function EditServicePage({ id: serviceId }: EditServicePageProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');
    const [catOpen, setCatOpen] = useState(false);

    // Fetch service data
    const { data: serviceData, isLoading, error } = useQuery({
        queryKey: ['service', serviceId],
        queryFn: async () => {
            if (!serviceId) return null
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/service/${serviceId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )
                if (!res.ok) {
                    console.error('Failed to fetch service:', res.status);
                    throw new Error('Failed to fetch service')
                }
                const result = await res.json()
                console.log('API Response - Full result:', result)
                console.log('API Response - Service data:', result.data)
                return result.data
            } catch (error) {
                console.error('Error fetching service:', error);
                throw error;
            }
        },
        enabled: !!serviceId && !!token,
    })

    // Fetch service categories for dropdown
    const { data: categoriesData } = useQuery({
        queryKey: ['service-categories'],
        queryFn: async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/service-category?limit=100`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!res.ok) {
                    console.error('Failed to fetch categories:', res.status);
                    return { data: { items: [] } };
                }
                const result = await res.json();
                console.log('Categories API Response:', result);
                console.log('Categories items:', result.data?.items);
                return result;
            } catch (error) {
                console.error('Error fetching categories:', error);
                return { data: { items: [] } };
            }
        },
        enabled: !!token,
        retry: false,
    });

    const categories = categoriesData?.data?.items || [];

    // Initialize form with default values - will be updated by useEffect when data loads
    const form = useForm<ServiceValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            serviceCategoryId: "none",
            name: "",
            description: "",
            price: 0,
            status: "Active",
        },
    })

    // Update form when service data loads
    useEffect(() => {
        if (serviceData) {
            const categoryId = serviceData.service_category_id
                ? serviceData.service_category_id.toString()
                : "none";
            console.log('Edit Service - service_category_id:', serviceData.service_category_id);
            console.log('Edit Service - setting serviceCategoryId to:', categoryId);
            form.reset({
                serviceCategoryId: categoryId,
                name: serviceData.name || "",
                description: serviceData.description || "",
                price: serviceData.price ? Number(serviceData.price) : 0,
                status: serviceData.status || "Active",
            })
        }
    }, [serviceData, form])

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: ServiceValues) => {
            if (!serviceId) throw new Error('Service ID is required')
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/service/${serviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: data.name,
                    price: data.price,
                    description: data.description,
                    status: data.status,
                    service_category_id: (data.serviceCategoryId && data.serviceCategoryId !== "none") ? parseInt(data.serviceCategoryId) : null,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update service')
            }

            return res.json()
        },
        onSuccess: () => {
            toast.success("Service updated successfully");
            queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
            queryClient.invalidateQueries({ queryKey: ['services'] })
            queryClient.invalidateQueries({ queryKey: ['services-overall-stats'] })
            navigate({ to: '/indoor/master/services' })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update service')
        }
    });

    const onSubmit = (data: ServiceValues) => {
        updateMutation.mutate(data);
    };

    // Don't render form until service data is loaded
    if (!serviceData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Failed to load service data</p>
                    <Button
                        variant="outline"
                        onClick={() => navigate({ to: '/indoor/master/services' })}
                    >
                        Back to Services
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <AppHeader fixed />

            <Main className="p-6 lg:p-8 w-full flex-1">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                Edit Service
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Update service details and pricing
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => navigate({ to: '/indoor/master/services' })}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    <Form {...form}>
                        <form id="edit-service-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" key={serviceData?.id || 'edit-form'}>
                            <Card className="border dark:border-gray-800 overflow-hidden pt-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b-1 dark:border-gray-800 py-2 gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                                            <Stethoscope className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">Service Information</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Update the service details and pricing
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <div className="py-5 space-y-5">
                                        {/* Category */}
                                        <FormField
                                            control={form.control}
                                            name="serviceCategoryId"
                                            render={({ field }) => {
                                                const selectedCategory = categories?.find(
                                                    (cat: any) => cat.id.toString() === field.value
                                                );
                                                console.log('Category field value:', field.value);
                                                console.log('Categories available:', categories);
                                                console.log('Selected category:', selectedCategory);
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Popover open={catOpen} onOpenChange={setCatOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex justify-between items-center px-3 py-2 border border-input rounded-md h-10 bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {selectedCategory?.name || (field.value === "none" ? "No Category" : "Select category")}
                                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                                    </button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="Search category..." className="h-10" />
                                                                    <CommandList className="max-h-[250px]">
                                                                        <CommandEmpty>No category found.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            <CommandItem
                                                                                onSelect={() => {
                                                                                    field.onChange("none");
                                                                                    setCatOpen(false);
                                                                                }}
                                                                            >
                                                                                No Category
                                                                                <Check
                                                                                    className={cn(
                                                                                        "h-4 w-4 ml-auto",
                                                                                        field.value === "none" ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                            </CommandItem>
                                                                            {categories?.map((cat: any) => (
                                                                                <CommandItem
                                                                                    key={cat.id}
                                                                                    onSelect={() => {
                                                                                        field.onChange(cat.id.toString());
                                                                                        setCatOpen(false);
                                                                                    }}
                                                                                >
                                                                                    {cat.name}
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "h-4 w-4 ml-auto",
                                                                                            cat.id.toString() === field.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
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

                                        {/* Service Name */}
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Service Name <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. General Checkup, X-Ray"
                                                            className="h-10"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                                                    className="h-10 pl-7"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
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
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <SelectTrigger className="h-10 w-full !h-auto">
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Active">Active</SelectItem>
                                                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

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
                                                            className="min-h-24 resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        Enter any additional information about this service (optional)
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate({ to: '/indoor/master/services' })}
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                    ) : null}
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    )
}
