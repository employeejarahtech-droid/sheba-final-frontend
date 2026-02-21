import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { Header } from '@/components/layout/header';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, CircleCheck, Stethoscope } from 'lucide-react'
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/_authenticated/indoor/master/services/edit/$id')({
    component: EditService,
})

const serviceSchema = z.object({
    name: z.string().min(1, 'Service name is required'),
    price: z.coerce.number().min(0, 'Price must be zero or positive'),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
})

type ServiceValues = z.infer<typeof serviceSchema>

function EditService() {
    const navigate = useNavigate();
    const { id } = useParams({ from: '/_authenticated/indoor/master/services/edit/$id' });
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    const form = useForm<ServiceValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            name: "",
            price: 0,
            description: "",
            status: "Active",
        },
    })

    // Fetch service details
    const { data: serviceData, isLoading: isLoadingService } = useQuery({
        queryKey: ['clinic-service', id],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clinic-services/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch service');
            }

            return response.json();
        }
    })

    // Populate form when data is loaded
    useEffect(() => {
        if (serviceData?.data) {
            form.reset({
                name: serviceData.data.name,
                price: serviceData.data.price,
                description: serviceData.data.description || '',
                status: serviceData.data.status,
            });
        }
    }, [serviceData, form])

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: ServiceValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clinic-services/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update service');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Service updated successfully");
            queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
            navigate({ to: '/indoor/master/services' });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const onSubmit = (data: ServiceValues) => {
        updateMutation.mutate(data);
    };

    if (isLoadingService) {
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
                <Main className="p-6 lg:p-10 w-full flex-1">
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Loading service details...</div>
                    </div>
                </Main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-background dark:via-slate-950/50 dark:to-indigo-950/20">
            <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="p-6 lg:p-10 w-full flex-1">
                <div className="space-y-8 max-w-6xl mx-auto">
                    {/* Page Header with Glassmorphism */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-indigo-600/5"></div>
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
                        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"></div>

                        <div className="relative p-4 lg:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                            <Stethoscope className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-200 bg-clip-text text-transparent">
                                                Edit Clinic Service
                                            </h1>
                                            <p className="text-slate-600 dark:text-slate-400 mt-1 text-base font-semibold">
                                                Modify service pricing and configuration
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-1">
                                        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-orange-500/25">
                                            <span className="animate-pulse">✏️</span>
                                            EDIT MODE
                                        </span>
                                        <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 font-mono text-xs px-3 py-1">
                                            ID: #{id}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 lg:flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="hidden sm:flex items-center gap-2 rounded-2xl border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all font-semibold"
                                        onClick={() => navigate({ to: '/indoor/master/services' })}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to List
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="edit-service-form"
                                        disabled={updateMutation.isPending}
                                        size="lg"
                                        className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 border-none px-8 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></span>
                                        {updateMutation.isPending ? (
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                        ) : (
                                            <CircleCheck className="h-5 w-5 mr-2" />
                                        )}
                                        {updateMutation.isPending ? "Updating..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="edit-service-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Main Card */}
                            <Card className="relative overflow-hidden bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 gap-0 pb-0">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                                <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-3xl"></div>

                                <CardHeader className="relative border-b-1 border-slate-200/50 dark:border-slate-700/50 pb-4">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-inner">
                                            <Stethoscope className="h-7 w-7 text-slate-700 dark:text-slate-200" />
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
                                                Service Configuration
                                            </CardTitle>
                                            <CardDescription className="text-base text-slate-600 dark:text-slate-400 font-medium">
                                                Update pricing, description and operational status
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="relative p-4 lg:p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                        {/* Service Name Field */}
                                        <FormField<ServiceValues>
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                                        Service Name
                                                        <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. General Checkup, X-Ray Service"
                                                            className="h-12 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus-visible:ring-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none font-semibold text-base"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-slate-500 dark:text-slate-500 font-medium pl-4">
                                                        Official name displayed throughout the system
                                                    </FormDescription>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Price Field */}
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                        <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
                                                        Service Price
                                                        <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <span className="text-xl text-slate-500 dark:text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 font-black transition-colors">৳</span>
                                                            </div>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="h-12 pl-12 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none font-bold text-lg"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-slate-500 dark:text-slate-500 font-medium pl-4">
                                                        Base charge in Bangladeshi Taka (BDT)
                                                    </FormDescription>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Status Field with Enhanced Radio Cards */}
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                        <span className="w-1 h-5 bg-violet-600 rounded-full"></span>
                                                        Operational Status
                                                        <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <div className="flex gap-4">
                                                        <label
                                                            className={`
                                                                flex-1 cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 font-semibold
                                                                ${field.value === 'Active'
                                                                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                                                                    : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:border-emerald-400 hover:shadow-lg'
                                                                }
                                                            `}
                                                        >
                                                            <input
                                                                type="radio"
                                                                value="Active"
                                                                checked={field.value === 'Active'}
                                                                onChange={() => field.onChange('Active')}
                                                                className="sr-only"
                                                            />
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className={`
                                                                    p-3 rounded-xl transition-all duration-300
                                                                    ${field.value === 'Active'
                                                                        ? 'bg-emerald-500 text-white shadow-lg'
                                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                                    }
                                                                `}>
                                                                    <CircleCheck className="h-6 w-6" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="text-lg font-black">Active</div>
                                                                    <div className="text-xs font-medium opacity-70">Service is available</div>
                                                                </div>
                                                            </div>
                                                        </label>

                                                        <label
                                                            className={`
                                                                flex-1 cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 font-semibold
                                                                ${field.value === 'Inactive'
                                                                    ? 'border-slate-500 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 shadow-xl shadow-slate-500/20 scale-[1.02]'
                                                                    : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:border-slate-400 hover:shadow-lg'
                                                                }
                                                            `}
                                                        >
                                                            <input
                                                                type="radio"
                                                                value="Inactive"
                                                                checked={field.value === 'Inactive'}
                                                                onChange={() => field.onChange('Inactive')}
                                                                className="sr-only"
                                                            />
                                                            <div className="p-5 flex items-center gap-4">
                                                                <div className={`
                                                                    p-3 rounded-xl transition-all duration-300
                                                                    ${field.value === 'Inactive'
                                                                        ? 'bg-slate-500 text-white shadow-lg'
                                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                                    }
                                                                `}>
                                                                    <CircleCheck className="h-6 w-6 opacity-50" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="text-lg font-black">Inactive</div>
                                                                    <div className="text-xs font-medium opacity-70">Temporarily disabled</div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                    <FormDescription className="text-xs text-slate-500 dark:text-slate-500 font-medium pl-4">
                                                        Control service availability in the system
                                                    </FormDescription>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Description Field */}
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3 lg:col-span-2">
                                                    <FormLabel className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                                        Service Description
                                                        <span className="text-xs font-normal text-slate-500 dark:text-slate-500 font-medium">(Optional)</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Provide detailed information about this service, including procedures, requirements, or any relevant notes..."
                                                            className="min-h-32 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus-visible:ring-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none resize-none font-medium text-base leading-relaxed p-4"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-slate-500 dark:text-slate-500 font-medium pl-4">
                                                        Additional details help staff and patients understand the service better
                                                    </FormDescription>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator className="my-6 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-4">
                                        <Button
                                            type="button"
                                            size="lg"
                                            variant="outline"
                                            className="px-10 h-14 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 font-bold text-base shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all"
                                            onClick={() => navigate({ to: '/indoor/master/services' })}
                                        >
                                            Cancel Changes
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={updateMutation.isPending}
                                            className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl shadow-blue-500/30 border-none px-12 h-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-base"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></span>
                                            {updateMutation.isPending ? (
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                            ) : (
                                                <CircleCheck className="h-5 w-5 mr-2" />
                                            )}
                                            {updateMutation.isPending ? "Updating Service..." : "Update Service"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    )
}
