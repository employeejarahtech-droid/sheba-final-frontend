import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, DollarSign, Activity, Calendar, Info, Stethoscope, Edit, BadgeCheck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
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
        queryKey: ['clinic-service-details', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clinic-services/${id}`, {
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
            <div className='flex h-screen w-full items-center justify-center bg-background'>
                <div className='flex flex-col items-center gap-2'>
                    <Activity className='h-8 w-8 animate-spin text-primary' />
                    <p className='text-sm font-medium animate-pulse'>Loading service details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className='flex h-screen w-full flex-col items-center justify-center gap-4 bg-background'>
                <div className='rounded-full bg-destructive/10 p-4'>
                    <Info className='h-8 w-8 text-destructive' />
                </div>
                <div className='text-center space-y-1'>
                    <p className='text-lg font-semibold text-destructive'>Error loading service</p>
                    <p className='text-sm text-muted-foreground'>{(error as Error).message}</p>
                </div>
                <Button variant="outline" onClick={() => navigate({ to: '/indoor/master/services' })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Services
                </Button>
            </div>
        )
    }

    return (
        <>
            <Header fixed shadow>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className='bg-muted/10'>
                <div className='mb-8 flex items-center justify-between'>
                    <div className='space-y-1'>
                        <div className='flex items-center gap-3'>
                            <Button
                                variant='outline'
                                size='icon'
                                className='h-9 w-9 rounded-full shadow-sm'
                                onClick={() => navigate({ to: '/indoor/master/services' })}
                            >
                                <ArrowLeft className='h-4 w-4' />
                            </Button>
                            <div>
                                <h1 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                                    Service Details
                                </h1>
                                <div className='flex items-center gap-2 mt-1'>
                                    <Badge className="bg-blue-500 text-white border-blue-500">👁️ VIEW MODE - READ ONLY</Badge>
                                </div>
                            </div>
                        </div>
                        <p className='text-muted-foreground ml-12 text-sm font-medium'>
                            Overview for <span className="text-foreground border-b-2 border-primary/30 font-bold">{service.name}</span>
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Badge variant="outline" className="px-3 py-1 bg-background shadow-sm border-primary/20">
                            ID: {service.id}
                        </Badge>
                        <Button
                            size="sm"
                            variant="default"
                            className='shadow-md'
                            onClick={() => navigate({ to: `/indoor/master/services/edit/${service.id}` })}
                        >
                            <Edit className='mr-2 h-4 w-4' /> Edit Service
                        </Button>
                    </div>
                </div>

                <div className='grid gap-8 lg:grid-cols-12'>
                    {/* Main Service Information Card */}
                    <div className='lg:col-span-8'>
                        <Card className='shadow-lg border-primary/5 h-full'>
                            <CardHeader className='pb-4 border-b bg-muted/20'>
                                <div className='flex items-center gap-3'>
                                    <div className='rounded-xl bg-primary/10 p-2.5 shadow-inner'>
                                        <Stethoscope className='h-5 w-5 text-primary' />
                                    </div>
                                    <div>
                                        <CardTitle className='text-xl'>Service Information</CardTitle>
                                        <CardDescription>Clinic service details and pricing</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-8 space-y-8'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                    <div className='space-y-1.5'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Service Name</p>
                                        <p className='text-2xl font-black text-foreground'>{service.name}</p>
                                    </div>
                                    <div className='space-y-1.5'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Service Status</p>
                                        <div className='flex items-center gap-2'>
                                            <Badge className={service.status === 'Active'
                                                ? 'bg-green-500 text-white border-green-500'
                                                : 'bg-gray-500 text-white border-gray-500'}>
                                                {service.status}
                                            </Badge>
                                            <Badge variant="secondary" className="font-mono text-sm px-2">#{service.id}</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className='p-1 bg-muted/30 rounded-2xl'>
                                    <div className='bg-background rounded-xl p-6 border shadow-sm'>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                            <div className='space-y-4'>
                                                <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Service Price</p>
                                                <div className='group flex items-center gap-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 transition-all hover:shadow-md'>
                                                    <div className='p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900 shadow-sm transition-transform group-hover:scale-110'>
                                                        <DollarSign className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                                                    </div>
                                                    <div className='space-y-0.5'>
                                                        <span className='font-black text-2xl text-emerald-900 dark:text-emerald-50 tracking-tight'>
                                                            ৳{service.price.toFixed(2)}
                                                        </span>
                                                        <p className='text-[10px] text-emerald-600 font-bold uppercase'>Base Charge</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='space-y-4'>
                                                <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Created Date</p>
                                                <div className='flex items-center gap-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40'>
                                                    <div className='p-3 rounded-lg bg-blue-100 dark:bg-blue-900'>
                                                        <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                                                    </div>
                                                    <div className='space-y-0.5'>
                                                        <span className='font-black text-lg text-blue-900 dark:text-blue-50 tracking-tight'>
                                                            {new Date(service.created_at).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <p className='text-[10px] text-blue-600 font-bold uppercase'>Registration Date</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {service.description && (
                                    <div className='rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 p-6 border border-indigo-100/50 dark:border-indigo-900/20'>
                                        <div className='flex items-start gap-4'>
                                            <div className='p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900'>
                                                <Info className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                            </div>
                                            <div className='space-y-2'>
                                                <p className='text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight'>Description</p>
                                                <p className='text-sm text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed font-medium'>
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Actions */}
                    <div className='lg:col-span-4 space-y-6'>
                        <Card className='shadow-lg border-primary/5 overflow-hidden'>
                            <CardHeader className='bg-primary text-white pb-6'>
                                <Stethoscope className='h-8 w-8 mb-2 opacity-80' />
                                <CardTitle className='text-xl'>Quick Actions</CardTitle>
                                <CardDescription className='text-white/70'>Manage service</CardDescription>
                            </CardHeader>
                            <CardContent className='pt-6 space-y-3'>
                                <Button
                                    className='w-full justify-start h-12 rounded-xl group overflow-hidden relative'
                                    variant="outline"
                                    onClick={() => navigate({ to: `/indoor/master/services/edit/${service.id}` })}
                                >
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Edit className='mr-3 h-5 w-5 text-primary' /> Edit Service
                                </Button>
                                <Button
                                    className='w-full justify-start h-12 rounded-xl group overflow-hidden relative'
                                    variant="outline"
                                    onClick={() => navigate({ to: '/indoor/master/services' })}
                                >
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Stethoscope className='mr-3 h-5 w-5 text-primary' /> View All Services
                                </Button>
                                <Separator className='my-4' />
                                <div className='p-4 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 text-center'>
                                    <p className='text-[10px] font-black uppercase text-muted-foreground tracking-widest'>Status</p>
                                    <div className='flex items-center justify-center gap-2 mt-2'>
                                        <BadgeCheck className='h-4 w-4 text-green-500' />
                                        <p className='text-sm font-black text-foreground'>ACTIVE</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='shadow-lg border-primary/5'>
                            <CardContent className='p-6'>
                                <div className='flex items-center gap-4'>
                                    <div className='h-12 w-12 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-400 flex items-center justify-center text-white shadow-lg'>
                                        <DollarSign className='h-6 w-6' />
                                    </div>
                                    <div className='space-y-0.5'>
                                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Pricing</p>
                                        <p className='text-lg font-black text-foreground'>৳{service.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Main>
        </>
    )
}
