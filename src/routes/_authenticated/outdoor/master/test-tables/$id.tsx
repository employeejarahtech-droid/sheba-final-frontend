import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'




import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Table2, Database, Info, Calendar, Layout, List, Columns } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/outdoor/master/test-tables/$id')({
    component: TestTableDetails,
})

function TestTableDetails() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')

    // Fetch test table details
    const { data: testTable, isLoading: isTableLoading, error: tableError } = useQuery({
        queryKey: ['test-table', id],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch test table details')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!id,
    })

    // Fetch database columns once we have the table name
    const { data: columnsData, isLoading: isColumnsLoading } = useQuery({
        queryKey: ['test-table-columns', testTable?.table_name],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/columns/${testTable.table_name}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch table columns')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!testTable?.table_name,
    })

    // Fetch record count
    const { data: recordCountData, isLoading: isCountLoading } = useQuery({
        queryKey: ['test-table-record-count', testTable?.table_name],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/test-tables/record-count/${testTable.table_name}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { count: 0 }
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!testTable?.table_name,
    })

    if (isTableLoading) {
        return (
            <div className='flex h-screen w-full items-center justify-center'>
                <div className='text-lg font-medium animate-pulse'>Loading test table details...</div>
            </div>
        )
    }

    if (tableError) {
        return (
            <div className='flex h-screen w-full flex-col items-center justify-center gap-4'>
                <div className='text-lg font-medium text-destructive'>Error: {(tableError as Error).message}</div>
                <Button onClick={() => navigate({ to: '/outdoor/master/test-tables' })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Test Tables
                </Button>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <Main>
                <div className='mb-8 flex items-center justify-between'>
                    <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => navigate({ to: '/outdoor/master/test-tables' })}
                            >
                                <ArrowLeft className='h-4 w-4' />
                            </Button>
                            <h1 className='text-3xl font-bold tracking-tight'>Test Table Details</h1>
                        </div>
                        <p className='text-muted-foreground ml-10'>
                            Viewing database configuration for {testTable.display_name}
                        </p>
                    </div>
                    {/* Note: Assuming Edit functionality exists but handled via Sheet in main page */}
                    <Button variant="outline" onClick={() => navigate({ to: '/outdoor/master/test-tables' })}>
                        <List className='mr-2 h-4 w-4' /> List of Tables
                    </Button>
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                    {/* Metadata Card */}
                    <Card className='shadow-md border-primary/10'>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center gap-2'>
                                <div className='rounded-lg bg-primary/10 p-2'>
                                    <Table2 className='h-5 w-5 text-primary' />
                                </div>
                                <div>
                                    <CardTitle>Table Metadata</CardTitle>
                                    <CardDescription>General information and identification</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground'>Display Name</p>
                                    <p className='text-lg font-semibold'>{testTable.display_name}</p>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground'>Internal Name</p>
                                    <code className='px-2 py-0.5 bg-muted rounded font-mono text-sm font-semibold'>
                                        {testTable.table_name}
                                    </code>
                                </div>
                            </div>

                            <Separator className='bg-primary/5' />

                            <div className='space-y-2'>
                                <p className='text-sm font-medium text-muted-foreground'>Description</p>
                                <p className='text-sm text-balance leading-relaxed'>
                                    {testTable.description || 'No description provided for this table.'}
                                </p>
                            </div>

                            <Separator className='bg-primary/5' />

                            <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                                        <Database className='h-3 w-3' /> Total Records
                                    </p>
                                    <p className='text-xl font-bold'>
                                        {isCountLoading ? '...' : (recordCountData?.count || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                                        <Calendar className='h-3 w-3' /> Created At
                                    </p>
                                    <p className='text-sm'>
                                        {new Date(testTable.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Database Structure Card */}
                    <Card className='shadow-md border-primary/10'>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center gap-2'>
                                <div className='rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30'>
                                    <Columns className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                                </div>
                                <div>
                                    <CardTitle>Database structure</CardTitle>
                                    <CardDescription>Available columns for this report table</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isColumnsLoading ? (
                                <div className='space-y-2 py-4'>
                                    <div className='h-4 w-full bg-muted animate-pulse rounded' />
                                    <div className='h-4 w-3/4 bg-muted animate-pulse rounded' />
                                    <div className='h-4 w-1/2 bg-muted animate-pulse rounded' />
                                </div>
                            ) : columnsData?.columns?.length > 0 ? (
                                <div className='space-y-4'>
                                    <div className='flex flex-wrap gap-2'>
                                        {columnsData.columns.map((column: string) => (
                                            <Badge key={column} variant="secondary" className="font-mono text-[10px] uppercase tracking-tighter">
                                                {column}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Separator className='bg-primary/5' />
                                    <div className='flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20'>
                                        <Info className='h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0' />
                                        <p className='text-xs text-blue-800 dark:text-blue-300 leading-tight'>
                                            These columns are dynamically fetched from the database table <code>{testTable.table_name}</code>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className='py-8 text-center'>
                                    <Layout className='h-12 w-12 text-muted-foreground/30 mx-auto mb-3' />
                                    <p className='text-sm text-muted-foreground'>No columns found for this table.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    )
}
