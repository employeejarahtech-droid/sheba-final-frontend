import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  FlaskConical,
  LayoutTemplate,
  Activity,
  DollarSign,
  Calendar,
  Tag,
  ShieldCheck,
  ClipboardList,
  Info,
  TrendingUp,
  Hash,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/tests/$id')({
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

    // Fetch record count
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
                <Button onClick={() => navigate({ to: '/dashboard/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Tests
                </Button>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <Main className="flex flex-1 flex-col gap-6">
                <div className="w-full min-w-[650px] max-w-[750px] mx-auto px-4">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate({ to: '/dashboard/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Test Details
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Viewing <span className="font-medium text-foreground">{test.name}</span>
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate({ to: '/dashboard/outdoor/master/tests/edit/$id', params: { id: String(test.id) } })}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                            <Edit className="mr-2 h-4 w-4" /> Edit Test
                        </Button>
                    </div>

                    {/* Test Information Card */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <FlaskConical className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Test Information</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Primary details and identification</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                {/* Name + ID row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Tag className="h-3 w-3" /> Test Name
                                        </p>
                                        <p className="text-sm font-semibold">{test.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Hash className="h-3 w-3" /> Test ID
                                        </p>
                                        <p className="text-sm font-semibold">#{test.id}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Category + Status row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Activity className="h-3 w-3" /> Category
                                        </p>
                                        <p className="text-sm font-semibold">{test.category?.name || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <ShieldCheck className="h-3 w-3" /> Status
                                        </p>
                                        <Badge variant={test.status === 'active' ? 'default' : 'secondary'} className='capitalize text-xs'>
                                            {test.status || 'Active'}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator />

                                {/* Price + Department row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <DollarSign className="h-3 w-3" /> Price
                                        </p>
                                        <p className="text-lg font-bold text-primary">৳{Number(test.price).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <ClipboardList className="h-3 w-3" /> Department
                                        </p>
                                        <p className="text-sm font-semibold">{test.category?.department?.name || 'N/A'}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Report Template */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <LayoutTemplate className="h-3 w-3" /> Report Template
                                    </p>
                                    {test.match_table_name ? (
                                        <>
                                            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                                                {test.match_table_name}
                                            </div>

                                            {reportParameters.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-muted-foreground mb-1.5">Parameters:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {reportParameters.map((param: string) => (
                                                            <Badge key={param} variant='outline' className='bg-background/50 uppercase text-[10px] tracking-wider'>
                                                                {param.replace(/_/g, ' ')}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs italic text-muted-foreground flex items-center gap-1.5">
                                            <Info className="h-3 w-3" /> No report template linked
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Stats row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <TrendingUp className="h-3 w-3" /> Total Reports
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {isStatsLoading ? '...' : (statsData?.count || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> Created
                                        </p>
                                        <p className="text-xs font-medium">
                                            {new Date(test.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bottom spacing */}
                    <div className="pb-10" />
                </div>
            </Main>
        </>
    )
}
