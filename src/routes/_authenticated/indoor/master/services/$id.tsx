import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
;
;
;
;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { ArrowLeft, Stethoscope, DollarSign, Activity, Calendar, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/indoor/master/services/$id')({
    component: ServiceDetails,
})

function ServiceDetails() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')

    // Fetch service details
    const { data: service, isLoading, error } = useQuery({
        queryKey: ['service', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/service/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch service details')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Activity className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500">Failed to load service details</p>
                <Button variant="outline" onClick={() => navigate({ to: '/indoor/master/services' })}>
                    Back to Services
                </Button>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <Main className="p-6 lg:p-8 w-full flex-1">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                Service Details
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                View service information and pricing
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                className="gap-2"
                                onClick={() => navigate({ to: `/indoor/master/services/edit/${service.id}` })}
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                className="gap-2"
                                onClick={() => navigate({ to: '/indoor/master/services' })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    </div>

                    <Card className="border dark:border-gray-800 overflow-hidden py-0 gap-0">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-1 dark:border-gray-800 py-4 gap-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-sm">
                                    <Stethoscope className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Service ID: {service.id}
                                    </CardDescription>
                                </div>
                                <Badge className={service.status === 'Active'
                                    ? 'bg-green-500 text-white border-green-500 ml-auto'
                                    : 'bg-gray-500 text-white border-gray-500 ml-auto'}>
                                    {service.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6">
                            <div className="py-5 space-y-5">
                                {/* Category */}
                                {service.service_category_id && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</p>
                                        <p className="text-sm font-medium">
                                            {service.category || 'N/A'}
                                        </p>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price</p>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="font-bold text-xl text-emerald-900 dark:text-emerald-50">
                                            ৳{parseFloat(service.price).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                {service.description && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Created Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {new Date(service.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    {service.updated_at && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Updated Date</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {new Date(service.updated_at).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    )
}
