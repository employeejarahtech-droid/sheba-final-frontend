import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { ArrowLeft, Stethoscope, Save, Loader2, Activity, User, Home, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL

interface DiagnosisTreatmentPageProps {
    admissionId: string
}

export function DiagnosisTreatmentPage({ admissionId }: DiagnosisTreatmentPageProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')
    const [diagnosis, setDiagnosis] = useState('')

    // Fetch admission details
    const { data: admission, isLoading, isError } = useQuery({
        queryKey: ['admission-view', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission details')
            const json = await res.json()
            return json.data
        },
        enabled: !!token && !!admissionId,
    })

    // Pre-populate input when data loads
    useEffect(() => {
        if (admission?.diagnosis) {
            setDiagnosis(admission.diagnosis)
        }
    }, [admission])

    // Update mutation
    const updateDiagnosisMutation = useMutation({
        mutationFn: async (updatedDiagnosis: string) => {
            const response = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ diagnosis: updatedDiagnosis }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to update diagnosis/treatment')
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success('Diagnosis & Treatment updated successfully')
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            queryClient.invalidateQueries({ queryKey: ['admission-view', admissionId] })
            navigate({ to: '/dashboard/admission/patients' })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update diagnosis/treatment')
        },
    })

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        updateDiagnosisMutation.mutate(diagnosis)
    }

    if (isLoading) {
        return (
            <>
                <AppHeader fixed />
                <Main className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        <p className="text-sm text-muted-foreground">Loading details...</p>
                    </div>
                </Main>
            </>
        )
    }

    if (isError || !admission) {
        return (
            <>
                <AppHeader fixed />
                <Main className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <p className="text-red-500 font-semibold">Failed to load admission details.</p>
                        <Button variant="outline" onClick={() => navigate({ to: '/dashboard/admission/patients' })}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patients
                        </Button>
                    </div>
                </Main>
            </>
        )
    }

    return (
        <>
            <AppHeader fixed />
            <Main fluid className="p-4 w-full flex-1 dark:bg-black/20">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Breadcrumbs & Header */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate({ to: '/dashboard/admission/patients' })}
                            className="rounded-full hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/20"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                Diagnosis & Treatment
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Update diagnosis and clinical treatments for Patient Admission #{admissionId}
                            </p>
                        </div>
                    </div>

                    {/* Patient Information Banner */}
                    <Card className="shadow-sm border border-purple-100 dark:border-purple-950/40 bg-gradient-to-r from-purple-50/50 to-indigo-50/30 dark:from-purple-950/10 dark:to-indigo-950/5 overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b border-purple-100/50 dark:border-purple-950/30">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                                    Patient Profile
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-xs text-muted-foreground block">Name</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{admission.patient_name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Age / Sex</span>
                                <span className="font-medium">{admission.age_text || admission.age || '-'} / {admission.sex || '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Bed/Cabin</span>
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                    {admission.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Doctor In Charge</span>
                                <span className="font-medium">{admission.doctor?.doctor_name ? `Dr. ${admission.doctor.doctor_name}` : '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Card */}
                    <Card className="shadow-md border">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Clinical Diagnosis & Treatment Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Diagnosis & Treatment Details <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        Enter the primary medical diagnosis, prescribed medicine, checkup details, or surgery notes.
                                    </p>
                                    <textarea
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                        className="w-full min-h-[250px] p-4 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 text-sm font-medium leading-relaxed"
                                        placeholder="Type primary diagnosis details, clinical observations and treatments..."
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => navigate({ to: '/dashboard/admission/patients' })}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={updateDiagnosisMutation.isPending || !diagnosis.trim()}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center justify-center gap-2"
                                    >
                                        {updateDiagnosisMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Diagnosis
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    )
}
