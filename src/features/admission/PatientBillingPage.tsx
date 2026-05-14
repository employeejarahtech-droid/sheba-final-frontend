import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { Plus, Trash2, ArrowLeft, Loader2, Save, FileText, Receipt, BedDouble, Eye, Repeat, Pencil, Printer, UserMinus, ChevronRight, CheckCircle2, Circle, ChevronDown, ChevronUp, Calculator, DoorOpen, Users, DollarSign, Zap } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { AddOperationTypeForm } from './AddOperationTypeForm'
import { AddConsultantForm } from './AddConsultantForm'
import { AddClinicalServicesForm } from './AddClinicalServicesForm'
import { AddSurgeonForm } from './AddSurgeonForm'
import { AddAssistantForm } from './AddAssistantForm'
import { AddAnesthesiologistForm } from './AddAnesthesiologistForm'
import { FinalBillView } from './FinalBillView'
import { PaymentHistoryView } from './PaymentHistoryView'

const API_URL = import.meta.env.VITE_API_URL

type OutdoorBill = {
    id: number
    patient_name: string
    invoice_date: string
    total_amount: number
    discount: number
    net_amount: number
    total_paid: number
    due_amount: number
    created_at?: string
}

type OperationType = {
    id?: number
    operation_type: string
    operation_date: string
    charges: number
    created_at?: string
}

type Consultant = {
    id?: number
    consultant_id: number
    visit_date: string
    fees: number
    consultant_name?: string
    created_at?: string
}

type Service = {
    id?: number
    service_id: number
    note: string
    amount: number
    service_name?: string
    created_at?: string
}

type Surgeon = {
    id?: number
    surgeon_id: number
    operation_date: string
    fees: number
    surgeon_name?: string
    created_at?: string
}

type Assistant = {
    id?: number
    assistant_id: number
    operation_date: string
    fees: number
    assistant_name?: string
    created_at?: string
}

type Anesthesiologist = {
    id?: number
    anesthesiologist_id: number
    anesthesia_type: string
    operation_date: string
    fees: number
    anesthesiologist_name?: string
    created_at?: string
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

// Step Wizard Types
type StepId = 'admission' | 'create-bill' | 'discharge-finalise' | 'distribute' | 'confirm'

type BillingStep = {
    id: StepId
    title: string
    description: string
    status: 'pending' | 'in-progress' | 'completed'
    order: number
}

const BILLING_STEPS: BillingStep[] = [
    {
        id: 'admission',
        title: 'Step 1: Admission',
        description: 'Patient admission and bed assignment',
        status: 'completed',
        order: 1
    },
    {
        id: 'add-items',
        title: 'Step 2: Add Items',
        description: 'Add operations, consultants, and services',
        status: 'pending',
        order: 2
    },
    {
        id: 'create-bill',
        title: 'Step 3: Create Bill',
        description: 'Review and calculate bill summary',
        status: 'pending',
        order: 3
    },
    {
        id: 'final-bill',
        title: 'Step 4: Final Bill',
        description: 'Calculate bed charges and generate final bill',
        status: 'pending',
        order: 4
    },
    {
        id: 'discharge',
        title: 'Step 5: Discharge',
        description: 'Discharge patient and release bed',
        status: 'pending',
        order: 5
    },
    {
        id: 'distribute',
        title: 'Step 6: Distribute Bill',
        description: 'Distribute payments to service providers',
        status: 'pending',
        order: 6
    },
    {
        id: 'balance-distribute',
        title: 'Step 7: Balance Distribute',
        description: 'Settle remaining dues to providers',
        status: 'pending',
        order: 7
    }
]

export function PatientBillingPage() {
    const { admissionId } = useParams({ from: '/_authenticated/admission/patients/$admissionId/billing/' })
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')
    const { format } = useCurrency()

    // Step Wizard State
    const [steps, setSteps] = useState<BillingStep[]>(BILLING_STEPS)
    const [currentStepId, setCurrentStepId] = useState<StepId>('add-items')
    const [expandedSteps, setExpandedSteps] = useState<Set<StepId>>(new Set(['add-items']))

    const [openOperationForm, setOpenOperationForm] = useState(false)
    const [openConsultantForm, setOpenConsultantForm] = useState(false)
    const [openServiceForm, setOpenServiceForm] = useState(false)
    const [openSurgeonForm, setOpenSurgeonForm] = useState(false)
    const [openAssistantForm, setOpenAssistantForm] = useState(false)
    const [openAnesthesiologistForm, setOpenAnesthesiologistForm] = useState(false)
    const [editService, setEditService] = useState<{ id: number; service_id: number; note: string; amount: number } | null>(null)
    const [editOperation, setEditOperation] = useState<any>(null)
    const [editConsultant, setEditConsultant] = useState<any>(null)
    const [editSurgeon, setEditSurgeon] = useState<any>(null)
    const [editAssistant, setEditAssistant] = useState<any>(null)
    const [editAnesthesiologist, setEditAnesthesiologist] = useState<any>(null)
    const [selectedBedHistory, setSelectedBedHistory] = useState<any>(null)
    const [openChangeBedDialog, setOpenChangeBedDialog] = useState(false)
    const [openBedBillingDialog, setOpenBedBillingDialog] = useState(false)
    const [editBedBilling, setEditBedBilling] = useState<any>(null)
    const [openFinalBillDialog, setOpenFinalBillDialog] = useState(false)
    const [openAutoCompleteDialog, setOpenAutoCompleteDialog] = useState(false)
    const [openDischargeDialog, setOpenDischargeDialog] = useState(false)
    const [openDistributeDialog, setOpenDistributeDialog] = useState(false)
    const [openBalanceDistributeDialog, setOpenBalanceDistributeDialog] = useState(false)
    const [autoCompleteDischargeDate, setAutoCompleteDischargeDate] = useState(new Date().toISOString().split('T')[0])
    const [finalBillDischargeDate, setFinalBillDischargeDate] = useState(new Date().toISOString().split('T')[0])
    const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0])
    const [isCreatingFinalBill, setIsCreatingFinalBill] = useState(false)
    const [isAutoCompleting, setIsAutoCompleting] = useState(false)
    const [isDischarging, setIsDischarging] = useState(false)
    const [isDistributing, setIsDistributing] = useState(false)
    const [isBalanceDistributing, setIsBalanceDistributing] = useState(false)

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

    // Fetch anesthesia types from database
    const { data: anesthesiaTypesData } = useQuery({
        queryKey: ['anesthesia-types'],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/anasthesia-type?limit=1000`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch anesthesia types:', res.status, res.statusText)
                    return { data: { items: [] } }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching anesthesia types:', error)
                return { data: { items: [] } }
            }
        },
        enabled: !!token,
    })
    const anesthesiaTypes = anesthesiaTypesData?.data?.items?.map((item: any) => item.name) || anesthesiaTypesData?.data?.map((item: any) => item.name) || []

    // Fetch clinical services from services table (not clinic_services)
    const { data: servicesData } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/service?limit=1000`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch services:', res.status, res.statusText)
                    return { data: { items: [] } }
                }
                const json = await res.json()
                console.log('Services API response:', json)
                return json
            } catch (error) {
                console.error('Error fetching services:', error)
                return { data: { items: [] } }
            }
        },
        enabled: !!token,
    })
    const services = servicesData?.data?.items || servicesData?.data?.rows || servicesData?.data || []
    console.log('Services array:', services)

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

    // Fetch bed/cabin billing records for this admission
    const { data: bedBillingData, refetch: refetchBedBilling } = useQuery({
        queryKey: ['bed-billing', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/bed-cabins/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch bed billing:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching bed billing:', error)
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch operations for this admission
    const { data: operationsData, refetch: refetchOperations } = useQuery({
        queryKey: ['billing-operations', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/operations/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch operations:', res.status)
                    // Return empty data instead of throwing error
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching operations:', error)
                // Return empty data on error
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Initialize operations state from API data
    useEffect(() => {
        if (operationsData?.data) {
            const fetchedOps = (Array.isArray(operationsData.data) ? operationsData.data : []).map((op: any) => ({
                id: op.id,
                operation_type: op.operation_type,
                operation_date: op.operation_date,
                charges: typeof op.charges === 'string' ? parseFloat(op.charges) : (op.charges || 0),
            }))
            setOperations(fetchedOps)
        }
    }, [operationsData])

    // Fetch consultants for this admission
    const { data: consultantsData, refetch: refetchConsultants } = useQuery({
        queryKey: ['billing-consultants', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/consultants/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch consultants:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching consultants:', error)
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Initialize consultants state from API data
    useEffect(() => {
        if (consultantsData?.data) {
            const fetchedCons = (Array.isArray(consultantsData.data) ? consultantsData.data : []).map((c: any) => ({
                id: c.id,
                consultant_id: c.consultant_id,
                visit_date: c.visit_date,
                fees: typeof c.fees === 'string' ? parseFloat(c.fees) : (c.fees || 0),
                consultant_name: c.consultant_name || 'Unknown',
            }))
            setConsultants(fetchedCons)
        }
    }, [consultantsData])

    // Fetch surgeons for this admission
    const { data: surgeonsData, refetch: refetchSurgeons } = useQuery({
        queryKey: ['billing-surgeons', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/surgeons/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch surgeons:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching surgeons:', error)
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Initialize surgeons state from API data
    useEffect(() => {
        if (surgeonsData?.data) {
            const retrievedSurgeons = (Array.isArray(surgeonsData.data) ? surgeonsData.data : []).map((s: any) => ({
                id: s.id,
                surgeon_id: s.surgeon_id,
                operation_date: s.operation_date,
                fees: typeof s.fees === 'string' ? parseFloat(s.fees) : (s.fees || 0),
                surgeon_name: s.surgeon_name || 'Unknown',
            }))
            setSurgeons(retrievedSurgeons)
        }
    }, [surgeonsData])

    // Fetch assistants for this admission
    const { data: assistantsData, refetch: refetchAssistants } = useQuery({
        queryKey: ['billing-assistants', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/assistants/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch assistants:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching assistants:', error)
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Initialize assistants state from API data
    useEffect(() => {
        if (assistantsData?.data) {
            const fetchedAssistants = (Array.isArray(assistantsData.data) ? assistantsData.data : []).map((a: any) => ({
                id: a.id,
                assistant_id: a.assistant_id,
                operation_date: a.operation_date,
                fees: typeof a.fees === 'string' ? parseFloat(a.fees) : (a.fees || 0),
                assistant_name: a.assistant_name || 'Unknown',
            }))
            setAssistants(fetchedAssistants)
        }
    }, [assistantsData])

    // Fetch anesthesiologists for this admission
    const { data: anesthesiologistsData, refetch: refetchAnesthesiologists } = useQuery({
        queryKey: ['billing-anesthesiologists', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/anesthesiologists/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch anesthesiologists:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching anesthesiologists:', error)
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Initialize anesthesiologists state from API data
    useEffect(() => {
        if (anesthesiologistsData?.data) {
            const fetchedAnesthesiologists = (Array.isArray(anesthesiologistsData.data) ? anesthesiologistsData.data : []).map((a: any) => ({
                id: a.id,
                anesthesiologist_id: a.anesthesiologist_id,
                anesthesia_type: a.anesthesia_type || '',
                operation_date: a.operation_date,
                fees: typeof a.fees === 'string' ? parseFloat(a.fees) : (a.fees || 0),
                anesthesiologist_name: a.anesthesiologist_name || 'Unknown',
            }))
            setAnesthesiologists(fetchedAnesthesiologists)
        }
    }, [anesthesiologistsData])

    // Fetch services for this admission
    const { data: billingServicesData, refetch: refetchServices } = useQuery({
        queryKey: ['billing-services', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/services/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch services:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching services:', error)
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Initialize services state from API data
    useEffect(() => {
        if (billingServicesData?.data) {
            const fetchedServices = (Array.isArray(billingServicesData.data) ? billingServicesData.data : []).map((s: any) => ({
                id: s.id,
                service_id: s.service_id,
                note: s.note || '',
                amount: typeof s.amount === 'string' ? parseFloat(s.amount) : (s.amount || 0),
                service_name: services.find((srv: any) => srv.id === s.service_id)?.name || 'Unknown',
            }))
            setServicesList(fetchedServices)
        }
    }, [billingServicesData, services])

    // Fetch bill distributions for this admission
    const { data: distributionsData } = useQuery({
        queryKey: ['bill-distributions', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/bill-distribution/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    console.error('Failed to fetch distributions:', res.status)
                    return { data: [] }
                }
                return res.json()
            } catch (error) {
                console.error('Error fetching distributions:', error)
                return { data: [] }
            }
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
    const [surgeons, setSurgeons] = useState<Surgeon[]>([])
    const [assistants, setAssistants] = useState<Assistant[]>([])
    const [anesthesiologists, setAnesthesiologists] = useState<Anesthesiologist[]>([])
    const [servicesList, setServicesList] = useState<Service[]>([])

    // Add operation
    const handleAddOperation = (operation: OperationType) => {
        // Add to local state immediately for UI update
        setOperations([...operations, { ...operation, id: operation.id || Date.now() }])
        // Refetch from database to get the latest data
        setTimeout(() => {
            refetchOperations()
        }, 500)
    }

    const handleRemoveOperation = async (id: number) => {
        // Remove from local state immediately for UI update
        setOperations(operations.filter(op => op.id !== id))

        // Delete from database
        try {
            const res = await fetch(`${API_URL}/api/billing/operation/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete operation')
                // Revert local state on error
                refetchOperations()
            } else {
                toast.success('Operation deleted successfully')
                refetchOperations()
            }
        } catch (error) {
            toast.error('Failed to delete operation')
            refetchOperations()
        }
    }

    // Add or update consultant
    const handleAddConsultant = async (consultant: Consultant) => {
        try {
            const isEdit = consultant.id !== undefined
            const url = isEdit ? `${API_URL}/api/billing/consultant/${consultant.id}` : `${API_URL}/api/billing/consultant`
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_id: Number(admissionId),
                    consultant_id: consultant.consultant_id,
                    visit_date: consultant.visit_date,
                    fees: consultant.fees,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} consultant`)
                return
            }
            toast.success(`Consultant ${isEdit ? 'updated' : 'added'} successfully`)
            setEditConsultant(null)
            refetchConsultants()
        } catch (error) {
            toast.error(`Failed to ${consultant.id ? 'update' : 'add'} consultant`)
        }
    }

    const handleRemoveConsultant = async (id: number) => {
        if (!confirm('Are you sure you want to delete this consultant?')) return

        try {
            const res = await fetch(`${API_URL}/api/billing/consultant/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete consultant')
                return
            }
            toast.success('Consultant deleted successfully')
            refetchConsultants()
        } catch (error) {
            toast.error('Failed to delete consultant')
        }
    }

    // Add or update service
    const handleAddService = async (service: Service) => {
        try {
            const isEdit = service.id !== undefined
            const url = isEdit ? `${API_URL}/api/billing/service/${service.id}` : `${API_URL}/api/billing/service`
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_id: Number(admissionId),
                    service_id: service.service_id,
                    note: service.note,
                    amount: service.amount,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} service`)
                return
            }
            toast.success(`Service ${isEdit ? 'updated' : 'added'} successfully`)
            setEditService(null)
            refetchServices()
        } catch (error) {
            toast.error(`Failed to ${service.id ? 'update' : 'add'} service`)
        }
    }

    const handleRemoveService = async (id: number) => {
        if (!confirm('Are you sure you want to delete this service?')) return

        try {
            const res = await fetch(`${API_URL}/api/billing/service/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete service')
                return
            }
            toast.success('Service deleted successfully')
            refetchServices()
        } catch (error) {
            toast.error('Failed to delete service')
        }
    }

    // Add or update surgeon
    const handleAddSurgeon = async (surgeon: Surgeon) => {
        try {
            const isEdit = surgeon.id !== undefined
            const url = isEdit ? `${API_URL}/api/billing/surgeon/${surgeon.id}` : `${API_URL}/api/billing/surgeon`
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_id: Number(admissionId),
                    surgeon_id: surgeon.surgeon_id,
                    operation_date: surgeon.operation_date,
                    fees: surgeon.fees,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} surgeon`)
                return
            }
            toast.success(`Surgeon ${isEdit ? 'updated' : 'added'} successfully`)
            setEditSurgeon(null)
            refetchSurgeons()
        } catch (error) {
            toast.error(`Failed to ${surgeon.id ? 'update' : 'add'} surgeon`)
        }
    }

    const handleRemoveSurgeon = async (id: number) => {
        if (!confirm('Are you sure you want to delete this surgeon?')) return

        try {
            const res = await fetch(`${API_URL}/api/billing/surgeon/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete surgeon')
                return
            }
            toast.success('Surgeon deleted successfully')
            refetchSurgeons()
        } catch (error) {
            toast.error('Failed to delete surgeon')
        }
    }

    // Add or update assistant
    const handleAddAssistant = async (assistant: Assistant) => {
        try {
            const isEdit = assistant.id !== undefined
            const url = isEdit ? `${API_URL}/api/billing/assistant/${assistant.id}` : `${API_URL}/api/billing/assistant`
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_id: Number(admissionId),
                    assistant_id: assistant.assistant_id,
                    operation_date: assistant.operation_date,
                    fees: assistant.fees,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} assistant`)
                return
            }
            toast.success(`Assistant ${isEdit ? 'updated' : 'added'} successfully`)
            setEditAssistant(null)
            refetchAssistants()
        } catch (error) {
            toast.error(`Failed to ${assistant.id ? 'update' : 'add'} assistant`)
        }
    }

    const handleRemoveAssistant = async (id: number) => {
        if (!confirm('Are you sure you want to delete this assistant?')) return

        try {
            const res = await fetch(`${API_URL}/api/billing/assistant/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete assistant')
                return
            }
            toast.success('Assistant deleted successfully')
            refetchAssistants()
        } catch (error) {
            toast.error('Failed to delete assistant')
        }
    }

    // Add or update anesthesiologist
    const handleAddAnesthesiologist = async (anesthesiologist: Anesthesiologist) => {
        try {
            const isEdit = anesthesiologist.id !== undefined
            const url = isEdit ? `${API_URL}/api/billing/anesthesiologist/${anesthesiologist.id}` : `${API_URL}/api/billing/anesthesiologist`
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_id: Number(admissionId),
                    anesthesiologist_id: anesthesiologist.anesthesiologist_id,
                    anesthesia_type: anesthesiologist.anesthesia_type,
                    operation_date: anesthesiologist.operation_date,
                    fees: anesthesiologist.fees,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} anesthesiologist`)
                return
            }
            toast.success(`Anesthesiologist ${isEdit ? 'updated' : 'added'} successfully`)
            setEditAnesthesiologist(null)
            refetchAnesthesiologists()
        } catch (error) {
            toast.error(`Failed to ${anesthesiologist.id ? 'update' : 'add'} anesthesiologist`)
        }
    }

    const handleRemoveAnesthesiologist = async (id: number) => {
        if (!confirm('Are you sure you want to delete this anesthesiologist?')) return

        try {
            const res = await fetch(`${API_URL}/api/billing/anesthesiologist/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete anesthesiologist')
                return
            }
            toast.success('Anesthesiologist deleted successfully')
            refetchAnesthesiologists()
        } catch (error) {
            toast.error('Failed to delete anesthesiologist')
        }
    }

    // Delete bed/cabin billing
    const handleDeleteBedBilling = async (id: number) => {
        if (!confirm('Are you sure you want to delete this bed/cabin bill?')) return

        try {
            const res = await fetch(`${API_URL}/api/billing/bed-cabin/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || 'Failed to delete bed/cabin bill')
                return
            }
            toast.success('Bed/Cabin bill deleted successfully')
            refetchBedBilling()
        } catch (error) {
            toast.error('Failed to delete bed/cabin bill')
        }
    }

    // Add or update bed/cabin billing
    const handleAddBedBilling = async (billing: {
        id?: number
        bed_cabin_id: number
        from_date: string
        to_date: string
        days: number
        rate_per_day: number
        total_amount: number
    }) => {
        try {
            const isEdit = billing.id !== undefined
            const url = isEdit ? `${API_URL}/api/billing/bed-cabin/${billing.id}` : `${API_URL}/api/billing/bed-cabin`
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_id: Number(admissionId),
                    bed_cabin_id: billing.bed_cabin_id,
                    from_date: billing.from_date,
                    to_date: billing.to_date || null,
                    days: billing.days,
                    rate_per_day: billing.rate_per_day,
                    total_amount: billing.total_amount,
                }),
            })
            if (!res.ok) {
                const error = await res.json()
                toast.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} bed/cabin bill`)
                return
            }
            toast.success(`Bed/Cabin bill ${isEdit ? 'updated' : 'added'} successfully`)
            setOpenBedBillingDialog(false)
            setEditBedBilling(null)
            refetchBedBilling()
        } catch (error) {
            toast.error(`Failed to ${billing.id !== undefined ? 'update' : 'add'} bed/cabin bill`)
        }
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

    // Calculate bed charges from billing records (indoor_billing_bed_cabin table)
    const bedBills = bedBillingData?.data || []
    const totalBedBillingAmount = bedBills.reduce((sum: number, bill: any) => sum + Number(bill.total_amount), 0)
    const totalBedBillingDays = bedBills.reduce((sum: number, bill: any) => sum + Number(bill.days), 0)

    // Only use manually entered billing records - do NOT use auto-calculated bed history
    const totalBedCharges = totalBedBillingAmount
    const displayBedChargesDays = totalBedBillingDays

    // Calculate totals
    const totalOperations = operations.reduce((sum, op) => sum + Number(op.charges), 0)
    const totalConsultants = consultants.reduce((sum, c) => sum + Number(c.fees), 0)
    const totalSurgeons = surgeons.reduce((sum, s) => sum + Number(s.fees), 0)
    const totalAssistants = assistants.reduce((sum, a) => sum + Number(a.fees), 0)
    const totalAnesthesiologists = anesthesiologists.reduce((sum, a) => sum + Number(a.fees), 0)
    const totalServices = servicesList.reduce((sum, s) => sum + Number(s.amount), 0)
    const grandTotal = totalOperations + totalConsultants + totalSurgeons + totalAssistants + totalAnesthesiologists + totalServices + totalBedCharges

    // Create Bill mutation - Creates final bill without discharging
    const createBillMutation = useMutation({
        mutationFn: async () => {
            try {
                const billRes = await fetch(`${API_URL}/api/admission/${admissionId}/create-bill`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
                if (!billRes.ok) {
                    const error = await billRes.json()
                    throw new Error(error?.message || 'Failed to create bill')
                }
                return await billRes.json()
            } catch (error) {
                throw error
            }
        },
        onSuccess: () => {
            toast.success('Bill created successfully')
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create bill')
        },
    })

    // Combined Discharge & Create Final Bill mutation
    const finalBillMutation = useMutation({
        mutationFn: async (date: string) => {
            setIsCreatingFinalBill(true)
            try {
                // Step 1: Discharge patient if not already discharged
                if (admissionData?.data?.status === 'active') {
                    const dischargeRes = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            discharge_date: date,
                            status: 'discharged',
                        }),
                    })
                    if (!dischargeRes.ok) {
                        const error = await dischargeRes.json()
                        throw new Error(error?.message || 'Failed to discharge patient')
                    }
                }

                // Step 2: Create final bill
                const billRes = await fetch(`${API_URL}/api/admission/${admissionId}/create-final-bill`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
                if (!billRes.ok) {
                    const error = await billRes.json()
                    throw new Error(error?.message || 'Failed to create final bill')
                }

                return await billRes.json()
            } finally {
                setIsCreatingFinalBill(false)
            }
        },
        onSuccess: () => {
            toast.success('Patient discharged and final bill created successfully')
            setOpenFinalBillDialog(false)
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to complete final bill process')
        },
    })

    // Auto Complete Billing Cycle mutation
    const autoCompleteMutation = useMutation({
        mutationFn: async (dischargeDate: string) => {
            setIsAutoCompleting(true)
            try {
                const res = await fetch(`${API_URL}/api/admission/${admissionId}/auto-complete-cycle`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        discharge_date: dischargeDate,
                    }),
                })
                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error?.message || 'Failed to auto-complete billing cycle')
                }

                return await res.json()
            } finally {
                setIsAutoCompleting(false)
            }
        },
        onSuccess: (data) => {
            toast.success('Billing cycle completed successfully!')
            setOpenAutoCompleteDialog(false)
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
            // Navigate to confirm balance page after a short delay
            setTimeout(() => {
                navigate({ to: '/admission/patients/$admissionId/confirm-balance', params: { admissionId: String(admissionId) } })
            }, 1500)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to complete billing cycle')
        },
    })

    // Step Wizard Helper Functions
    const updateStepStatus = (stepId: StepId, status: 'pending' | 'in-progress' | 'completed') => {
        setSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status } : step
        ))
    }

    const isStepAccessible = (stepId: StepId): boolean => {
        const stepIndex = steps.findIndex(s => s.id === stepId)
        const currentStepIndex = steps.findIndex(s => s.id === currentStepId)

        // Can always access completed steps (to review)
        if (steps[stepIndex].status === 'completed') return true

        // Can access current step
        if (stepId === currentStepId) return true

        // Can only access next step if current is completed
        if (stepIndex === currentStepIndex + 1) {
            return steps[currentStepIndex].status === 'completed'
        }

        // Cannot access other steps
        return false
    }

    const goToStep = (stepId: StepId) => {
        if (!isStepAccessible(stepId)) return

        setCurrentStepId(stepId)
        setExpandedSteps(prev => new Set([...prev, stepId]))
    }

    const toggleStepExpanded = (stepId: StepId) => {
        if (!isStepAccessible(stepId)) return

        setExpandedSteps(prev => {
            const newSet = new Set(prev)
            if (newSet.has(stepId)) {
                newSet.delete(stepId)
            } else {
                newSet.add(stepId)
            }
            return newSet
        })
    }

    const isStepExpanded = (stepId: StepId): boolean => {
        return expandedSteps.has(stepId)
    }

    const goToNextStep = () => {
        const currentIndex = steps.findIndex(s => s.id === currentStepId)
        const nextStep = steps[currentIndex + 1]
        if (nextStep && steps[currentIndex].status === 'completed') {
            goToStep(nextStep.id as StepId)
        }
    }

    const canProceedToNextStep = (stepId: StepId): boolean => {
        switch (stepId) {
            case 'add-items':
                return grandTotal > 0 // At least some billing items added
            case 'create-bill':
                return grandTotal > 0 // Items added
            case 'final-bill':
                return admissionData?.data?.bill_created_at
            case 'discharge':
                return admissionData?.data?.final_bill_created_at
            case 'distribute':
                return admissionData?.data?.status === 'discharged'
            case 'balance-distribute':
                return distributionsData?.data?.length > 0
            default:
                return true
        }
    }

    // Auto-advance to next step when current is completed
    useEffect(() => {
        const currentIndex = steps.findIndex(s => s.id === currentStepId)
        const currentStep = steps[currentIndex]

        // If current step is completed and there's a next step, auto-advance
        if (currentStep?.status === 'completed' && currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1]
            if (nextStep?.status === 'pending') {
                // Small delay before auto-advancing
                const timer = setTimeout(() => {
                    goToStep(nextStep.id as StepId)
                }, 500)
                return () => clearTimeout(timer)
            }
        }
    }, [steps, currentStepId])

    // Auto-update step statuses based on data
    useEffect(() => {
        setSteps(prev => {
            const newSteps = [...prev]
            // Step 1 (admission) is always completed if viewing this page
            newSteps[0].status = 'completed'

            // Step 2 (add-items): Check if billing items exist
            const hasBillItems = grandTotal > 0
            newSteps[1] = {
                ...newSteps[1],
                status: hasBillItems ? 'completed' : (currentStepId === 'add-items' ? 'in-progress' : 'pending')
            }

            // Step 3 (create-bill): Check if preliminary bill created
            const hasPreliminaryBill = admissionData?.data?.bill_created_at
            newSteps[2] = {
                ...newSteps[2],
                status: hasPreliminaryBill ? 'completed' : (hasBillItems && currentStepId === 'create-bill' ? 'in-progress' : 'pending')
            }

            // Step 4 (final-bill): Check if final bill created
            const hasFinalBill = admissionData?.data?.final_bill_created_at
            newSteps[3] = {
                ...newSteps[3],
                status: hasFinalBill ? 'completed' : (hasPreliminaryBill && currentStepId === 'final-bill' ? 'in-progress' : 'pending')
            }

            // Step 5 (discharge): Check if discharged
            const isDischarged = admissionData?.data?.status === 'discharged'
            newSteps[4] = {
                ...newSteps[4],
                status: isDischarged ? 'completed' : (hasFinalBill && currentStepId === 'discharge' ? 'in-progress' : 'pending')
            }

            // Step 6 (distribute): Check if distributions exist
            const hasDistributions = distributionsData?.data?.length > 0
            newSteps[5] = {
                ...newSteps[5],
                status: hasDistributions ? 'completed' : (isDischarged && currentStepId === 'distribute' ? 'in-progress' : 'pending')
            }

            // Step 7 (balance-distribute): Check if fully confirmed
            const isConfirmed = hasDistributions && isDischarged
            newSteps[6] = {
                ...newSteps[6],
                status: isConfirmed ? 'completed' : (hasDistributions && currentStepId === 'balance-distribute' ? 'in-progress' : 'pending')
            }

            return newSteps
        })
    }, [admissionData, grandTotal, distributionsData, currentStepId])

    // Handle print billing
    const handlePrintBilling = () => {
        // Navigate to the billing print page
        window.open(`/admission/patients/${admissionId}/billing-print`, '_blank')
    }

    // Note: Items are saved individually when added (operations, consultants)
    // No separate "Make Bill" endpoint needed - billing is created incrementally

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

    // Create bed billing mutation - uses /api/billing/bed-cabin endpoint
    // const _createBedBillingMutation = useMutation({
    //     mutationFn: async (formData: {
    //         from_date: string
    //         from_time: string
    //         to_date: string
    //         to_time: string
    //         total_days: number
    //         daily_rate: number
    //         total_amount: number
    //         remarks: string
    //     }) => {
    //         const token = getCookie('accessToken')
    //         const bedCabinId = admissionData?.data?.bedCabin?.id
    //         const requestBody = {
    //             admission_id: Number(admissionId),
    //             bed_cabin_id: bedCabinId || 0,
    //             from_date: formData.from_date,
    //             to_date: formData.to_date,
    //             days: formData.total_days,
    //             rate_per_day: formData.daily_rate,
    //             total_amount: formData.total_amount,
    //         }
    //         console.log('Sending request to:', `${API_URL}/api/billing/bed-cabin`)
    //         console.log('Request body:', requestBody)
    //         const res = await fetch(`${API_URL}/api/billing/bed-cabin`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`,
    //             },
    //             body: JSON.stringify(requestBody),
    //         })
    //         if (!res.ok) {
    //             const error = await res.json()
    //             console.error('Error response:', error)
    //             throw new Error(error?.message || 'Failed to create bed billing')
    //         }
    //         return await res.json()
    //     },
    //     onSuccess: () => {
    //         toast.success('Bed charges added successfully')
    //         setOpenBedBillingDialog(false)
    //         queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
    //         queryClient.invalidateQueries({ queryKey: ['bed-charges', admissionId] })
    //         refetchBedBilling()
    //     },
    //     onError: (error: Error) => {
    //         toast.error(error.message || 'Failed to create bed billing')
    //     },
    // })

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
        <>
            <AppHeader fixed />
            <Main className="p-6 lg:p-10 w-full flex-1 dark:bg-black/20">
                <div className="max-w-full mx-auto">
                <PageHeader
                    title="Patient Billing"
                    subtitle={`${admissionData?.data?.patient_name || 'Unknown Patient'} • Admission #${admissionId}`}
                    backButton={{
                        onClick: () => navigate({ to: '/admission/patients' }),
                    }}
                    actions={
                        admissionData?.data?.bill_created === 1 ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                                    Bill Created on {admissionData.data.bill_created_date ? new Date(admissionData.data.bill_created_date).toLocaleDateString() : 'N/A'}
                                </span>
                                <span className="text-green-700 dark:text-green-300 text-sm font-bold">
                                    {format(Number(admissionData.data.total_bill_amount || 0))}
                                </span>
                            </div>
                        ) : null
                    }
                />

                {/* Billing Layout */}
                    <div>
                        <Form {...form}>
                        <div className="space-y-6">
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
                                                        {admissionData?.data?.bedCabin?.ward} • {format(admissionData?.data?.bedCabin?.price || 0)}/day
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
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Status</span>
                                                    <p className="font-semibold">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            admissionData?.data?.status === 'active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                : admissionData?.data?.status === 'discharged'
                                                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                            {admissionData?.data?.status?.charAt(0).toUpperCase() + admissionData?.data?.status?.slice(1) || 'Unknown'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                {/* Create Bill Content */}
                                <div className="space-y-6">
                                        {/* Step Actions */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Step 3: Create Bill */}
                                            {!admissionData?.data?.bill_created && (
                                                <Button
                                                    onClick={() => createBillMutation.mutate()}
                                                    disabled={grandTotal === 0 || createBillMutation.isPending}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    {createBillMutation.isPending ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Create Bill 💰
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {/* Step 5: Discharge */}
                                            {admissionData?.data?.final_bill_created_at && admissionData?.data?.status === 'active' && (
                                                <Button
                                                    onClick={() => setOpenDischargeDialog(true)}
                                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                                >
                                                    <DoorOpen className="h-4 w-4 mr-2" />
                                                    Discharge 💰
                                                </Button>
                                            )}

                                        </div>
                                    </div>

                        {/* Operation Types Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Operation Types</CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditOperation(null)
                                                setOpenOperationForm(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Operation
                                        </Button>
                                    )}
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
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(operations) && operations.map((op) => (
                                                    <tr key={op.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{op.operation_type}</td>
                                                        <td className="p-3">{op.operation_date}</td>
                                                        <td className="p-3 text-right">{format(Number(op.charges || 0))}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{op.created_at ? new Date(op.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center flex gap-2 justify-center">
                                                            {!admissionData?.data?.bill_created_at && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditOperation({ id: op.id!, operation_type: op.operation_type, operation_date: op.operation_date, charges: op.charges })
                                                                            setOpenOperationForm(true)
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveOperation(op.id!)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {admissionData?.data?.bill_created_at && (
                                                                <span className="text-xs text-gray-400 italic">Locked</span>
                                                            )}
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
                                    admissionId={admissionId}
                                    editOperation={editOperation}
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
                                        {!admissionData?.data?.bill_created_at && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setOpenChangeBedDialog(true)}
                                            >
                                                <Repeat className="h-4 w-4 mr-2" />
                                                Change Bed/Cabin
                                            </Button>
                                        )}
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
                                                                                {/* Delete Button - Only for non-active entries and when bill is not created */}
                                                                                {!isActive && !admissionData?.data?.bill_created_at && (
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

                        {/* Bed/Cabin Billing Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5" />
                                        Bed/Cabin Bills
                                    </CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
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
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {bedBillingData?.data && bedBillingData.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">SL</th>
                                                    <th className="text-left p-3">Bed/Cabin</th>
                                                    <th className="text-left p-3">From Date</th>
                                                    <th className="text-left p-3">To Date</th>
                                                    <th className="text-left p-3">Days</th>
                                                    <th className="text-right p-3">Rate/Day</th>
                                                    <th className="text-right p-3">Total</th>
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bedBillingData.data.map((bill: any, index: number) => (
                                                    <tr key={bill.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{index + 1}</td>
                                                        <td className="p-3">{bill.bed_code} ({bill.bed_type})</td>
                                                        <td className="p-3">{bill.from_date}</td>
                                                        <td className="p-3">{bill.to_date || 'Active'}</td>
                                                        <td className="p-3">{bill.days}</td>
                                                        <td className="p-3 text-right">{format(Number(bill.rate_per_day))}</td>
                                                        <td className="p-3 text-right">{format(Number(bill.total_amount))}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{bill.created_at ? new Date(bill.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {!admissionData?.data?.bill_created_at && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditBedBilling(bill)
                                                                                setOpenBedBillingDialog(true)
                                                                            }}
                                                                            className="text-blue-500 hover:text-blue-700"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteBedBilling(bill.id)}
                                                                            className="text-red-500 hover:text-red-700"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {admissionData?.data?.bill_created_at && (
                                                                    <span className="text-xs text-gray-400 italic">Locked</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        No bed/cabin bills generated yet. Click "Make Bill for Bed Cabin" to create billing records.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Consultants Card */}

                        {/* Consultants Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Consultants</CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditConsultant(null)
                                                setOpenConsultantForm(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Consultant
                                        </Button>
                                    )}
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
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consultants.map((cons, index) => (
                                                    <tr key={cons.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{index + 1}</td>
                                                        <td className="p-3">{cons.consultant_name}</td>
                                                        <td className="p-3">{cons.visit_date}</td>
                                                        <td className="p-3 text-right">{format(cons.fees)}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{cons.created_at ? new Date(cons.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center flex gap-2 justify-center">
                                                            {!admissionData?.data?.bill_created_at && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditConsultant({ id: cons.id!, consultant_id: cons.consultant_id, visit_date: cons.visit_date, fees: cons.fees })
                                                                            setOpenConsultantForm(true)
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveConsultant(cons.id!)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {admissionData?.data?.bill_created_at && (
                                                                <span className="text-xs text-gray-400 italic">Locked</span>
                                                            )}
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
                                    editConsultant={editConsultant}
                                />
                            </CardContent>
                        </Card>

                        {/* Surgeons Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Surgeons</CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditSurgeon(null)
                                                setOpenSurgeonForm(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Surgeon
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {surgeons.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No surgeons added yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">SL</th>
                                                    <th className="text-left p-3">Surgeon Name</th>
                                                    <th className="text-left p-3">Operation Date</th>
                                                    <th className="text-right p-3">Fees</th>
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {surgeons.map((surgeon, index) => (
                                                    <tr key={surgeon.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{index + 1}</td>
                                                        <td className="p-3">{surgeon.surgeon_name}</td>
                                                        <td className="p-3">{surgeon.operation_date}</td>
                                                        <td className="p-3 text-right">{format(surgeon.fees)}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{surgeon.created_at ? new Date(surgeon.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center flex gap-2 justify-center">
                                                            {!admissionData?.data?.bill_created_at && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditSurgeon({ id: surgeon.id!, surgeon_id: surgeon.surgeon_id, operation_date: surgeon.operation_date, fees: surgeon.fees })
                                                                            setOpenSurgeonForm(true)
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveSurgeon(surgeon.id!)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {admissionData?.data?.bill_created_at && (
                                                                <span className="text-xs text-gray-400 italic">Locked</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <AddSurgeonForm
                                    open={openSurgeonForm}
                                    setOpen={setOpenSurgeonForm}
                                    onAdd={handleAddSurgeon}
                                    doctors={doctors}
                                    editSurgeon={editSurgeon}
                                />
                            </CardContent>
                        </Card>

                        {/* Assistants Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Assistants</CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditAssistant(null)
                                                setOpenAssistantForm(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Assistant
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {assistants.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No assistants added yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">SL</th>
                                                    <th className="text-left p-3">Assistant Name</th>
                                                    <th className="text-left p-3">Operation Date</th>
                                                    <th className="text-right p-3">Fees</th>
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assistants.map((assistant, index) => (
                                                    <tr key={assistant.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{index + 1}</td>
                                                        <td className="p-3">{assistant.assistant_name}</td>
                                                        <td className="p-3">{assistant.operation_date}</td>
                                                        <td className="p-3 text-right">{format(assistant.fees)}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{assistant.created_at ? new Date(assistant.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center flex gap-2 justify-center">
                                                            {!admissionData?.data?.bill_created_at && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditAssistant({ id: assistant.id!, assistant_id: assistant.assistant_id, operation_date: assistant.operation_date, fees: assistant.fees })
                                                                            setOpenAssistantForm(true)
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveAssistant(assistant.id!)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {admissionData?.data?.bill_created_at && (
                                                                <span className="text-xs text-gray-400 italic">Locked</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <AddAssistantForm
                                    open={openAssistantForm}
                                    setOpen={setOpenAssistantForm}
                                    onAdd={handleAddAssistant}
                                    doctors={doctors}
                                    editAssistant={editAssistant}
                                />
                            </CardContent>
                        </Card>

                        {/* Anesthesiologists Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Anesthesiologists</CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditAnesthesiologist(null)
                                                setOpenAnesthesiologistForm(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Anesthesiologist
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {anesthesiologists.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No anesthesiologists added yet
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-3">SL</th>
                                                    <th className="text-left p-3">Anesthesiologist Name</th>
                                                    <th className="text-left p-3">Anesthesia Type</th>
                                                    <th className="text-left p-3">Operation Date</th>
                                                    <th className="text-right p-3">Fees</th>
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {anesthesiologists.map((anesthesiologist, index) => (
                                                    <tr key={anesthesiologist.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{index + 1}</td>
                                                        <td className="p-3">{anesthesiologist.anesthesiologist_name}</td>
                                                        <td className="p-3">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                {anesthesiologist.anesthesia_type || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">{anesthesiologist.operation_date}</td>
                                                        <td className="p-3 text-right">{format(anesthesiologist.fees)}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{anesthesiologist.created_at ? new Date(anesthesiologist.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center flex gap-2 justify-center">
                                                            {!admissionData?.data?.bill_created_at && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditAnesthesiologist({ id: anesthesiologist.id!, anesthesiologist_id: anesthesiologist.anesthesiologist_id, anesthesia_type: anesthesiologist.anesthesia_type, operation_date: anesthesiologist.operation_date, fees: anesthesiologist.fees })
                                                                            setOpenAnesthesiologistForm(true)
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveAnesthesiologist(anesthesiologist.id!)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {admissionData?.data?.bill_created_at && (
                                                                <span className="text-xs text-gray-400 italic">Locked</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <AddAnesthesiologistForm
                                    open={openAnesthesiologistForm}
                                    setOpen={setOpenAnesthesiologistForm}
                                    onAdd={handleAddAnesthesiologist}
                                    doctors={doctors}
                                    anesthesiaTypes={anesthesiaTypes}
                                    editAnesthesiologist={editAnesthesiologist}
                                />
                            </CardContent>
                        </Card>

                        {/* Services Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Clinical Services</CardTitle>
                                    {!admissionData?.data?.bill_created_at && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditService(null)
                                                setOpenServiceForm(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Service
                                        </Button>
                                    )}
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
                                                    <th className="text-left p-3">Note</th>
                                                    <th className="text-right p-3">Amount</th>
                                                    <th className="text-left p-3">Created At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {servicesList.map((srv) => (
                                                    <tr key={srv.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3">{srv.service_name}</td>
                                                        <td className="p-3">{srv.note}</td>
                                                        <td className="p-3 text-right">{format(srv.amount)}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">{srv.created_at ? new Date(srv.created_at).toLocaleDateString() : '-'}</td>
                                                        <td className="p-3 text-center flex gap-2 justify-center">
                                                            {!admissionData?.data?.bill_created_at && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditService({ id: srv.id!, service_id: srv.service_id, note: srv.note, amount: srv.amount })
                                                                            setOpenServiceForm(true)
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveService(srv.id!)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {admissionData?.data?.bill_created_at && (
                                                                <span className="text-xs text-gray-400 italic">Locked</span>
                                                            )}
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
                                    editService={editService}
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
                                                    <th className="text-right p-3">Total Discount</th>
                                                    <th className="text-right p-3">Total Bill</th>
                                                    <th className="text-right p-3">Total Paid</th>
                                                    <th className="text-right p-3">Total Due</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {outdoorBills.map((bill: OutdoorBill) => (
                                                    <tr key={bill.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="p-3 font-semibold">#{bill.id}</td>
                                                        <td className="p-3">
                                                            {bill.invoice_date ? new Date(bill.invoice_date).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="p-3 text-right">{format(Number(bill.total_amount || 0))}</td>
                                                        <td className="p-3 text-right text-orange-600">{format(Number(bill.discount || 0))}</td>
                                                        <td className="p-3 text-right font-semibold">{format(Number(bill.net_amount || 0))}</td>
                                                        <td className="p-3 text-right text-green-600">{format(Number(bill.total_paid || 0))}</td>
                                                        <td className="p-3 text-right font-semibold text-red-600">{format(Number(bill.due_amount || 0))}</td>
                                                        <td className="p-3 text-center">
                                                            <a
                                                                href={`/outdoor/reception/due-collection/${bill.id}`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                                            >
                                                                View Details
                                                            </a>
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
                                <div className="flex items-center justify-between">
                                    <CardTitle>Billing Summary</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrintBilling}
                                        className="print:hidden"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Bed/Cabin Charges ({displayBedChargesDays} days):</span>
                                        <span className="font-bold">{format(totalBedCharges)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Operation Types Charges:</span>
                                        <span className="font-bold">{format(totalOperations)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Consultant Fees:</span>
                                        <span className="font-bold">{format(totalConsultants)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Surgeon Fees:</span>
                                        <span className="font-bold">{format(totalSurgeons)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Assistant Fees:</span>
                                        <span className="font-bold">{format(totalAssistants)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Anesthesiologist Fees:</span>
                                        <span className="font-bold">{format(totalAnesthesiologists)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span>Services Charges:</span>
                                        <span className="font-bold">{format(totalServices)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-lg font-bold">Grand Total:</span>
                                        <span className="text-xl font-bold text-blue-600">{format(grandTotal)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment History Section - Always show at bottom */}
                        <PaymentHistoryView admissionId={admissionId} />
                        </div>
                        </Form>
                    </div>

                {/* Dialogs - These are siblings to the billing content, inside max-w-full div */}

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
                                            {format(selectedBedHistory.daily_rate)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-blue-700 dark:text-blue-300">Total</label>
                                        <p className="text-xl font-bold text-green-600">
                                            {format(selectedBedHistory.charges)}
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
                                            <span className="font-medium">{format(selectedBedHistory.daily_rate)}</span>
                                        </p>
                                        <p className="flex justify-between border-t pt-2 mt-2">
                                            <span className="font-semibold">Total Charges:</span>
                                            <span className="font-bold text-green-600">{format(selectedBedHistory.charges)}</span>
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
                                                    {bed.code} ({bed.type}) - {bed.ward} - {format(bed.price)}/day
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
                <Dialog open={openBedBillingDialog} onOpenChange={(open) => {
                    setOpenBedBillingDialog(open)
                    if (!open) setEditBedBilling(null)
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                {editBedBilling ? 'Edit Bed/Cabin Bill' : 'Make Bill for Bed Cabin Charges'}
                            </DialogTitle>
                            <DialogDescription>
                                {editBedBilling ? 'Update the billing record for bed/cabin charges.' : 'Create a billing record for bed/cabin charges. Fill in the details below.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                console.log('Form submitted')

                                const formData = new FormData(e.currentTarget)
                                const bedCabinId = editBedBilling?.bed_cabin_id || admissionData?.data?.bedCabin?.id || 0
                                const data = {
                                    id: editBedBilling?.id,
                                    bed_cabin_id: bedCabinId,
                                    from_date: formData.get('from_date') as string,
                                    to_date: formData.get('to_date') as string,
                                    days: Number(formData.get('total_days')),
                                    rate_per_day: Number(formData.get('daily_rate')),
                                    total_amount: Number(formData.get('total_amount')),
                                }

                                console.log('Form data:', data)

                                if (!data.from_date || !data.to_date) {
                                    toast.error('Please select both from and to dates')
                                    return
                                }

                                if (!data.days || data.days < 1) {
                                    toast.error('Total days must be at least 1')
                                    return
                                }

                                if (!data.rate_per_day || data.rate_per_day < 0) {
                                    toast.error('Daily rate must be greater than 0')
                                    return
                                }

                                if (!data.total_amount || data.total_amount < 0) {
                                    toast.error('Total amount must be greater than 0')
                                    return
                                }

                                // Create or update billing
                                console.log('Calling handler with data:', data)
                                handleAddBedBilling(data)
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
                                            defaultValue={editBedBilling?.from_date || admissionData?.data?.admission_date || new Date().toISOString().split('T')[0]}
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
                                            defaultValue={editBedBilling?.to_date || new Date().toISOString().split('T')[0]}
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
                                        defaultValue={editBedBilling?.days || 1}
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
                                        defaultValue={editBedBilling?.rate_per_day || admissionData?.data?.bedCabin?.price || '0'}
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
                                        defaultValue={editBedBilling?.total_amount || admissionData?.data?.bedCabin?.price || '0'}
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
                                    onClick={() => {
                                        setOpenBedBillingDialog(false)
                                        setEditBedBilling(null)
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {editBedBilling ? 'Update' : 'Submit'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Final Bill & Discharge Dialog */}
                <Dialog open={openFinalBillDialog} onOpenChange={setOpenFinalBillDialog}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                Create Bill & {admissionData?.data?.status === 'active' ? 'Discharge Patient' : 'Complete Billing'}
                            </DialogTitle>
                            <DialogDescription>
                                {admissionData?.data?.status === 'active'
                                    ? 'Review the bill summary and confirm discharge to create the final bill.'
                                    : 'Review the bill summary to create the final bill.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Patient Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Patient</Label>
                                    <p className="text-sm font-medium">{admissionData?.data?.patient_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Current Status</Label>
                                    <p className="text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            admissionData?.data?.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {admissionData?.data?.status?.charAt(0).toUpperCase() + admissionData?.data?.status?.slice(1) || 'Unknown'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Total Charges</Label>
                                    <p className="text-sm font-bold text-lg">{format(grandTotal)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Bill Items</Label>
                                    <p className="text-sm font-medium">
                                        {operations.length + consultants.length + surgeons.length + assistants.length + anesthesiologists.length + servicesList.length + (bedBillingData?.data?.length || 0)} items
                                    </p>
                                </div>
                            </div>

                            {/* Discharge Date - Only show if patient is active */}
                            {admissionData?.data?.status === 'active' && (
                                <div className="space-y-2">
                                    <Label htmlFor="finalBillDischargeDate">Discharge Date *</Label>
                                    <Input
                                        id="finalBillDischargeDate"
                                        type="date"
                                        value={finalBillDischargeDate}
                                        onChange={(e) => setFinalBillDischargeDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Patient will be discharged on this date
                                    </p>
                                </div>
                            )}

                            {/* Bill Summary */}
                            <div className="space-y-2">
                                <Label>Bill Summary</Label>
                                <div className="space-y-1 text-sm">
                                    {operations.length > 0 && <div className="flex justify-between"><span>Operations:</span><span>{format(totalOperations)}</span></div>}
                                    {consultants.length > 0 && <div className="flex justify-between"><span>Consultants:</span><span>{format(totalConsultants)}</span></div>}
                                    {surgeons.length > 0 && <div className="flex justify-between"><span>Surgeons:</span><span>{format(totalSurgeons)}</span></div>}
                                    {assistants.length > 0 && <div className="flex justify-between"><span>Assistants:</span><span>{format(totalAssistants)}</span></div>}
                                    {anesthesiologists.length > 0 && <div className="flex justify-between"><span>Anesthesiologists:</span><span>{format(totalAnesthesiologists)}</span></div>}
                                    {servicesList.length > 0 && <div className="flex justify-between"><span>Services:</span><span>{format(totalServices)}</span></div>}
                                    {totalBedCharges > 0 && <div className="flex justify-between"><span>Bed Charges:</span><span>{format(totalBedCharges)}</span></div>}
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>Total:</span>
                                        <span>{format(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    <strong>What happens next:</strong>
                                </p>
                                <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                                    {admissionData?.data?.status === 'active' && (
                                        <>
                                            <li>Patient status will change to "Discharged"</li>
                                            <li>Assigned bed/cabin will be released</li>
                                        </>
                                    )}
                                    <li>Final bill will be created with all charges</li>
                                    <li>Bill cannot be modified after creation</li>
                                </ul>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpenFinalBillDialog(false)}
                                disabled={finalBillMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => finalBillMutation.mutate(finalBillDischargeDate)}
                                disabled={finalBillMutation.isPending || (admissionData?.data?.status === 'active' && !finalBillDischargeDate)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {finalBillMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {admissionData?.data?.status === 'active' ? 'Discharge & Create Bill' : 'Create Final Bill'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Auto Complete Billing Cycle Dialog */}
                <Dialog open={openAutoCompleteDialog} onOpenChange={setOpenAutoCompleteDialog}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 text-purple-600" />
                                Auto Complete All Steps
                            </DialogTitle>
                            <DialogDescription>
                                This will automatically complete all billing cycle steps in sequence. Please verify before proceeding.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Bill Summary */}
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium mb-3">Current Bill Summary:</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Operations:</span>
                                        <span className="font-semibold">{totalOperations.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Consultants:</span>
                                        <span className="font-semibold">{totalConsultants.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Surgeons:</span>
                                        <span className="font-semibold">{totalSurgeons.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Assistants:</span>
                                        <span className="font-semibold">{totalAssistants.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Services:</span>
                                        <span className="font-semibold">{totalServices.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>Total:</span>
                                        <span>{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Steps Overview */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Steps to be executed:</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">1</div>
                                        <span>Discharge patient and release bed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">2</div>
                                        <span>Create final bill with all charges</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">3</div>
                                        <span>Auto-distribute payments to providers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">4</div>
                                        <span>Record all provider payments</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">5</div>
                                        <span>Confirm billing cycle complete</span>
                                    </div>
                                </div>
                            </div>

                            {/* Discharge Date */}
                            <div>
                                <Label>Discharge Date *</Label>
                                <Input
                                    type="date"
                                    value={autoCompleteDischargeDate}
                                    onChange={(e) => setAutoCompleteDischargeDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Warning Note */}
                            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                <p className="text-xs text-orange-800 dark:text-orange-300">
                                    <strong>⚠️ Important:</strong> This action will:
                                </p>
                                <ul className="text-xs text-orange-700 dark:text-orange-400 mt-2 space-y-1 list-disc list-inside">
                                    <li>Discharge the patient and release bed/cabin</li>
                                    <li>Create final bill (cannot be modified after)</li>
                                    <li>Auto-distribute payments to all providers</li>
                                    <li>Record full payments to all providers</li>
                                    <li>Complete the billing cycle</li>
                                </ul>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpenAutoCompleteDialog(false)}
                                disabled={isAutoCompleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => autoCompleteMutation.mutate(autoCompleteDischargeDate)}
                                disabled={isAutoCompleting || !autoCompleteDischargeDate || grandTotal === 0}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {isAutoCompleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2" />
                                        Start Auto Complete
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Main>
    </>
    )
}
