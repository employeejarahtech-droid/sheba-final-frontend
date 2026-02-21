import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { Plus, Trash2, ArrowLeft, Loader2, Save, FileText, Receipt } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

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

    // Calculate bed/cabin charges
    const calculateBedCharges = () => {
        if (!admissionData?.data?.bedCabin || !admissionData?.data?.admission_date) {
            return { days: 0, dailyRate: 0, total: 0 }
        }

        const admissionDate = new Date(admissionData.data.admission_date)
        const today = new Date()
        const dischargeDate = admissionData.data.discharge_date ? new Date(admissionData.data.discharge_date) : today

        // Calculate difference in days
        const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime())
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1 // Minimum 1 day

        const dailyRate = Number(admissionData.data.bedCabin.price) || 0
        const total = days * dailyRate

        return { days, dailyRate, total }
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
            const res = await fetch(`${API_URL}/api/indoor-billing`, {
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
                                        <p className="font-semibold">
                                            {admissionData?.data?.bedCabin ? `${admissionData.data.bedCabin.code} (${admissionData.data.bedCabin.type})` : '-'}
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
                                                {operations.map((op, index) => (
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
                                <CardTitle>Bed/Cabin Charges</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!admissionData?.data?.bedCabin ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No bed/cabin assigned to this admission
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-sm text-muted-foreground">Bed/Cabin</span>
                                                <p className="font-semibold text-lg">
                                                    {admissionData.data.bedCabin.code} ({admissionData.data.bedCabin.type})
                                                </p>
                                                <p className="text-sm text-gray-500">{admissionData.data.bedCabin.ward}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground">Daily Rate</span>
                                                <p className="font-semibold text-lg">৳{bedCharges.dailyRate.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground">Number of Days</span>
                                                <p className="font-semibold text-lg">{bedCharges.days} day{bedCharges.days !== 1 ? 's' : ''}</p>
                                                <p className="text-xs text-gray-500">
                                                    {admissionData.data.admission_date ? new Date(admissionData.data.admission_date).toLocaleDateString() : '-'} to {admissionData.data.discharge_date ? new Date(admissionData.data.discharge_date).toLocaleDateString() : 'Present'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-semibold">Total Bed Charges:</span>
                                                <span className="text-xl font-bold text-blue-600">৳{bedCharges.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
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
                                        Create Bill
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
