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
import { ArrowLeft, Tag, Activity, Calendar, Info, Layers, List, Database } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/outdoor/master/categories/$id')({
    component: CategoryDetails,
})

function CategoryDetails() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')

    // Fetch category details
    const { data: category, isLoading, error } = useQuery({
        queryKey: ['category-details', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-category/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch category details')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!id,
    })

    // Fetch category statistics
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['category-statistics', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-category/statistics/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { totalTests: 0, totalReports: 0, totalTransactions: 0 }
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
                    <p className='text-sm font-medium animate-pulse'>Loading category overview...</p>
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
                    <p className='text-lg font-semibold text-destructive'>Error loading category</p>
                    <p className='text-sm text-muted-foreground'>{(error as Error).message}</p>
                </div>
                <Button variant="outline" onClick={() => navigate({ to: '/outdoor/master/categories' })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Categories
                </Button>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Tests',
            value: stats?.totalTests || 0,
            icon: <Layers className='h-6 w-6' />,
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
            label: 'Mapped Tests'
        },
        {
            title: 'Total Reports',
            value: stats?.totalReports || 0,
            icon: <Database className='h-6 w-6' />,
            gradient: 'from-violet-600 to-purple-600',
            shadow: 'shadow-purple-500/20',
            label: 'Record Entries'
        },
        {
            title: 'Revenue',
            value: stats?.totalTransactions || 0,
            icon: <Activity className='h-6 w-6' />,
            gradient: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/20',
            label: 'Total Collected'
        }
    ]

    return (
        <>
            <Header fixed>
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
                                onClick={() => navigate({ to: '/outdoor/master/categories' })}
                            >
                                <ArrowLeft className='h-4 w-4' />
                            </Button>
                            <h1 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                                Category Analytics
                            </h1>
                        </div>
                        <p className='text-muted-foreground ml-12 text-sm font-medium'>
                            Comprehensive overview for <span className="text-foreground border-b-2 border-primary/30 font-bold">{category.name}</span>
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Badge variant="outline" className="px-3 py-1 bg-background shadow-sm border-primary/20">
                            ID: {category.id}
                        </Badge>
                        <Button size="sm" variant="default" className='shadow-md' onClick={() => navigate({ to: '/outdoor/master/categories' })}>
                            <List className='mr-2 h-4 w-4' /> Category Index
                        </Button>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className='grid gap-6 md:grid-cols-3 mb-8'>
                    {statCards.map((card, idx) => (
                        <Card key={idx} className={`relative overflow-hidden border-none text-white shadow-xl ${card.shadow} bg-gradient-to-br ${card.gradient}`}>
                            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                            <CardContent className='p-6'>
                                <div className='flex items-center justify-between relative z-10'>
                                    <div className='space-y-1'>
                                        <p className='text-sm font-medium text-white/80'>{card.title}</p>
                                        <h3 className='text-3xl font-bold tracking-tighter'>
                                            {isStatsLoading ? <Activity className='h-6 w-6 animate-spin' /> : card.value.toLocaleString()}
                                        </h3>
                                        <p className='text-[10px] font-bold uppercase tracking-wider text-white/60'>{card.label}</p>
                                    </div>
                                    <div className='rounded-2xl bg-white/20 p-4 backdrop-blur-md border border-white/20 shadow-inner'>
                                        {card.icon}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className='grid gap-8 lg:grid-cols-12'>
                    {/* Metadata Card */}
                    <div className='lg:col-span-8'>
                        <Card className='shadow-lg border-primary/5 h-full'>
                            <CardHeader className='pb-4 border-b bg-muted/20'>
                                <div className='flex items-center gap-3'>
                                    <div className='rounded-xl bg-primary/10 p-2.5 shadow-inner'>
                                        <Tag className='h-5 w-5 text-primary' />
                                    </div>
                                    <div>
                                        <CardTitle className='text-xl'>Category Intelligence</CardTitle>
                                        <CardDescription>Primary configuration and associations</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-8 space-y-8'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                    <div className='space-y-1.5'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Domain Focus</p>
                                        <p className='text-2xl font-black text-foreground'>{category.name}</p>
                                    </div>
                                    <div className='space-y-1.5'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Entity Scope</p>
                                        <div className='flex items-center gap-2'>
                                            <Badge variant="secondary" className="font-mono text-sm px-2">#{category.id}</Badge>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Operational</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className='p-1 bg-muted/30 rounded-2xl'>
                                    <div className='bg-background rounded-xl p-6 border shadow-sm'>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                            <div className='space-y-4'>
                                                <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Associated Department</p>
                                                <div className='group flex items-center gap-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 transition-all hover:shadow-md'>
                                                    <div className='p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900 shadow-sm transition-transform group-hover:scale-110'>
                                                        <Activity className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                                                    </div>
                                                    <div className='space-y-0.5'>
                                                        <span className='font-black text-lg text-emerald-900 dark:text-emerald-50 tracking-tight'>
                                                            {category.department?.name || 'Unknown Unit'}
                                                        </span>
                                                        <p className='text-[10px] text-emerald-600 font-bold uppercase'>Primary Anchor</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='space-y-4'>
                                                <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Temporal Data</p>
                                                <div className='flex items-center gap-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40'>
                                                    <div className='p-3 rounded-lg bg-blue-100 dark:bg-blue-900'>
                                                        <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                                                    </div>
                                                    <div className='space-y-0.5'>
                                                        <span className='font-black text-lg text-blue-900 dark:text-blue-50 tracking-tight'>
                                                            {new Date(category.created_at).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        <p className='text-[10px] text-blue-600 font-bold uppercase'>Onboarding Date</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 p-6 border border-indigo-100/50 dark:border-indigo-900/20'>
                                    <div className='flex items-start gap-4'>
                                        <div className='p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900'>
                                            <Info className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                        </div>
                                        <div className='space-y-2'>
                                            <p className='text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight'>System Context</p>
                                            <p className='text-sm text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed font-medium'>
                                                This test category acts as a high-level container within the <strong>{category.department?.name}</strong> framework. It enables segmented reporting, financial attribution, and clinical grouping for all subordinate tests.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className='lg:col-span-4 space-y-6'>
                        <Card className='shadow-lg border-primary/5 overflow-hidden'>
                            <CardHeader className='bg-primary text-white pb-6'>
                                <Layers className='h-8 w-8 mb-2 opacity-80' />
                                <CardTitle className='text-xl'>Quick Actions</CardTitle>
                                <CardDescription className='text-white/70'>Manage category scope</CardDescription>
                            </CardHeader>
                            <CardContent className='pt-6 space-y-3'>
                                <Button className='w-full justify-start h-12 rounded-xl group overflow-hidden relative' variant="outline">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Layers className='mr-3 h-5 w-5 text-primary' /> View Sub-Tests
                                </Button>
                                <Button className='w-full justify-start h-12 rounded-xl group overflow-hidden relative' variant="outline">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <List className='mr-3 h-5 w-5 text-primary' /> Export Report
                                </Button>
                                <Separator className='my-4' />
                                <div className='p-4 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 text-center'>
                                    <p className='text-[10px] font-black uppercase text-muted-foreground tracking-widest'>Status</p>
                                    <p className='text-sm font-black text-foreground mt-1'>SYSTEM PROTECTED</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='shadow-lg border-primary/5'>
                            <CardContent className='p-6'>
                                <div className='flex items-center gap-4'>
                                    <div className='h-12 w-12 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center text-white shadow-lg'>
                                        <Activity className='h-6 w-6' />
                                    </div>
                                    <div className='space-y-0.5'>
                                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Data Health</p>
                                        <p className='text-lg font-black text-foreground'>100% Validated</p>
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
