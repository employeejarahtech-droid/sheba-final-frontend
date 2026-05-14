import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, FlaskConical, LayoutTemplate, Activity, DollarSign, Calendar, Tag, ShieldCheck, ClipboardList, Info, TrendingUp } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/outdoor/master/tests/$id')({
    component: TestDetails,
})

function TestDetails() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')

    const { data: test, isLoading: isTestLoading, error: testError } = useQuery({
        queryKey: ['test', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tests/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch test details')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!id,
    })

    // Fetch report columns
    const { data: reportInfo, isLoading: isReportLoading } = useQuery({
        queryKey: ['test-report-columns', test?.match_table_name],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/columns/${test.match_table_name}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return null
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!test?.match_table_name,
    })

    // Fetch record count (statistics)
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['test-record-count', test?.match_table_name],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/record-count/${test.match_table_name}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return null
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!test?.match_table_name,
    })

    // Filter out common system columns
    const reportParameters = reportInfo?.columns?.filter((col: string) =>
        !['id', 'invoice_id', 'created_at', 'updated_at'].includes(col.toLowerCase())
    ) || []

    if (isTestLoading) {
        return (
            <div className='flex h-screen w-full items-center justify-center'>
                <div className='text-lg font-medium animate-pulse'>Loading test details...</div>
            </div>
        )
    }

    if (testError) {
        return (
            <div className='flex h-screen w-full flex-col items-center justify-center gap-4'>
                <div className='text-lg font-medium text-destructive'>Error: {(testError as Error).message}</div>
                <Button onClick={() => navigate({ to: '/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Tests
                </Button>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <Main>
                <PageHeader
                    title="Test Details"
                    subtitle={`Viewing detailed information for ${test.name}`}
                    backButton={{
                        onClick: () => navigate({ to: '/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } }),
                    }}
                    actions={
                        <Link to='/outdoor/master/tests/edit/$id' params={{ id: String(test.id) }}>
                            <Button>
                                <Edit className='mr-2 h-4 w-4' /> Edit Test
                            </Button>
                        </Link>
                    }
                />

                {/* Top Stats - Quick Glance */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                    <Card className='relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-400 p-6 text-white shadow-lg shadow-blue-500/30'>
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-blue-100'>Total Reports</p>
                                <h3 className='text-3xl font-bold mt-1'>
                                    {isStatsLoading ? '...' : (statsData?.count || 0).toLocaleString()}
                                </h3>
                            </div>
                            <div className='rounded-xl bg-white/20 p-3 backdrop-blur-sm'>
                                <TrendingUp className='h-6 w-6' />
                            </div>
                        </div>
                    </Card>

                    <Card className='relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 text-white shadow-lg shadow-emerald-500/30'>
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-emerald-100'>Revenue Share</p>
                                <h3 className='text-3xl font-bold mt-1'>৳{Number(test.price).toLocaleString()}</h3>
                            </div>
                            <div className='rounded-xl bg-white/20 p-3 backdrop-blur-sm'>
                                <DollarSign className='h-6 w-6' />
                            </div>
                        </div>
                    </Card>

                    <Card className='relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-400 p-6 text-white shadow-lg shadow-purple-500/30'>
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-medium text-purple-100'>Status</p>
                                <h3 className='text-3xl font-bold mt-1 capitalize'>{test.status || 'Active'}</h3>
                            </div>
                            <div className='rounded-xl bg-white/20 p-3 backdrop-blur-sm'>
                                <ShieldCheck className='h-6 w-6' />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                    {/* Basic Information */}
                    <Card className='shadow-md border-primary/10'>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center gap-2'>
                                <div className='rounded-lg bg-primary/10 p-2'>
                                    <FlaskConical className='h-5 w-5 text-primary' />
                                </div>
                                <div>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>Primary details and identification</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                                        <Tag className='h-3 w-3' /> Test Name
                                    </p>
                                    <p className='text-base font-semibold'>{test.name}</p>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                                        <ClipboardList className='h-3 w-3' /> Test ID
                                    </p>
                                    <p className='text-base font-semibold'>#{test.id}</p>
                                </div>
                            </div>

                            <Separator className='bg-primary/5' />

                            <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                                        <DollarSign className='h-3 w-3' /> Price (BDT)
                                    </p>
                                    <p className='text-xl font-bold text-primary'>৳{Number(test.price).toLocaleString()}</p>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                                        <ShieldCheck className='h-3 w-3' /> Status
                                    </p>
                                    <div>
                                        <Badge variant={test.status === 'active' ? 'default' : 'secondary'} className='capitalize font-semibold'>
                                            {test.status || 'Active'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator className='bg-primary/5' />

                            <div className='space-y-1 text-xs text-muted-foreground flex items-center gap-2'>
                                <Calendar className='h-3 w-3' /> Created on: {new Date(test.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className='space-y-6'>
                        {/* Category & Department */}
                        <Card className='shadow-md border-primary/10'>
                            <CardHeader className='pb-3'>
                                <div className='flex items-center gap-2'>
                                    <div className='rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30'>
                                        <Activity className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                                    </div>
                                    <div>
                                        <CardTitle>Categorization</CardTitle>
                                        <CardDescription>Department and category mapping</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <div className='space-y-2'>
                                    <p className='text-sm font-medium text-muted-foreground'>Category</p>
                                    <div className='rounded-md border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/20 dark:bg-emerald-900/10'>
                                        <p className='font-semibold'>{test.category?.name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <p className='text-sm font-medium text-muted-foreground'>Department</p>
                                    <div className='rounded-md border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/20 dark:bg-blue-900/10'>
                                        <p className='font-semibold'>{test.category?.department?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Report Configuration */}
                        <Card className='shadow-md border-primary/10 overflow-hidden relative'>
                            <div className='absolute top-0 right-0 p-4 opacity-5'>
                                <LayoutTemplate className='h-24 w-24 rotate-12' />
                            </div>
                            <CardHeader className='pb-3'>
                                <div className='flex items-center gap-2'>
                                    <div className='rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30'>
                                        <LayoutTemplate className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                                    </div>
                                    <div>
                                        <CardTitle>Report Template</CardTitle>
                                        <CardDescription>Linked report structure and parameters</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-6'>
                                    <div className='space-y-2'>
                                        <p className='text-sm font-medium text-muted-foreground'>Linked Report Table</p>
                                        {test.match_table_name ? (
                                            <div className='inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'>
                                                {test.match_table_name}
                                            </div>
                                        ) : (
                                            <div className='text-sm italic text-muted-foreground flex items-center gap-2'>
                                                <Info className='h-3 w-3' /> No specific report table linked to this test.
                                            </div>
                                        )}
                                    </div>

                                    {test.match_table_name && (
                                        <div className='space-y-3 pt-2'>
                                            <p className='text-sm font-medium text-muted-foreground'>Report Parameters (Fields):</p>
                                            {isReportLoading ? (
                                                <div className='flex items-center gap-2 animate-pulse text-sm text-amber-600'>
                                                    <div className='h-2 w-2 rounded-full bg-amber-600' /> Loading parameters...
                                                </div>
                                            ) : reportParameters.length > 0 ? (
                                                <div className='flex flex-wrap gap-2'>
                                                    {reportParameters.map((param: string) => (
                                                        <Badge key={param} variant='outline' className='bg-background/50 uppercase text-[10px] tracking-wider'>
                                                            {param.replace(/_/g, ' ')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className='text-xs italic text-muted-foreground'>No parameters found for this report template.</p>
                                            )}
                                        </div>
                                    )}

                                    <Separator className='bg-primary/5' />

                                    <p className='text-xs text-muted-foreground leading-relaxed flex items-start gap-2'>
                                        <Info className='h-3 w-3 mt-0.5 shrink-0' />
                                        <span>
                                            This configuration determines which data collection form will be used in the lab module to entry results for this test.
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Main>
        </>
    )
}
