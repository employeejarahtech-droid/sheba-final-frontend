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
import { ArrowLeft, Building2, Activity, Info, Layers, List, Database, Tag } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/outdoor/master/departments/$id')({
    component: DepartmentDetails,
})

function DepartmentDetails() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')

    // Fetch department details
    const { data: department, isLoading, error } = useQuery({
        queryKey: ['department-details', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/department/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch department details')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!id,
    })

    // Fetch department statistics
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['department-statistics', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/department/statistics/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { totalCategories: 0, totalTests: 0, totalReports: 0, totalTransactions: 0 }
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
                    <p className='text-sm font-medium animate-pulse'>Loading department overview...</p>
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
                    <p className='text-lg font-semibold text-destructive'>Error loading department</p>
                    <p className='text-sm text-muted-foreground'>{(error as Error).message}</p>
                </div>
                <Button variant="outline" onClick={() => navigate({ to: '/outdoor/master/departments' })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Departments
                </Button>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Categories',
            value: stats?.totalCategories || 0,
            icon: <Tag className='h-6 w-6' />,
            gradient: 'from-blue-600 to-cyan-600',
            shadow: 'shadow-blue-500/20',
            label: 'Sub-Groups'
        },
        {
            title: 'Total Tests',
            value: stats?.totalTests || 0,
            icon: <Layers className='h-6 w-6' />,
            gradient: 'from-amber-500 to-orange-600',
            shadow: 'shadow-orange-500/20',
            label: 'Mapped Services'
        },
        {
            title: 'Total Reports',
            value: stats?.totalReports || 0,
            icon: <Database className='h-6 w-6' />,
            gradient: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/20',
            label: 'Record Entries'
        }
    ]

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
                                onClick={() => navigate({ to: '/outdoor/master/departments' })}
                            >
                                <ArrowLeft className='h-4 w-4' />
                            </Button>
                            <h1 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                                Department Outlook
                            </h1>
                        </div>
                        <p className='text-muted-foreground ml-12 text-sm font-medium'>
                            Strategic view for <span className="text-foreground border-b-2 border-primary/30 font-bold">{department.name}</span>
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Badge variant="outline" className="px-3 py-1 bg-background shadow-sm border-primary/20">
                            DEPT ID: {department.id}
                        </Badge>
                        <Button size="sm" variant="default" className='shadow-md' onClick={() => navigate({ to: '/outdoor/master/departments' })}>
                            <List className='mr-2 h-4 w-4' /> Department List
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
                                        <Building2 className='h-5 w-5 text-primary' />
                                    </div>
                                    <div>
                                        <CardTitle className='text-xl'>Department Intelligence</CardTitle>
                                        <CardDescription>Core organizational data and unit scope</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-8 space-y-8'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                    <div className='space-y-1.5'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Operational Unit</p>
                                        <p className='text-2xl font-black text-foreground'>{department.name}</p>
                                    </div>
                                    <div className='space-y-1.5'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Status & Health</p>
                                        <div className='flex items-center gap-2'>
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">ACTIVE RESOURCE</Badge>
                                            <Badge variant="secondary" className="font-mono text-sm px-2">v1.2</Badge>
                                        </div>
                                    </div>
                                </div>

                                <Separator className='bg-primary/5' />

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                    <div className='space-y-4'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Clinical impact</p>
                                        <div className='p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20'>
                                            <p className='text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic'>
                                                "Providing essential diagnostic support and healthcare coordination through {stats?.totalTests || 0} active test mappings."
                                            </p>
                                        </div>
                                    </div>
                                    <div className='space-y-4 text-center md:text-left'>
                                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>System Metadata</p>
                                        <div className='flex flex-wrap gap-2 justify-center md:justify-start'>
                                            <Badge variant="outline" className="rounded-md">ID-STAMP: {department.id}</Badge>
                                            <Badge variant="outline" className="rounded-md">AUTH: SYSTEM-ADMIN</Badge>
                                            <Badge variant="outline" className="rounded-md">MODE: OUTDOOR</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className='rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 p-6 border border-indigo-100/50 dark:border-indigo-900/20'>
                                    <div className='flex items-start gap-4'>
                                        <div className='p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900'>
                                            <Info className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                        </div>
                                        <div className='space-y-2'>
                                            <p className='text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight'>Functional Context</p>
                                            <p className='text-sm text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed font-medium'>
                                                This department oversees <strong>{stats?.totalCategories || 0}</strong> category groups. It serves as the top-level organizational anchor for medical service attribution and departmental resource management.
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
                                <Activity className='h-8 w-8 mb-2 opacity-80' />
                                <CardTitle className='text-xl'>Governance</CardTitle>
                                <CardDescription className='text-white/70'>Policy and management control</CardDescription>
                            </CardHeader>
                            <CardContent className='pt-6 space-y-3'>
                                <Button className='w-full justify-start h-12 rounded-xl group overflow-hidden relative shadow-sm' variant="outline">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Tag className='mr-3 h-5 w-5 text-primary' /> View Categories
                                </Button>
                                <Button className='w-full justify-start h-12 rounded-xl group overflow-hidden relative shadow-sm' variant="outline">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Layers className='mr-3 h-5 w-5 text-primary' /> Unit Inventory
                                </Button>
                                <Separator className='my-4' />
                                <div className='p-5 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 text-center relative overflow-hidden group'>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className='text-[10px] font-black uppercase text-muted-foreground tracking-widest'>Data Integrity</p>
                                    <p className='text-sm font-black text-foreground mt-1'>CERTIFIED SYSTEM UNIT</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='shadow-lg border-primary/5 transition-transform hover:scale-[1.02]'>
                            <CardContent className='p-6'>
                                <div className='flex items-center gap-4'>
                                    <div className='h-12 w-12 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center text-white shadow-lg'>
                                        <Activity className='h-6 w-6' />
                                    </div>
                                    <div className='space-y-0.5'>
                                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Resource Util</p>
                                        <p className='text-lg font-black text-foreground'>Optimal Performance</p>
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
