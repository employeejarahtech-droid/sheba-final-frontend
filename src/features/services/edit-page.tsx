import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Header } from '@/components/layout/header';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Stethoscope } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Loader2 } from 'lucide-react';

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

    const form = useForm<ServiceValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            serviceCategoryId: "none",
            name: "",
            price: 0,
            description: "",
            status: "Active",
        },
    })

    // Fetch service categories for dropdown
    const { data: categoriesData } = useQuery({
        queryKey: ['service-categories'],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service-category?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) {
                return { data: { items: [] } };
            }
            return res.json();
        },
        enabled: !!token,
        retry: false,
    });

    const categories = categoriesData?.data?.items || [];

    // Fetch service data
    const { data: serviceData, isLoading } = useQuery({
        queryKey: ['service', serviceId],
        queryFn: async () => {
            if (!serviceId) return null
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/service/${serviceId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            if (!res.ok) throw new Error('Failed to fetch service')
            const result = await res.json()
            return result.data
        },
        enabled: !!serviceId && !!token,
    })

    // Populate form when data is loaded
    useEffect(() => {
        if (serviceData) {
            form.reset({
                serviceCategoryId: serviceData.service_category_id?.toString() || "none",
                name: serviceData.name || "",
                price: serviceData.price || 0,
                description: serviceData.description || "",
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
                    ...data,
                    serviceCategoryId: (data.serviceCategoryId && data.serviceCategoryId !== "none") ? parseInt(data.serviceCategoryId) : null,
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <Header>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

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
                        <form id="edit-service-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <Card className="border dark:border-gray-800 overflow-hidden py-0 gap-0">
                                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-1 dark:border-gray-800 py-4 gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-sm">
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
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10">
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

                                        {/* Service Name */}
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Service Name</FormLabel>
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
                                                        <FormLabel>Price (৳)</FormLabel>
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
                                                            <Select value={field.value} onValueChange={field.onChange}>
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
                                    {updateMutation.isPending ? "Updating..." : "Update Service"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    )
}
