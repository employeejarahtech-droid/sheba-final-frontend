import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { ArrowLeft, CheckCircle, Calendar, User, FileText, Activity, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCan } from '@/hooks/use-can'
import { EditTreatmentOutcomeForm } from '@/features/treatment-outcomes/components/EditTreatmentOutcomeForm'

export const Route = createFileRoute('/_authenticated/dashboard/indoor/master/treatment-outcomes/$id')({
    component: TreatmentOutcomeDetails,
})

function TreatmentOutcomeDetails() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()
    const [openEditForm, setOpenEditForm] = useState(false)

    const can = useCan()
    const canEdit = can('indoor.master.treatment-outcomes.edit')
    const canDelete = can('indoor.master.treatment-outcomes.delete')

    const { data: outcome, isLoading, error } = useQuery({
        queryKey: ['treatment-outcome', Number(id)],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/treatment-outcome/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch treatment outcome details')
            const result = await res.json()
            return result.data
        },
        enabled: !!token && !!id,
    })

    const { data: stats } = useQuery({
        queryKey: ['treatment-outcome-stats', Number(id)],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/treatment-outcome/statistics/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { totalTreatments: 0 }
            const result = await res.json()
            return result.data || { totalTreatments: 0 }
        },
        enabled: !!token && !!id,
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/treatment-outcome/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(json.message || 'Failed to delete')
            return json
        },
        onSuccess: () => {
            toast.success('Deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['treatment-outcomes'] })
            queryClient.invalidateQueries({ queryKey: ['treatment-outcomes-overall-stats'] })
            navigate({ to: '/dashboard/indoor/master/treatment-outcomes' })
        },
        onError: (err: Error) => { toast.error(err.message) },
    })

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <AppHeader fixed />
                <Main className="p-6 lg:p-8 w-full flex-1">
                    <div className="flex items-center justify-center h-64">
                        <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </Main>
            </div>
        )
    }

    if (error || !outcome) {
        return (
            <div className="flex flex-col min-h-screen">
                <AppHeader fixed />
                <Main className="p-6 lg:p-8 w-full flex-1">
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <p className="text-red-500">Failed to load treatment outcome details</p>
                        <Button variant="outline" onClick={() => navigate({ to: '/dashboard/indoor/master/treatment-outcomes' })}>
                            Back to Treatment Outcomes
                        </Button>
                    </div>
                </Main>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <Main className="p-6 lg:p-8 w-full flex-1">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {/* Page Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                Treatment Outcome Details
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                View treatment outcome information
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {canEdit && (
                                <Button variant="ghost" className="gap-2" onClick={() => setOpenEditForm(true)}>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    className="gap-2 text-red-600 hover:text-red-700"
                                    onClick={() => {
                                        if (confirm('Delete this item? This action cannot be undone.')) {
                                            deleteMutation.mutate()
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                className="gap-2"
                                onClick={() => navigate({ to: '/dashboard/indoor/master/treatment-outcomes' })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    </div>

                    <Card className="border dark:border-gray-800 overflow-hidden py-0 gap-0">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b-1 dark:border-gray-800 py-4 gap-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-sm">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{outcome.name}</CardTitle>
                                    <CardDescription className="text-xs mt-0.5 font-mono">
                                        {String(outcome.id).toString().startsWith('TO-') ? outcome.id : `TO-${outcome.id}`}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6">
                            <div className="py-5 space-y-5">
                                {/* Description */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</p>
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {outcome.description || 'No description provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Treatments */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Treatments Using This Outcome</p>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                                            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="font-bold text-xl text-emerald-900 dark:text-emerald-50">
                                            {stats?.totalTreatments ?? 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Dates & Creator */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Created Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {outcome.created_at
                                                    ? new Date(outcome.created_at).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Created By</p>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {outcome.created_by_name || outcome.created_by || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Main>

            <EditTreatmentOutcomeForm
                open={openEditForm}
                setOpen={setOpenEditForm}
                treatmentOutcomeId={Number(id)}
            />
        </>
    )
}
