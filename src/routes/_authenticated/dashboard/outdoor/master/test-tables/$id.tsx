import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Table2, Database, Info, Calendar, Columns, Layout } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/test-tables/$id')({
    component: TestTableDetails,
})

// One field definition inside test_tables.form_schema (form-designer tables).
type FormField = {
    key: string
    label?: string
    type?: string
    unit?: string
    normal_range?: string
    required?: boolean
    options?: string[]
    sort_order?: number
}

// One physical column from information_schema (/columns/:tableName → columnDetails).
type ColumnDetail = {
    name: string
    type: string
    nullable: boolean
    key?: string | null
    comment?: string | null
}

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

    // Form-designer tables have no physical table — their "columns" are the
    // form_schema field definitions, not information_schema rows.
    const isCustomForm = Boolean(testTable?.is_custom_form_designer)
    const formFields: FormField[] = isCustomForm && Array.isArray(testTable?.form_schema)
        ? [...(testTable.form_schema as FormField[])].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        )
        : []

    // Fetch database columns once we have the table name (physical tables only)
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
        enabled: !!token && !!testTable?.table_name && !isCustomForm,
    })

    // Per-column metadata (information_schema) — undefined against an older
    // API that only returns plain column names.
    const columnDetails: ColumnDetail[] = Array.isArray(columnsData?.columnDetails)
        ? columnsData.columnDetails
        : []

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
                <Button onClick={() => navigate({ to: '/dashboard/outdoor/master/test-tables' })}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Test Tables
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
                                onClick={() => navigate({ to: '/dashboard/outdoor/master/test-tables' })}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Test Table Details
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Viewing <span className="font-medium text-foreground">{testTable.display_name}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Test Table Information Card */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Table2 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Table Information</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Report template configuration and structure</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                {/* Display Name + Table Name row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Display Name</p>
                                        <p className="text-sm font-semibold">{testTable.display_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Table Name</p>
                                        <code className="text-xs px-2 py-0.5 bg-muted rounded font-mono font-semibold">
                                            {testTable.table_name}
                                        </code>
                                    </div>
                                </div>

                                <Separator />

                                {/* Description */}
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                                    <p className="text-sm leading-relaxed">
                                        {testTable.description || 'No description provided for this table.'}
                                    </p>
                                </div>

                                <Separator />

                                {/* Records + Created row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Database className="h-3 w-3" /> Total Records
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                            {isCountLoading ? '...' : (recordCountData?.count || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> Created
                                        </p>
                                        <p className="text-xs font-medium">
                                            {new Date(testTable.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Columns — physical table columns, or Form Builder fields for custom forms */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Columns className="h-3 w-3" />{' '}
                                        Columns ({isCustomForm ? formFields.length : (columnsData?.columns?.length || 0)})
                                    </p>
                                    {isCustomForm ? (
                                        formFields.length > 0 ? (
                                            <>
                                                <div className="overflow-x-auto rounded-lg border">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-muted/50 text-left text-muted-foreground">
                                                                <th className="px-2 py-1.5 font-medium w-8">#</th>
                                                                <th className="px-2 py-1.5 font-medium">Field</th>
                                                                <th className="px-2 py-1.5 font-medium">Type</th>
                                                                <th className="px-2 py-1.5 font-medium">Unit / Options</th>
                                                                <th className="px-2 py-1.5 font-medium">Normal Range</th>
                                                                <th className="px-2 py-1.5 font-medium text-center">Req</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {formFields.map((field, index) => (
                                                                <tr key={field.key || index} className="border-t">
                                                                    <td className="px-2 py-1.5 text-muted-foreground">{index + 1}</td>
                                                                    <td className="px-2 py-1.5">
                                                                        <div className="font-medium">{field.label || field.key}</div>
                                                                        {field.key && field.key !== field.label && (
                                                                            <code className="text-[10px] text-muted-foreground font-mono">{field.key}</code>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-1.5">
                                                                        <Badge variant="outline" className="text-[10px] capitalize">
                                                                            {field.type || 'text'}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-muted-foreground">
                                                                        {field.unit || (field.options?.length ? field.options.join(' / ') : '—')}
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-muted-foreground">{field.normal_range || '—'}</td>
                                                                    <td className="px-2 py-1.5 text-center">{field.required ? '✓' : '—'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                                                    <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
                                                        Fields come from the Form Builder schema (<code className="font-mono text-[10px]">form_schema</code>) — no
                                                        physical table exists. Results are stored in <code className="font-mono text-[10px]">custom_tests_results</code>{' '}
                                                        when a test bound to this template is reported.
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-6 text-center">
                                                <Layout className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-xs text-muted-foreground">
                                                    No fields defined yet — open Form Builder on the list page to add them.
                                                </p>
                                            </div>
                                        )
                                    ) : isColumnsLoading ? (
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                                            ))}
                                        </div>
                                    ) : columnsData?.columns?.length > 0 ? (
                                        <>
                                            {columnDetails.length > 0 ? (
                                                <div className="overflow-x-auto rounded-lg border">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-muted/50 text-left text-muted-foreground">
                                                                <th className="px-2 py-1.5 font-medium w-8">#</th>
                                                                <th className="px-2 py-1.5 font-medium">Field</th>
                                                                <th className="px-2 py-1.5 font-medium">Data Type</th>
                                                                <th className="px-2 py-1.5 font-medium text-center">Null</th>
                                                                <th className="px-2 py-1.5 font-medium">Key</th>
                                                                <th className="px-2 py-1.5 font-medium">Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {columnDetails.map((col, index) => (
                                                                <tr key={col.name || index} className="border-t">
                                                                    <td className="px-2 py-1.5 text-muted-foreground">{index + 1}</td>
                                                                    <td className="px-2 py-1.5">
                                                                        <code className="font-mono text-[11px] font-medium">{col.name}</code>
                                                                    </td>
                                                                    <td className="px-2 py-1.5">
                                                                        <Badge variant="outline" className="font-mono text-[10px]">
                                                                            {col.type}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-center text-muted-foreground">
                                                                        {col.nullable ? '✓' : '—'}
                                                                    </td>
                                                                    <td className="px-2 py-1.5">
                                                                        {col.key ? (
                                                                            <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                                                {col.key}
                                                                            </Badge>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-muted-foreground">{col.comment || '—'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {columnsData.columns.map((column: string) => (
                                                        <Badge key={column} variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                                                            {column}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                                                <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
                                                    Columns fetched dynamically from <code className="font-mono text-[10px]">{testTable.table_name}</code>
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-6 text-center">
                                            <Layout className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-xs text-muted-foreground">No columns found for this table.</p>
                                        </div>
                                    )}
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
