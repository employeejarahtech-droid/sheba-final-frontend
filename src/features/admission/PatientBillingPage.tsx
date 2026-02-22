import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { Plus, Trash2, ArrowLeft, Loader2, Save, FileText, Receipt, BedDouble, Eye, Repeat } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { AddOperationTypeForm } from './AddOperationTypeForm'
import { AddConsultantForm } from './AddConsultantForm'
import { AddClinicalServicesForm } from './AddClinicalServicesForm'

const API_URL = import.meta.env.VITE_API_URL

type OutdoorBill = {
    id: number
    patient_name: string
    invoice_date: string
    net_amount: number
    total_amount: number
}

type OperationType = {
    id?: number
    operation_type: string
    operation_date: string
    charges: number
}

type Consultant = {
    id?: number
    consultant_id: number
    visit_date: string
    fees: number
    consultant_name?: string
}

type Service = {
    id?: number
    service_id: number
    service_provider: string
    service_against: string
    amount: number
    service_name?: string
}

const billingSchema = z.object({
    admission_id: z.number(),
    patient_name: z.string(),
    billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    operations: z.array(z.object({
        operation_type: z.string().min(1),
        operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        charges: z.number().nonnegative(),
    })).optional(),
    consultants: z.array(z.object({
        consultant_id: z.number().positive(),
        visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        fees: z.number().nonnegative(),
    })).optional(),
    services: z.array(z.object({
        service_id: z.number().positive(),
        service_provider: z.string().min(1),
        service_against: z.string().min(1),
        amount: z.number().nonnegative(),
    })).optional(),
})

export function PatientBillingPage() {
    const { admissionId } = useParams({ from: '/_authenticated/admission/patients/$admissionId/billing/' })
    const navigate = useNavigate()
    const token = getCookie('accessToken')

    const [openOperationForm, setOpenOperationForm] = useState(false)
    const [openConsultantForm, setOpenConsultantForm] = useState(false)
    const [openServiceForm, setOpenServiceForm] = useState(false)
    const [selectedBedHistory, setSelectedBedHistory] = useState<any>(null)
    const [openChangeBedDialog, setOpenChangeBedDialog] = useState(false)
    const [openBedBillingDialog, setOpenBedBillingDialog] = useState(false)

    // Fetch admission details
    const { data: admissionData, isLoading: admissionLoading, error: admissionError } = useQuery({
        queryKey: ['admission', admissionId],
        queryFn: async () => {
            console.log('Fetching admission:', admissionId)
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log('Response status:', res.status)
            const data = await res.json()
            console.log('Admission data:', data)
            if (!res.ok) throw new Error(data?.message || 'Failed to fetch admission')
            return data
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch doctors for consultant dropdown
    const { data: doctorsData } = useQuery({
        queryKey: ['doctors-list'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/doctor?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch doctors')
            return res.json()
        },
        enabled: !!token,
    })
    const doctors = doctorsData?.data?.rows || doctorsData?.data?.items || []

    // Fetch clinical services
    const { data: servicesData } = useQuery({
        queryKey: ['clinic-services'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/clinic-services?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch services')
            return res.json()
        },
        enabled: !!token,
    })
    const services = servicesData?.data || []

    // Fetch outdoor bills for this admission
    const { data: outdoorBillsData } = useQuery({
        queryKey: ['outdoor-bills', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/outdoor-invoice?admission_id=${admissionId}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch outdoor bills')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })
    const outdoorBills = outdoorBillsData?.data?.rows || outdoorBillsData?.data?.items || outdoorBillsData?.data || []

    // Fetch bed charges history for this admission
    const { data: bedChargesData } = useQuery({
        queryKey: ['bed-charges', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/bed-charges`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch bed charges')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch available beds/cabins
    const { data: bedsCabinsData } = useQuery({
        queryKey: ['beds-cabins'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/bed-cabin?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch beds/cabins')
            return res.json()
        },
        enabled: !!token,
    })
    const bedsCabins = bedsCabinsData?.data?.rows || bedsCabinsData?.data?.items || []

    const form = useForm({
        resolver: zodResolver(billingSchema),
        defaultValues: {
            admission_id: Number(admissionId),
            patient_name: '',
            billing_date: new Date().toISOString().split('T')[0],
            operations: [],
            consultants: [],
            services: [],
        },
    })

    // Update form when admission data loads
    useEffect(() => {
        if (admissionData?.data) {
            form.reset({
                admission_id: Number(admissionId),
                patient_name: admissionData.data.patient_name || '',
                billing_date: new Date().toISOString().split('T')[0],
                operations: [],
                consultants: [],
                services: [],
            })
        }
    }, [admissionData, admissionId, form])

    // Local state for items
    const [operations, setOperations] = useState<OperationType[]>([])
    const [consultants, setConsultants] = useState<Consultant[]>([])
    const [servicesList, setServicesList] = useState<Service[]>([])

    // Add operation
    const handleAddOperation = (operation: OperationType) => {
        setOperations([...operations, { ...operation, id: Date.now() }])
    }

    const handleRemoveOperation = (id: number) => {
        setOperations(operations.filter(op => op.id !== id))
    }

    // Add consultant
    const handleAddConsultant = (consultant: Consultant) => {
        const doctor = doctors.find((d: any) => d.id === consultant.consultant_id)
        setConsultants([
            ...consultants,
            { ...consultant, id: Date.now(), consultant_name: doctor?.doctor_name || 'Unknown' },
        ])
    }

    const handleRemoveConsultant = (id: number) => {
        setConsultants(consultants.filter(c => c.id !== id))
    }

    // Add service
    const handleAddService = (service: Service) => {
        const serviceData = services.find((s: any) => s.id === service.service_id)
        setServicesList([
            ...servicesList,
            { ...service, id: Date.now(), service_name: serviceData?.name || 'Unknown' },
        ])
    }

    const handleRemoveService = (id: number) => {
        setServicesList(servicesList.filter(s => s.id !== id))
    }

    // Bed charges from admission_bed_history table (via API)
    const bedChargesInfo = bedChargesData?.data || {
        total: 0,
        breakdown: []
    }

    const calculateBedCharges = () => {
        // Only return data from admission_bed_history table
        // No fallback to admissions table - if no history, show 0
        return {
            total: bedChargesInfo.total || 0,
            breakdown: bedChargesInfo.breakdown || [],
            days: bedChargesInfo.breakdown?.reduce((sum: number, b: any) => sum + b.days, 0) || 0
        }
    }

    const bedCharges = calculateBedCharges()

    // Calculate totals
    const totalOperations = operations.reduce((sum, op) => sum + Number(op.charges), 0)
    const totalConsultants = consultants.reduce((sum, c) => sum + Number(c.fees), 0)
    const totalServices = servicesList.reduce((sum, s) => sum + Number(s.amount), 0)
    const totalBedCharges = bedCharges.total
    const grandTotal = totalOperations + totalConsultants + totalServices + totalBedCharges

    // Create billing mutation
    const createBillingMutation = useMutation({
        mutationFn: async (values: z.infer<typeof billingSchema>) => {
            const res = await fetch(`${API_URL}/api/billing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...values,
                    operations,
                    consultants,
                    services: servicesList,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to create billing')
            }

            return res.json()
        },
        onSuccess: (data) => {
            toast.success('Billing created successfully')
            // Navigate to view the created bill
            navigate({ to: `/admission/billing/${data.data.id}` })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create billing')
        },
    })

    const onSubmit = (values: z.infer<typeof billingSchema>) => {
        if (operations.length === 0 && consultants.length === 0 && servicesList.length === 0) {
            toast.error('Please add at least one item (operation, consultant, or service)')
            return
        }
        createBillingMutation.mutate(values)
    }

    // Delete bed history mutation
    const deleteBedHistoryMutation = useMutation({
        mutationFn: async (bedHistoryId: string) => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/bed-history/${bedHistoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to delete bed history')
            }

            return res.json()
        },
        onSuccess: () => {
            toast.success('Bed history deleted successfully')
            // Refetch admission data
            window.location.reload()
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete bed history')
        },
    })

    // Change bed mutation - adds new history entry
    const changeBedMutation = useMutation({
        mutationFn: async (data: { bed_cabin_id: number; notes?: string; change_date: string; change_time: string }) => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/change-bed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error?.message || 'Failed to change bed')
            }

            return res.json()
        },
        onSuccess: () => {
            toast.success('Bed changed successfully')
            setOpenChangeBedDialog(false)
            window.location.reload()
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to change bed')
        },
    })

    // Create bed billing mutation - creates billing record for bed charges only
    const createBedBillingMutation = useMutation({
        mutationFn: async (formData: {
            from_date: string
            from_time: string
            to_date: string
            to_time: string
            total_days: number
            daily_rate: number
            total_amount: number
            remarks: string
        }) => {
            console.log('Mutation function called with formData:', formData)

            // Add bed charges as a service item
            const bedService = {
                service_id: 0, // 0 indicates custom/bed charges
                service_provider: 'Hospital',
                service_against: `Bed Charges (${formData.from_date} to ${formData.to_date}, ${formData.total_days} days)`,
                amount: formData.total_amount,
                remarks: formData.remarks,
            }

            const requestBody = {
                admission_id: Number(admissionId),
                patient_name: admissionData?.data?.patient_name || '',
                billing_date: new Date().toISOString().split('T')[0],
                operations: [],
                consultants: [],
                services: [bedService],
            }

            console.log('Sending request to:', `${API_URL}/api/billing/bed-cabin`)
            console.log('Request body:', requestBody)

            const res = await fetch(`${API_URL}/api/billing/bed-cabin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            })

            console.log('Response status:', res.status)

            if (!res.ok) {
                const error = await res.json()
                console.error('Error response:', error)
                throw new Error(error?.message || 'Failed to create bed billing')
            }

            const responseData = await res.json()
            console.log('Success response:', responseData)
            return responseData
        },
        onSuccess: (data) => {
            console.log('Mutation onSuccess called with data:', data)
            toast.success('Bed billing created successfully')
            setOpenBedBillingDialog(false)
            // Navigate to view bill
            if (data?.data?.id) {
                navigate({ to: `/admission/billing/${data.data.id}` })
            }
        },
        onError: (error: Error) => {
            console.error('Mutation onError called:', error)
            toast.error(error.message || 'Failed to create bed billing')
        },
    })

    if (admissionLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-4">Loading admission details...</span>
            </div>
        )
    }

    if (admissionError) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-500 font-semibold mb-2">Error loading admission</p>
                    <p className="text-sm text-gray-600">{admissionError.message}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate({ to: '/admission/patients' })}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Create Patient Billing</h1>
                            <p className="text-muted-foreground">Add services and charges for this admission</p>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Hidden fields */}
                        <FormField
                            control={form.control}
                            name="admission_id"
                            render={({ field }) => (
                                <FormItem className="hidden">
                                    <FormControl>
                                        <Input {...field} type="hidden" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="patient_name"
                            render={({ field }) => (
                                <FormItem className="hidden">
                                    <FormControl>
                                        <Input {...field} type="hidden" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Patient Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Patient Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Patient Name</span>
                                        <p className="font-semibold">{admissionData?.data?.patient_name || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Age/Sex</span>
                                        <p className="font-semibold">
                                            {admissionData?.data?.age || '-'}/{admissionData?.data?.sex?.toUpperCase() || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Phone</span>
                                        <p className="font-semibold">{admissionData?.data?.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Admission Date</span>
                                        <p className="font-semibold">
                                            {admissionData?.data?.admission_date ? new Date(admissionData.data.admission_date).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Bed/Cabin</span>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">
                                                {admissionData?.data?.bedCabin ? `${admissionData.data.bedCabin.code} (${admissionData.data.bedCabin.type})` : '-'}
                                            </p>
                                            {bedCharges.breakdown && bedCharges.breakdown.length > 1 && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                                                    {bedCharges.breakdown.length} changes
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {admissionData?.data?.bedCabin?.ward} • ৳{admissionData?.data?.bedCabin?.price || '0'}/day
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Doctor</span>
                                        <p className="font-semibold">
                                            {admissionData?.data?.doctor?.doctor_name || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Diagnosis</span>
                                        <p className="font-semibold">{admissionData?.data?.diagnosis || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operation Types Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Operation Types</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setOpenOperationForm(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Operation
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {operations.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No operation types added yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">Operation Type</th>
                                                    <th className="text-left p-3">Date</th>
                                                    <th className="text-right p-3">Charges</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {operations.map((op) => (
                                                    <tr key={op.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{op.operation_type}</td>
                                                        <td className="p-3">{op.operation_date}</td>
                                                        <td className="p-3 text-right">৳{op.charges.toFixed(2)}</td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveOperation(op.id!)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <AddOperationTypeForm
                                    open={openOperationForm}
                                    setOpen={setOpenOperationForm}
                                    onAdd={handleAddOperation}
                                />
                            </CardContent>
                        </Card>

                        {/* Bed/Cabin Charges Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <BedDouble className="h-5 w-5" />
                                        Bed/Cabin Charges
                                    </CardTitle>
                                    <div className="flex items-center gap-3">
                                        {bedCharges.breakdown && bedCharges.breakdown.length > 1 && (
                                            <span className="text-sm text-muted-foreground">
                                                {bedCharges.breakdown.length} change{bedCharges.breakdown.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setOpenChangeBedDialog(true)}
                                        >
                                            <Repeat className="h-4 w-4 mr-2" />
                                            Change Bed/Cabin
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            onClick={() => setOpenBedBillingDialog(true)}
                                            disabled={!bedCharges.breakdown || bedCharges.breakdown.length === 0}
                                        >
                                            <Receipt className="h-4 w-4 mr-2" />
                                            Make Bill for Bed Cabin
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {bedCharges.breakdown && bedCharges.breakdown.length > 0 ? (
                                    <>
                                        {/* Timeline */}
                                        <div className="relative">
                                            {/* Vertical Line */}
                                            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>

                                            {/* Bed History Items */}
                                            <div className="space-y-4">
                                                {bedCharges.breakdown.map((bed: any, index: number) => {
                                                    const isLast = index === bedCharges.breakdown.length - 1
                                                    const isActive = bed.status === 'active'
                                                    const fromDate = new Date(bed.from)
                                                    const toDate = bed.to ? new Date(bed.to) : new Date()

                                                    return (
                                                        <div key={bed.id || index} className="relative flex gap-4">
                                                            {/* Timeline Dot */}
                                                            <div className={`
                                                                relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                                                        ${isActive
                                                                            ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900'
                                                                            : isLast
                                                                                ? 'bg-green-500 text-white ring-4 ring-green-200 dark:ring-green-900'
                                                                                : 'bg-gray-400 text-white'
                                                                        }
                                                                    `}>
                                                                        <BedDouble className="h-5 w-5" />
                                                                    </div>

                                                                    {/* Content Card */}
                                                                    <div className={`
                                                                        flex-1 border-2 rounded-lg p-4
                                                                        ${isActive
                                                                            ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
                                                                            : isLast
                                                                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
                                                                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
                                                                        }
                                                                    `}>
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-bold text-lg">{bed.bed_code}</span>
                                                                                    <span className={`
                                                                                        text-xs px-2 py-1 rounded-full font-medium
                                                                                        ${bed.bed_type === 'Cabin'
                                                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                                        }
                                                                                    `}>
                                                                                        {bed.bed_type}
                                                                                    </span>
                                                                                    {isActive && (
                                                                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                                                                                            Current
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <FileText className="h-3 w-3" />
                                                                                        {fromDate.toLocaleDateString()}
                                                                                        {isActive && toDate > fromDate && (
                                                                                            <>
                                                                                                {' - '}Present
                                                                                            </>
                                                                                        )}
                                                                                        {!isActive && toDate && (
                                                                                            <>
                                                                                                {' - '}{toDate.toLocaleDateString()}
                                                                                            </>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 ml-4">
                                                                                {/* Details Button */}
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                                                    onClick={() => setSelectedBedHistory(bed)}
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                                {/* Delete Button - Only for non-active entries */}
                                                                                {!isActive && (
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                                        onClick={() => {
                                                                                            if (window.confirm('Are you sure you want to delete this bed history entry?')) {
                                                                                                deleteBedHistoryMutation.mutate(String(bed.id))
                                                                                            }
                                                                                        }}
                                                                                        disabled={deleteBedHistoryMutation.isPending}
                                                                                    >
                                                                                        {deleteBedHistoryMutation.isPending ? (
                                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                                        ) : (
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        )}
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">
                                            No bed/cabin assigned to this admission
                                        </p>
                                    )}
                                </CardContent>
                        </Card>

                        {/* Consultants Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Consultants</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setOpenConsultantForm(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Consultant
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {consultants.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No consultants added yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">SL</th>
                                                    <th className="text-left p-3">Consultant Name</th>
                                                    <th className="text-left p-3">Date</th>
                                                    <th className="text-right p-3">Fees</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consultants.map((cons, index) => (
                                                    <tr key={cons.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{index + 1}</td>
                                                        <td className="p-3">{cons.consultant_name}</td>
                                                        <td className="p-3">{cons.visit_date}</td>
                                                        <td className="p-3 text-right">৳{cons.fees.toFixed(2)}</td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveConsultant(cons.id!)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <AddConsultantForm
                                    open={openConsultantForm}
                                    setOpen={setOpenConsultantForm}
                                    onAdd={handleAddConsultant}
                                    doctors={doctors}
                                />
                            </CardContent>
                        </Card>

                        {/* Services Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Clinical Services</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setOpenServiceForm(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Service
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {servicesList.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No services added yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">Service</th>
                                                    <th className="text-left p-3">Provider</th>
                                                    <th className="text-left p-3">Against</th>
                                                    <th className="text-right p-3">Amount</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {servicesList.map((srv) => (
                                                    <tr key={srv.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{srv.service_name}</td>
                                                        <td className="p-3">{srv.service_provider}</td>
                                                        <td className="p-3">{srv.service_against}</td>
                                                        <td className="p-3 text-right">৳{srv.amount.toFixed(2)}</td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveService(srv.id!)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <AddClinicalServicesForm
                                    open={openServiceForm}
                                    setOpen={setOpenServiceForm}
                                    onAdd={handleAddService}
                                    services={services}
                                />
                            </CardContent>
                        </Card>

                        {/* Outdoor Bills Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Outdoor Bills
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {outdoorBills.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No outdoor bills found for this patient
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">Invoice ID</th>
                                                    <th className="text-left p-3">Invoice Date</th>
                                                    <th className="text-right p-3">Total Amount</th>
                                                    <th className="text-right p-3">Net Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {outdoorBills.map((bill: OutdoorBill) => (
                                                    <tr key={bill.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3 font-semibold">#{bill.id}</td>
                                                        <td className="p-3">
                                                            {bill.invoice_date ? new Date(bill.invoice_date).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="p-3 text-right">৳{Number(bill.total_amount || 0).toFixed(2)}</td>
                                                        <td className="p-3 text-right font-semibold text-green-600">
                                                            ৳{Number(bill.net_amount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Summary Card */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                            <CardHeader>
                                <CardTitle>Billing Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Bed/Cabin Charges ({bedCharges.days} days):</span>
                                        <span className="font-bold">৳{totalBedCharges.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Operation Types Charges:</span>
                                        <span className="font-bold">৳{totalOperations.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Consultant Fees:</span>
                                        <span className="font-bold">৳{totalConsultants.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Services Charges:</span>
                                        <span className="font-bold">৳{totalServices.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-lg font-bold">Grand Total:</span>
                                        <span className="text-xl font-bold text-blue-600">৳{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate({ to: '/admission/patients' })}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createBillingMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {createBillingMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Make Bill
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>

                {/* Bed History Details Dialog */}
                {selectedBedHistory && (
                    <Dialog open={!!selectedBedHistory} onOpenChange={() => setSelectedBedHistory(null)}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <BedDouble className="h-5 w-5" />
                                    Bed History Details
                                </DialogTitle>
                                <DialogDescription>
                                    Billing details for {selectedBedHistory.bed_code} ({selectedBedHistory.bed_type})
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div>
                                        <label className="text-xs text-muted-foreground">From Date</label>
                                        <p className="font-semibold text-sm">
                                            {new Date(selectedBedHistory.from).toLocaleDateString()} {selectedBedHistory.assigned_time || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">To Date</label>
                                        <p className="font-semibold text-sm">
                                            {selectedBedHistory.to
                                                ? `${new Date(selectedBedHistory.to).toLocaleDateString()} ${selectedBedHistory.released_time || ''}`
                                                : 'Present'}
                                        </p>
                                    </div>
                                </div>

                                {/* Bed Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                    <div>
                                        <label className="text-xs text-purple-700 dark:text-purple-300">Bed Code</label>
                                        <p className="font-semibold text-sm">
                                            {selectedBedHistory.bed_code}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-purple-700 dark:text-purple-300">Ward</label>
                                        <p className="font-semibold text-sm">
                                            {selectedBedHistory.bed_ward || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Billing Summary */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <div>
                                        <label className="text-xs text-blue-700 dark:text-blue-300">Days</label>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            {selectedBedHistory.days}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-blue-700 dark:text-blue-300">Daily Rate</label>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            ৳{selectedBedHistory.daily_rate.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-blue-700 dark:text-blue-300">Total</label>
                                        <p className="text-xl font-bold text-green-600">
                                            ৳{selectedBedHistory.charges.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Calculation Details */}
                                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <h4 className="text-sm font-semibold">Calculation</h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <p className="flex justify-between">
                                            <span>Number of Days:</span>
                                            <span className="font-medium">{selectedBedHistory.days}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span>Daily Rate:</span>
                                            <span className="font-medium">৳{selectedBedHistory.daily_rate.toFixed(2)}</span>
                                        </p>
                                        <p className="flex justify-between border-t pt-2 mt-2">
                                            <span className="font-semibold">Total Charges:</span>
                                            <span className="font-bold text-green-600">৳{selectedBedHistory.charges.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        selectedBedHistory.status === 'active'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                    }`}>
                                        {selectedBedHistory.status === 'active' ? 'Active' : 'Released'}
                                    </span>
                                </div>

                                {/* Notes (if any) */}
                                {selectedBedHistory.notes && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <label className="text-xs text-yellow-700 dark:text-yellow-300">Notes</label>
                                        <p className="text-sm text-yellow-900 dark:text-yellow-100 mt-1">
                                            {selectedBedHistory.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedBedHistory(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Change Bed/Cabin Dialog */}
                <Dialog open={openChangeBedDialog} onOpenChange={setOpenChangeBedDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Repeat className="h-5 w-5" />
                                Change Bed/Cabin
                            </DialogTitle>
                            <DialogDescription>
                                Add a new bed/cabin to the admission history. This will create a new entry in admission_bed_history.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const data = {
                                    bed_cabin_id: Number(formData.get('bed_cabin_id')),
                                    notes: formData.get('notes') as string || undefined,
                                    change_date: formData.get('change_date') as string,
                                    change_time: formData.get('change_time') as string,
                                }
                                if (!data.bed_cabin_id) {
                                    toast.error('Please select a bed/cabin')
                                    return
                                }
                                if (!data.change_date) {
                                    toast.error('Please select change date')
                                    return
                                }
                                if (!data.change_time) {
                                    toast.error('Please select change time')
                                    return
                                }
                                changeBedMutation.mutate(data)
                            }}
                        >
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current Bed/Cabin</label>
                                    <Input
                                        value={`${admissionData?.data?.bedCabin?.code || '-'} (${admissionData?.data?.bedCabin?.type || '-'})`}
                                        disabled
                                        className="bg-gray-100 dark:bg-gray-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select New Bed/Cabin *</label>
                                    <Select name="bed_cabin_id" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select bed/cabin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bedsCabins.filter((b: any) => b.status === 'Available').map((bed: any) => (
                                                <SelectItem key={bed.id} value={String(bed.id)}>
                                                    {bed.code} ({bed.type}) - {bed.ward} - ৳{bed.price}/day
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Change Date *</label>
                                        <Input
                                            type="date"
                                            name="change_date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            max={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Change Time *</label>
                                        <Input
                                            type="time"
                                            name="change_time"
                                            defaultValue={new Date().toTimeString().slice(0, 5)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes (Optional)</label>
                                    <Input
                                        name="notes"
                                        placeholder="Reason for bed change"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenChangeBedDialog(false)}
                                    disabled={changeBedMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={changeBedMutation.isPending}
                                >
                                    {changeBedMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Change Bed
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Make Bill for Bed Cabin Dialog */}
                <Dialog open={openBedBillingDialog} onOpenChange={setOpenBedBillingDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Make Bill for Bed Cabin Charges
                            </DialogTitle>
                            <DialogDescription>
                                Create a billing record for bed/cabin charges. Fill in the details below.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                console.log('Form submitted')

                                const formData = new FormData(e.currentTarget)
                                const data = {
                                    from_date: formData.get('from_date') as string,
                                    from_time: formData.get('from_time') as string,
                                    to_date: formData.get('to_date') as string,
                                    to_time: formData.get('to_time') as string,
                                    total_days: Number(formData.get('total_days')),
                                    daily_rate: Number(formData.get('daily_rate')),
                                    total_amount: Number(formData.get('total_amount')),
                                    remarks: formData.get('remarks') as string || '',
                                }

                                console.log('Form data:', data)

                                if (!data.from_date || !data.to_date) {
                                    toast.error('Please select both from and to dates')
                                    return
                                }

                                if (!data.total_days || data.total_days < 1) {
                                    toast.error('Total days must be at least 1')
                                    return
                                }

                                if (!data.daily_rate || data.daily_rate < 0) {
                                    toast.error('Daily rate must be greater than 0')
                                    return
                                }

                                if (!data.total_amount || data.total_amount < 0) {
                                    toast.error('Total amount must be greater than 0')
                                    return
                                }

                                // Create billing with bed charges
                                console.log('Calling mutation with data:', data)
                                createBedBillingMutation.mutate(data)
                            }}
                        >
                            <div className="space-y-4 py-4">
                                {/* From Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">From Date *</label>
                                        <Input
                                            type="date"
                                            name="from_date"
                                            defaultValue={admissionData?.data?.admission_date || new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">From Time *</label>
                                        <Input
                                            type="time"
                                            name="from_time"
                                            defaultValue="09:00"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* To Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">To Date *</label>
                                        <Input
                                            type="date"
                                            name="to_date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">To Time *</label>
                                        <Input
                                            type="time"
                                            name="to_time"
                                            defaultValue={new Date().toTimeString().slice(0, 5)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Total Days */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Total Days *</label>
                                    <Input
                                        type="number"
                                        name="total_days"
                                        min="1"
                                        defaultValue="1"
                                        onChange={(e) => {
                                            const form = e.currentTarget.form
                                            if (!form) return
                                            const days = Number(e.target.value)
                                            const dailyRate = Number((form.elements.namedItem('daily_rate') as HTMLInputElement)?.value) || 0
                                            const totalAmountInput = form.elements.namedItem('total_amount') as HTMLInputElement
                                            if (totalAmountInput) {
                                                totalAmountInput.value = String(days * dailyRate)
                                            }
                                        }}
                                        required
                                    />
                                </div>

                                {/* Daily Rate */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Daily Rate (৳) *</label>
                                    <Input
                                        type="number"
                                        name="daily_rate"
                                        min="0"
                                        step="0.01"
                                        defaultValue={admissionData?.data?.bedCabin?.price || '0'}
                                        onChange={(e) => {
                                            const form = e.currentTarget.form
                                            if (!form) return
                                            const dailyRate = Number(e.target.value)
                                            const days = Number((form.elements.namedItem('total_days') as HTMLInputElement)?.value) || 0
                                            const totalAmountInput = form.elements.namedItem('total_amount') as HTMLInputElement
                                            if (totalAmountInput) {
                                                totalAmountInput.value = String(days * dailyRate)
                                            }
                                        }}
                                        required
                                    />
                                </div>

                                {/* Total Amount */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Total Amount (৳) *</label>
                                    <Input
                                        type="number"
                                        name="total_amount"
                                        min="0"
                                        step="0.01"
                                        defaultValue={admissionData?.data?.bedCabin?.price || '0'}
                                        required
                                    />
                                </div>

                                {/* Remarks */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter any remarks or notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenBedBillingDialog(false)}
                                    disabled={createBedBillingMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createBedBillingMutation.isPending}
                                >
                                    {createBedBillingMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Submit
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
