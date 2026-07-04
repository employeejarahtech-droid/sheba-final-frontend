import { useState, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { Plus, Trash2, ArrowLeft, Loader2, Save, FileText, Receipt, BedDouble, Eye, Repeat, Pencil, Printer, UserMinus, ChevronRight, CheckCircle2, Circle, ChevronDown, ChevronUp, Calculator, DoorOpen, Users, DollarSign, Zap, LayoutGrid, Bed, Search, AlertCircle, Activity, HeartPulse, UserCheck, Check, GripVertical, ArrowUpDown } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { useDateControls } from '@/hooks/use-date-controls'
import { DateField } from '@/components/date-field'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    operation_time?: string
    total_time_period?: string
    created_at?: string
}

type Consultant = {
    id?: number
    consultant_id: number
    visit_date: string
    fees: number
    consultant_name?: string
    note?: string
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
type StepId = 'admission' | 'add-items' | 'create-bill' | 'final-bill' | 'discharge' | 'distribute' | 'balance-distribute' | 'confirm'

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
    const { admissionId } = useParams({ from: '/_authenticated/dashboard/admission/patients/$admissionId/billing/' })
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const token = getCookie('accessToken')
    const { format, currencySymbol, locale } = useCurrency()
    // Number-only formatter (no currency code) — for grid cells where the currency is in the heading
    const formatNumber = (amount: number | string) => {
        const n = typeof amount === 'string' ? parseFloat(amount) : amount
        return n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    const { formatDate, formatDateTime, toISODate } = useDateFormat()
    const { isChangeable } = useDateControls()
    const safeFormatDate = (dateVal: any) => {
        if (!dateVal) return '-'
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
            const [y, m, day] = dateVal.split('-').map(Number)
            return formatDate(new Date(y, m - 1, day))
        }
        const d = new Date(dateVal)
        if (isNaN(d.getTime())) return '-'
        return formatDate(d)
    }

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
    const [selectedNewBedId, setSelectedNewBedId] = useState<string>('')
    const [isBoardOpen, setIsBoardOpen] = useState(false)
    const [isBedDropdownOpen, setIsBedDropdownOpen] = useState(false)
    const [bedSearchQuery, setBedSearchQuery] = useState('')
    const [bedTypeFilter, setBedTypeFilter] = useState<'All' | 'Bed' | 'Cabin'>('All')
    const [boardFilter, setBoardFilter] = useState<'all' | 'free' | 'booked' | 'maintenance'>('all')
    const [boardSearch, setBoardSearch] = useState('')
    const [changeBedDate, setChangeBedDate] = useState<string>(() => new Date().toISOString().split('T')[0])
    const [bedBillingFromDate, setBedBillingFromDate] = useState<string>('')
    const [bedBillingToDate, setBedBillingToDate] = useState<string>('')

    // Fetch ALL beds/cabins for Status Board
    const { data: allBedsData, isLoading: allBedsLoading } = useQuery({
        queryKey: ['all-beds-cabins-board'],
        queryFn: async () => {
            const res = await fetch(
                `${API_URL}/api/bed-cabin?limit=200`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            if (!res.ok) return { data: { items: [] } }
            return res.json()
        },
        enabled: !!token && isBoardOpen,
        staleTime: 10 * 1000,
    })
    const allBeds = allBedsData?.data?.items || allBedsData?.data?.rows || []

    const filteredBoardBeds = useMemo(() => {
        return allBeds.filter((bed: any) => {
            const statusKey = String(bed.status || 'Available').toLowerCase().trim();
            const isFree = statusKey === 'available' || statusKey === 'free';
            const isBooked = statusKey === 'occupied' || statusKey === 'booked';
            if (boardFilter === 'free' && !isFree) return false;
            if (boardFilter === 'booked' && !isBooked) return false;
            if (boardFilter === 'maintenance' && statusKey !== 'maintenance') return false;

            if (boardSearch.trim() !== '') {
                const searchLower = boardSearch.toLowerCase().trim();
                const codeMatch = bed.code?.toLowerCase().includes(searchLower);
                const wardMatch = bed.ward?.toLowerCase().includes(searchLower);
                const typeMatch = bed.type?.toLowerCase().includes(searchLower);
                return codeMatch || wardMatch || typeMatch;
            }
            return true;
        });
    }, [allBeds, boardFilter, boardSearch]);
    const [openBedBillingDialog, setOpenBedBillingDialog] = useState(false)
    const [editBedBilling, setEditBedBilling] = useState<any>(null)

    // Fetch admission details
    const { data: admissionData, isLoading: admissionLoading, error: admissionError } = useQuery({
        queryKey: ['admission', admissionId],
        queryFn: async () => {
            console.log('Fetching admission:', admissionId)
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log('Response status:', res.status)
            if (!res.ok) {
                let errorMsg = 'Failed to fetch admission'
                try {
                    const errorData = await res.json()
                    errorMsg = errorData?.message || errorMsg
                } catch (_) { }
                throw new Error(errorMsg)
            }
            const data = await res.json()
            console.log('Admission data:', data)
            return data
        },
        enabled: !!token && !!admissionId,
    })

    useEffect(() => {
        if (!openChangeBedDialog) {
            setSelectedNewBedId('')
            setChangeBedDate(new Date().toISOString().split('T')[0])
        }
    }, [openChangeBedDialog])

    useEffect(() => {
        if (openBedBillingDialog) {
            setBedBillingFromDate(editBedBilling?.from_date || admissionData?.data?.admission_date || new Date().toISOString().split('T')[0])
            setBedBillingToDate(editBedBilling?.to_date || new Date().toISOString().split('T')[0])
        } else {
            setBedBillingFromDate('')
            setBedBillingToDate('')
        }
    }, [openBedBillingDialog, editBedBilling, admissionData])

    const [openFinalBillDialog, setOpenFinalBillDialog] = useState(false)
    const [isEditingFinalBill, setIsEditingFinalBill] = useState(false)
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
    const [discountNotes, setDiscountNotes] = useState<string>('')
    const [customRowOrderKeys, setCustomRowOrderKeys] = useState<string[] | null>(null)
    const [openReorderDialog, setOpenReorderDialog] = useState(false)
    const orderKeysRef = useRef<string[] | null>(null)
    useEffect(() => { orderKeysRef.current = customRowOrderKeys }, [customRowOrderKeys])

    // Load the persisted bill-item order for this admission (saved after drag-and-drop)
    useEffect(() => {
        if (!admissionId || !token) return
        fetch(`${API_URL}/api/admission/${admissionId}/bill-item-order`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                const order = json?.data?.order
                if (Array.isArray(order) && order.length) setCustomRowOrderKeys(order)
            })
            .catch(() => {})
    }, [admissionId, token])
    const [customFinalBillItemsOrder, setCustomFinalBillItemsOrder] = useState<any[] | null>(null)
    const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('')
    const [openDischargeDialog, setOpenDischargeDialog] = useState(false)
    const [openDistributeDialog, setOpenDistributeDialog] = useState(false)
    const [openBalanceDistributeDialog, setOpenBalanceDistributeDialog] = useState(false)
    const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0])
    const [isDischarging, setIsDischarging] = useState(false)
    const [isDistributing, setIsDistributing] = useState(false)
    const [isBalanceDistributing, setIsBalanceDistributing] = useState(false)

    // Lifecycle sidebar card open/close states
    const [isCreateBillOpen, setIsCreateBillOpen] = useState(true)
    const [isFinalBillOpen, setIsFinalBillOpen] = useState(true)
    const [isDischargeOpen, setIsDischargeOpen] = useState(true)
    const [isDistributeOpen, setIsDistributeOpen] = useState(true)

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
                operation_time: op.operation_time || '',
                total_time_period: op.total_time_period || '',
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
                note: c.note || '',
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
                    note: consultant.note || '',
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

    // ── Final bill + payments data ──
    const { data: finalBillData } = useQuery({
        queryKey: ['final-bill', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: null }
            return res.json()
        },
        enabled: !!token && !!admissionId && !!admissionData?.data?.final_bill_created,
    })
    const finalBill = finalBillData?.data || null

    const { data: paymentsData } = useQuery({
        queryKey: ['payments', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: [] }
            return res.json()
        },
        enabled: !!token && !!admissionId && !!admissionData?.data?.final_bill_created_date,
    })
    const payments = paymentsData?.data || []

    // Derived billing summary (prefer saved final bill, fall back to live calc)
    const finalBillNet = Number(finalBill?.total_discounted_amount || 0)
    const totalPaid = Number(finalBill?.paid_amount || 0)
    const totalDue = Number(finalBill?.due_amount || 0)
    const advancePayments: any[] = admissionData?.data?.advancePayments?.payments || []
    const totalAdvance = Number(admissionData?.data?.advancePayments?.total_amount || 0)

    const billingSummaryMap = useMemo(() => {
        const summary: Record<string, { original: number; discount: number; net: number }> = {
            bed_charges: { original: totalBedCharges, discount: 0, net: totalBedCharges },
            operation: { original: totalOperations, discount: 0, net: totalOperations },
            consultant: { original: totalConsultants, discount: 0, net: totalConsultants },
            surgeon: { original: totalSurgeons, discount: 0, net: totalSurgeons },
            assistant: { original: totalAssistants, discount: 0, net: totalAssistants },
            anesthesia: { original: totalAnesthesiologists, discount: 0, net: totalAnesthesiologists },
            service: { original: totalServices, discount: 0, net: totalServices },
            medicine: { original: 0, discount: 0, net: 0 },
            other: { original: 0, discount: 0, net: 0 },
        }

        if (finalBill?.items) {
            Object.keys(summary).forEach(key => {
                summary[key] = { original: 0, discount: 0, net: 0 }
            })
            
            finalBill.items.forEach((item: any) => {
                let type = item.service_type;
                if (item.service_reference_table === 'indoor_billing_anesthesiologists') {
                    type = 'anesthesia';
                }
                if (!summary[type]) {
                    summary[type] = { original: 0, discount: 0, net: 0 }
                }
                summary[type].original += Number(item.total_amount || 0)
                summary[type].discount += Number(item.total_discount || 0)
                summary[type].net += Number(item.final_amount || 0)
            })
        }

        return summary
    }, [finalBill, totalBedCharges, totalOperations, totalConsultants, totalSurgeons, totalAssistants, totalAnesthesiologists, totalServices])

    // Transactions ledger: advances + final-bill charge + payments, with a running due.
    // running > 0 => Due; running < 0 => Balance (credit); 0 => Settled.
    const transactions = useMemo(() => {
        const items: { id: string; date: string; label: string; amount: number; kind: 'charge' | 'credit' }[] = []
        advancePayments.forEach((p: any) => items.push({
            id: `adv-${p.id}`,
            date: p.payment_date || p.created_at,
            label: 'Advance',
            amount: Number(p.amount) || 0,
            kind: 'credit',
        }))
        if (finalBill) {
            items.push({
                id: `fb-${finalBill.id}`,
                date: finalBill.discounted_bill_created_date || finalBill.created_at,
                label: 'Final Bill',
                amount: Number(finalBill.total_discounted_amount) || Number(finalBill.total_bill_amount) || 0,
                kind: 'charge',
            })
        }
        payments.forEach((p: any) => items.push({
            id: `pay-${p.id}`,
            date: p.payment_date || p.created_at,
            label: p.final_bill_id ? 'Payment' : 'Advance',
            amount: Number(p.amount) || 0,
            kind: 'credit',
        }))

        items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        let running = 0
        return items.map((it) => {
            running += it.kind === 'charge' ? it.amount : -it.amount
            return { ...it, running }
        })
    }, [advancePayments, finalBill, payments])
    const currentRunning = transactions.length ? transactions[transactions.length - 1].running : 0
    const txnBilled = transactions.filter((t: any) => t.kind === 'charge').reduce((s: number, t: any) => s + t.amount, 0)
    const txnPaid = transactions.filter((t: any) => t.kind === 'credit').reduce((s: number, t: any) => s + t.amount, 0)
    const maxPayment = Math.max(0, currentRunning)   // cannot pay more than the due
    const maxRefund = Math.max(0, -currentRunning)    // cannot refund more than the overpayment

    // Final-bill editable grid: one row per charge line the final bill snapshots
    // (bed/cabin, operations, consultants, surgeons, assistants, services — mirrors create-final-bill)
    const billGridRows = useMemo(() => {
        const rows: { key: string; category: string; label: string; refTable: string; refId: number; qty: number; rate: number; amount: number }[] = []
        bedBills.forEach((b: any) => rows.push({
            key: `indoor_billing_bed_cabin:${b.id}`,
            category: 'Bed Charges',
            label: `${b.bed_code || 'Bed'} (${b.bed_type || 'Bed'})`,
            refTable: 'indoor_billing_bed_cabin', refId: b.id,
            qty: Number(b.days) || 1,
            rate: Number(b.rate_per_day) || 0,
            amount: Number(b.total_amount) || 0,
        }))
        operations.forEach((o: any) => rows.push({
            key: `indoor_billing_operations:${o.id}`,
            category: 'Operation',
            label: o.operation_type || 'Operation',
            refTable: 'indoor_billing_operations', refId: o.id,
            qty: 1, rate: Number(o.charges) || 0, amount: Number(o.charges) || 0,
        }))
        consultants.forEach((c: any) => rows.push({
            key: `indoor_billing_consultants:${c.id}`,
            category: 'Consultant',
            label: `Consultation - ${c.consultant_name || 'Unknown'}`,
            refTable: 'indoor_billing_consultants', refId: c.id,
            qty: 1, rate: Number(c.fees) || 0, amount: Number(c.fees) || 0,
        }))
        surgeons.forEach((s: any) => rows.push({
            key: `indoor_billing_surgeons:${s.id}`,
            category: 'Surgeon',
            label: `Surgeon Fee - ${s.surgeon_name || 'Unknown'}`,
            refTable: 'indoor_billing_surgeons', refId: s.id,
            qty: 1, rate: Number(s.fees) || 0, amount: Number(s.fees) || 0,
        }))
        assistants.forEach((a: any) => rows.push({
            key: `indoor_billing_assistants:${a.id}`,
            category: 'Assistant',
            label: `Assistant Fee - ${a.assistant_name || 'Unknown'}`,
            refTable: 'indoor_billing_assistants', refId: a.id,
            qty: 1, rate: Number(a.fees) || 0, amount: Number(a.fees) || 0,
        }))
        anesthesiologists.forEach((a: any) => rows.push({
            key: `indoor_billing_anesthesiologists:${a.id}`,
            category: 'Anesthesia',
            label: `Anesthesia - ${a.anesthesiologist_name || 'Unknown'}`,
            refTable: 'indoor_billing_anesthesiologists', refId: a.id,
            qty: 1, rate: Number(a.fees) || 0, amount: Number(a.fees) || 0,
        }))
        servicesList.forEach((sv: any) => rows.push({
            key: `indoor_billing_services:${sv.id}`,
            category: 'Clinical Service',
            label: sv.service_name || sv.note || 'Service',
            refTable: 'indoor_billing_services', refId: sv.id,
            qty: 1, rate: Number(sv.amount) || 0, amount: Number(sv.amount) || 0,
        }))
        return rows
    }, [bedBills, operations, consultants, surgeons, assistants, anesthesiologists, servicesList])

    const gridGross = billGridRows.reduce((sum, r) => sum + r.amount, 0)
    const [rowDiscounts, setRowDiscounts] = useState<Record<string, number>>({})
    const gridDiscount = billGridRows.reduce((sum, r) => sum + (Number(rowDiscounts[r.key]) || 0), 0)
    const gridNet = Math.max(0, gridGross - gridDiscount)

    const finalBillGross = useMemo(() => {
        if (!finalBill?.items) return 0
        return finalBill.items.reduce((sum: number, it: any) => sum + Number(it.total_amount), 0)
    }, [finalBill])

    const finalBillDiscount = useMemo(() => {
        if (!finalBill?.items) return 0
        return finalBill.items.reduce((sum: number, it: any) => sum + (Number(rowDiscounts[it.id]) || 0), 0)
    }, [finalBill, rowDiscounts])

    const finalBillNetVal = Math.max(0, finalBillGross - finalBillDiscount)

    const sortedBillGridRows = useMemo(() => {
        if (!customRowOrderKeys) return billGridRows
        const keyToIndex = new Map(customRowOrderKeys.map((key, i) => [key, i]))
        return [...billGridRows].sort((a, b) => {
            const idxA = keyToIndex.has(a.key) ? keyToIndex.get(a.key)! : 9999
            const idxB = keyToIndex.has(b.key) ? keyToIndex.get(b.key)! : 9999
            return idxA - idxB
        })
    }, [billGridRows, customRowOrderKeys])

    const displayFinalBillItems = useMemo(() => {
        if (!finalBill?.items) return []
        if (!customFinalBillItemsOrder) return finalBill.items
        const idToIndex = new Map(customFinalBillItemsOrder.map((item, i) => [item.id, i]))
        return [...finalBill.items].sort((a, b) => {
            const idxA = idToIndex.has(a.id) ? idToIndex.get(a.id)! : 9999
            const idxB = idToIndex.has(b.id) ? idToIndex.get(b.id)! : 9999
            return idxA - idxB
        })
    }, [finalBill, customFinalBillItemsOrder])


    // Transactions-card money dialog (advance / payment / refund)
    const [txnDialogMode, setTxnDialogMode] = useState<'advance' | 'payment' | 'refund' | null>(null)
    const [txnAmount, setTxnAmount] = useState<number>(0)
    const [txnMethod, setTxnMethod] = useState<string>('cash')
    const [txnNotes, setTxnNotes] = useState<string>('')
    // Payment date for the advance/payment dialog (ISO YYYY-MM-DD).
    const [txnDate, setTxnDate] = useState<string>('')
    // Whether the date for the current dialog mode may be edited (Settings → Date Controls).
    const txnDateChangeable =
        txnDialogMode === 'advance' ? isChangeable('indoor_advance_payment_date_changeable')
            : txnDialogMode === 'payment' ? isChangeable('indoor_payment_date_changeable')
                : false

    // Create Final Bill from the editable grid (apply per-line discounts)
    const finalizeWithDiscountMutation = useMutation({
        mutationFn: async () => {
            // Step 1: create the final bill snapshot
            const createRes = await fetch(`${API_URL}/api/admission/${admissionId}/create-final-bill`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            })
            if (!createRes.ok) {
                const err = await createRes.json().catch(() => null)
                throw new Error(err?.message || 'Failed to create final bill')
            }

            // Step 2: if any per-line discount, note, doctor was entered, OR items were reordered, map rows → final_bill_items and apply
            const hasOrderChanges = customRowOrderKeys !== null
            if (gridDiscount <= 0 && !discountNotes && !selectedDoctorId && !hasOrderChanges) return

            const fbRes = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!fbRes.ok) throw new Error('Failed to load final bill for discounting')
            const fbJson = await fbRes.json()
            const items: any[] = fbJson?.data?.items || []
            const paidAmount = Number(fbJson?.data?.paid_amount || 0)

            const item_discounts: Record<string, number> = {}
            billGridRows.forEach((row) => {
                const disc = Number(rowDiscounts[row.key]) || 0
                if (disc <= 0) return
                const match = items.find((it: any) =>
                    it.service_reference_table === row.refTable && Number(it.service_reference_id) === row.refId
                )
                if (match) item_discounts[match.id] = disc
            })

            const item_order: number[] = []
            sortedBillGridRows.forEach((row) => {
                const match = items.find((it: any) =>
                    it.service_reference_table === row.refTable && Number(it.service_reference_id) === row.refId
                )
                if (match) item_order.push(match.id)
            })

            const updateRes = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_discounts,
                    item_order,
                    total_discount: gridDiscount,
                    total_discounted_amount: gridNet,
                    due_amount: Math.max(0, gridNet - paidAmount),
                    notes: discountNotes,
                    discounted_by_doctor_id: selectedDoctorId ? parseInt(selectedDoctorId) : null,
                }),
            })
            if (!updateRes.ok) {
                const err = await updateRes.json().catch(() => null)
                throw new Error(err?.message || 'Failed to apply discounts')
            }
        },
        onSuccess: () => {
            toast.success('Final bill created successfully')
            setOpenFinalBillDialog(false)
            setRowDiscounts({})
            setSelectedDoctorId('')
            setDiscountNotes('')
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to create final bill'),
    })

    // Update Final Bill mutation - Updates existing final bill item discounts and notes
    const updateFinalBillMutation = useMutation({
        mutationFn: async () => {
            const item_discounts: Record<string, number> = {}
            if (finalBill?.items) {
                finalBill.items.forEach((item: any) => {
                    item_discounts[item.id] = Number(rowDiscounts[item.id]) || 0
                })
            }

            const computedTotalDiscount = Object.values(item_discounts).reduce((s, v) => s + v, 0)
            const computedTotalBillAmount = (finalBill?.items || []).reduce((s: number, it: any) => s + Number(it.total_amount), 0)
            const computedTotalDiscountedAmount = Math.max(0, computedTotalBillAmount - computedTotalDiscount)
            const item_order = displayFinalBillItems.map((it: any) => it.id)

            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_discounts,
                    item_order,
                    total_discount: computedTotalDiscount,
                    total_discounted_amount: computedTotalDiscountedAmount,
                    due_amount: Math.max(0, computedTotalDiscountedAmount - Number(finalBill?.paid_amount || 0)),
                    notes: discountNotes,
                    discounted_by_doctor_id: selectedDoctorId ? parseInt(selectedDoctorId) : null,
                }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.message || 'Failed to update final bill')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Final bill updated successfully')
            setOpenFinalBillDialog(false)
            setIsEditingFinalBill(false)
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to update final bill'),
    })

    // Update Final Bill Order mutation - Updates only the item order/serial
    const updateFinalBillOrderMutation = useMutation({
        mutationFn: async () => {
            const item_order = displayFinalBillItems.map((it: any) => it.id)

            const res = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_order,
                }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.message || 'Failed to update order')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Order updated successfully')
            setOpenFinalBillDialog(false)
            setIsEditingFinalBill(false)
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to update order'),
    })

    // Unified money mutation for the Transactions dialog (advance / payment / refund)
    const recordTxnMutation = useMutation({
        mutationFn: async () => {
            const mode = txnDialogMode
            const endpoint = mode === 'advance' ? 'advance-payment' : mode === 'refund' ? 'final-bill/refund' : 'final-bill/payment'
            const methodKey = mode === 'refund' ? 'refund_method' : 'payment_method'
            // Only send a chosen payment date for advance/payment, and only when
            // the admin allows editing it — otherwise the backend stamps "now".
            const includeDate = (mode === 'advance' || mode === 'payment') && txnDateChangeable && txnDate
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(txnAmount), notes: txnNotes || undefined, [methodKey]: txnMethod, ...(includeDate ? { payment_date: txnDate } : {}) }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.message || `Failed to record ${mode || 'transaction'}`)
            }
            return res.json()
        },
        onSuccess: () => {
            const label = txnDialogMode === 'advance' ? 'Advance' : txnDialogMode === 'refund' ? 'Refund' : 'Payment'
            toast.success(`${label} recorded successfully`)
            setTxnDialogMode(null); setTxnAmount(0); setTxnNotes(''); setTxnDate('')
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['final-bill', admissionId] })
            queryClient.invalidateQueries({ queryKey: ['payments', admissionId] })
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to record transaction'),
    })

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

    // Standalone discharge (locks the admission — nothing can change after this)
    const dischargePatientMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ discharge_date: dischargeDate, status: 'discharged' }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.message || 'Failed to discharge patient')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Patient discharged successfully')
            setOpenDischargeDialog(false)
            queryClient.invalidateQueries({ queryKey: ['admission', admissionId] })
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to discharge patient'),
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
                return admissionData?.data?.final_bill_created_date
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
            const hasFinalBill = admissionData?.data?.final_bill_created_date
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
        window.open(`/dashboard/admission/patients/${admissionId}/billing-print`, '_blank')
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
            <Main className=" w-full flex-1 dark:bg-black/20">
                <div className="max-w-full mx-auto">
                    <PageHeader
                        title="Patient Billing"
                        subtitle={`${admissionData?.data?.patient_name || 'Unknown Patient'} • Admission #${admissionId}`}
                        backButton={{
                            onClick: () => navigate({ to: '/dashboard/admission/patients' }),
                        }}
                        actions={
                            <div className="flex items-center gap-3">
                                {admissionData?.data?.bill_created === 1 && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                        <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                                            Bill Created on {admissionData.data.bill_created_date ? safeFormatDate(admissionData.data.bill_created_date) : 'N/A'}
                                        </span>
                                        <span className="text-green-700 dark:text-green-300 text-sm font-bold">
                                            {format(grandTotal)}
                                        </span>
                                    </div>
                                )}
                            </div>
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
                                <Card className="mt-3 overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold">Patient Information</CardTitle>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Key details about the patient and admission record</p>
                                            </div>
                                        </div>
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
                                                    {admissionData?.data?.admission_date ? safeFormatDate(admissionData.data.admission_date) : '-'}
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
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${admissionData?.data?.status === 'active'
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

                                {/* ===== TWO-COLUMN BILLING LAYOUT ===== */}
                                <div className="grid grid-cols-1 xl:grid-cols-[1fr_560px] gap-5 items-start">

                                    {/* ===== LEFT COLUMN: Billing Item Tables ===== */}
                                    <div className="space-y-4">


                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Operation Types</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Recorded operations and procedures</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Operation Type</th>
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time</th>
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Duration</th>
                                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created At</th>
                                                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                                        {Array.isArray(operations) && operations.map((op, idx) => (
                                                            <tr key={op.id} className={cn("hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-colors", idx % 2 !== 0 ? "bg-gray-50/60 dark:bg-gray-900/20" : "")}>
                                                                <td className="px-3 py-2.5 font-medium">{op.operation_type}</td>
                                                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{safeFormatDate(op.operation_date)}</td>
                                                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{op.operation_time || '-'}</td>
                                                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{op.total_time_period || '-'}</td>
                                                                <td className="px-3 py-2.5 text-sm text-muted-foreground">{op.created_at ? safeFormatDate(op.created_at) : '-'}</td>
                                                                <td className="px-3 py-2.5 text-center">
                                                                    <div className="flex gap-1.5 justify-center">
                                                                    {!admissionData?.data?.bill_created_at && (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setEditOperation({ id: op.id!, operation_type: op.operation_type, operation_date: op.operation_date, charges: op.charges, operation_time: op.operation_time, total_time_period: op.total_time_period })
                                                                                    setOpenOperationForm(true)
                                                                                }}
                                                                                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 hover:text-blue-700 transition-colors"
                                                                                title="Edit"
                                                                            >
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveOperation(op.id!)}
                                                                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 transition-colors"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <Bed className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Bed/Cabin Charges</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Timeline and daily rate breakdown for bed history</p>
                                                </div>
                                            </div>
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
                                                                                        {safeFormatDate(fromDate)}
                                                                                        {isActive && toDate > fromDate && (
                                                                                            <>
                                                                                                {' - '}Present
                                                                                            </>
                                                                                        )}
                                                                                        {!isActive && toDate && (
                                                                                            <>
                                                                                                {' - '}{safeFormatDate(toDate)}
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <BedDouble className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Bed Cabin Billing Records</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Logged billing transactions for patient stay duration</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs border-collapse">
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
                                                                <td className="p-3">{safeFormatDate(bill.from_date)}</td>
                                                                <td className="p-3">{bill.to_date ? safeFormatDate(bill.to_date) : 'Active'}</td>
                                                                <td className="p-3">{bill.days}</td>
                                                                <td className="p-3 text-right">{format(Number(bill.rate_per_day))}</td>
                                                                <td className="p-3 text-right">{format(Number(bill.total_amount))}</td>
                                                                <td className="p-3 text-sm text-muted-foreground">{bill.created_at ? safeFormatDate(bill.created_at) : '-'}</td>
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Consultants</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Assigned consultants, visitation dates, and fees</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs border-collapse">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="text-left p-3">SL</th>
                                                            <th className="text-left p-3">Consultant Name</th><th className="text-left p-3">Note</th>
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
                                                                <td className="p-3">{cons.consultant_name}</td><td className="p-3 max-w-[260px] align-top">{cons.note ? <span className="block truncate text-muted-foreground" title={cons.note}>{cons.note}</span> : <span className="text-muted-foreground/40">-</span>}</td>
                                                                <td className="p-3">{safeFormatDate(cons.visit_date)}</td>
                                                                <td className="p-3 text-right">{format(cons.fees)}</td>
                                                                <td className="p-3 text-sm text-muted-foreground">{cons.created_at ? safeFormatDate(cons.created_at) : '-'}</td>
                                                                <td className="p-3 text-center flex gap-2 justify-center">
                                                                    {!admissionData?.data?.bill_created_at && (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setEditConsultant({ id: cons.id!, consultant_id: cons.consultant_id, visit_date: cons.visit_date, fees: cons.fees, note: cons.note })
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <HeartPulse className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Surgeons</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Surgeon assignments and surgery fee distribution</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs border-collapse">
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
                                                                <td className="p-3">{safeFormatDate(surgeon.operation_date)}</td>
                                                                <td className="p-3 text-right">{format(surgeon.fees)}</td>
                                                                <td className="p-3 text-sm text-muted-foreground">{surgeon.created_at ? safeFormatDate(surgeon.created_at) : '-'}</td>
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <UserCheck className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Assistants</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Assistant surgeon fees and details</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs border-collapse">
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
                                                                <td className="p-3">{safeFormatDate(assistant.operation_date)}</td>
                                                                <td className="p-3 text-right">{format(assistant.fees)}</td>
                                                                <td className="p-3 text-sm text-muted-foreground">{assistant.created_at ? safeFormatDate(assistant.created_at) : '-'}</td>
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <Zap className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Anesthesiologists</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Anesthesia type, administration dates, and fees</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs border-collapse">
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
                                                                <td className="p-3">{safeFormatDate(anesthesiologist.operation_date)}</td>
                                                                <td className="p-3 text-right">{format(anesthesiologist.fees)}</td>
                                                                <td className="p-3 text-sm text-muted-foreground">{anesthesiologist.created_at ? safeFormatDate(anesthesiologist.created_at) : '-'}</td>
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                    <LayoutGrid className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold">Clinical Services</CardTitle>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Hospital clinical services, test charges, and utility bills</p>
                                                </div>
                                            </div>
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
                                                <table className="w-full text-xs border-collapse">
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
                                                                <td className="p-3 text-sm text-muted-foreground">{srv.created_at ? safeFormatDate(srv.created_at) : '-'}</td>
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
                                <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-2 px-4 gap-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                                                <Receipt className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold">Outdoor Bills</CardTitle>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Invoices and outstanding dues from outdoor department</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {outdoorBills.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-8">
                                                No outdoor bills found for this patient
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs border-collapse">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="text-left p-3">Invoice ID</th>
                                                            <th className="text-left p-3">Invoice Date</th>
                                                            <th className="text-right p-3">Total Amount ({currencySymbol})</th>
                                                            <th className="text-right p-3">Discount ({currencySymbol})</th>
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
                                                                    {bill.invoice_date ? safeFormatDate(bill.invoice_date) : '-'}
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

                                {/* Payment History Section */}
                                <PaymentHistoryView admissionId={admissionId} />


                                    </div>{/* ===== END LEFT COLUMN ===== */}

                                    {/* ===== RIGHT COLUMN: Lifecycle Action Panel (Sticky) ===== */}
                                    <div className="sticky top-4 space-y-4">

                                        {/* Billing Summary Widget */}
                                        <Card className="overflow-hidden shadow-none border bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-950/50 dark:to-blue-950/20 p-0">
                                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 gap-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-white/20 rounded-lg">
                                                            <Calculator className="h-3.5 w-3.5 text-white" />
                                                        </div>
                                                        <CardTitle className="text-sm font-bold text-white">Billing Summary</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setOpenReorderDialog(true)}
                                                            className="h-7 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                                                            title="Reorder bill items"
                                                        >
                                                            <Pencil className="h-3 w-3 mr-1" />
                                                            Order
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handlePrintBilling}
                                                            className="h-7 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30 print:hidden"
                                                        >
                                                            <Printer className="h-3 w-3 mr-1" />
                                                            Print
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                                    {billingSummaryMap.bed_charges.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <Bed className="h-3.5 w-3.5 text-blue-500" />
                                                                Bed/Cabin ({displayBedChargesDays}d)
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.bed_charges.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.bed_charges.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.bed_charges.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.consultant.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <UserCheck className="h-3.5 w-3.5 text-purple-500" />
                                                                Consultants
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.consultant.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.consultant.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.consultant.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.operation.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <HeartPulse className="h-3.5 w-3.5 text-red-500" />
                                                                Operations
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.operation.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.operation.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.operation.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.surgeon.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <HeartPulse className="h-3.5 w-3.5 text-red-500" />
                                                                Surgeons
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.surgeon.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.surgeon.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.surgeon.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.assistant.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <Users className="h-3.5 w-3.5 text-green-500" />
                                                                Assistants
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.assistant.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.assistant.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.assistant.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.anesthesia.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <Zap className="h-3.5 w-3.5 text-amber-500" />
                                                                Anesthesia
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.anesthesia.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.anesthesia.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.anesthesia.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.service.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <LayoutGrid className="h-3.5 w-3.5 text-teal-500" />
                                                                Services
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.service.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.service.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.service.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.medicine && billingSummaryMap.medicine.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <LayoutGrid className="h-3.5 w-3.5 text-teal-500" />
                                                                Medicine
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.medicine.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.medicine.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.medicine.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {billingSummaryMap.other && billingSummaryMap.other.original > 0 && (
                                                        <div className="flex justify-between items-center px-4 py-2.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                                                <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
                                                                Other Charges
                                                            </span>
                                                            <div className="text-right">
                                                                {billingSummaryMap.other.discount > 0 && (
                                                                    <span className="text-xs text-red-500 mr-2 line-through">{format(billingSummaryMap.other.original)}</span>
                                                                )}
                                                                <span className="text-sm font-semibold tabular-nums">{format(billingSummaryMap.other.net)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {finalBill ? (
                                                        <>
                                                            <div className="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800">
                                                                <span className="text-xs font-medium text-slate-500">Gross Bill</span>
                                                                <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{format(Number(finalBill.total_bill_amount))}</span>
                                                            </div>
                                                            {Number(finalBill.total_discount || 0) > 0 && (
                                                                <div className="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 text-red-500">
                                                                    <span className="text-xs font-medium">Total Discount</span>
                                                                    <span className="text-xs font-semibold tabular-nums">-{format(Number(finalBill.total_discount))}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center px-4 py-3 bg-blue-600 dark:bg-blue-700 rounded-b-lg">
                                                                <span className="text-sm font-bold text-white">Net Final Bill</span>
                                                                <span className="text-lg font-extrabold text-white tabular-nums">{format(Number(finalBill.total_discounted_amount))}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex justify-between items-center px-4 py-3 bg-blue-600 dark:bg-blue-700 rounded-b-lg">
                                                            <span className="text-sm font-bold text-white">Grand Total</span>
                                                            <span className="text-lg font-extrabold text-white tabular-nums">{format(grandTotal)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* CARD 1: Create Preliminary Bill */}
                                        <Card className={cn(
                                            "overflow-hidden shadow-none border transition-all p-0",
                                            admissionData?.data?.bill_created === 1
                                                ? "border-green-200 dark:border-green-800/60 bg-green-50/30 dark:bg-green-950/10"
                                                : "border-blue-200 dark:border-blue-800/60"
                                        )}>
                                            <CardHeader
                                                className={cn(
                                                    "py-3 px-4 flex flex-row items-center justify-between cursor-pointer select-none gap-0",
                                                    admissionData?.data?.bill_created === 1
                                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-b border-green-100 dark:border-green-900/40"
                                                        : "bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/10 border-b border-blue-100 dark:border-blue-900/40"
                                                )}
                                                onClick={() => setIsCreateBillOpen(!isCreateBillOpen)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "p-1.5 rounded-lg",
                                                        admissionData?.data?.bill_created === 1
                                                            ? "bg-green-500"
                                                            : "bg-blue-500"
                                                    )}>
                                                        {admissionData?.data?.bill_created === 1
                                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                            : <FileText className="h-3.5 w-3.5 text-white" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold leading-none">1. Create Bill</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Preliminary bill generation</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                        admissionData?.data?.bill_created === 1
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                    )}>
                                                        {admissionData?.data?.bill_created === 1 ? "Done" : "Pending"}
                                                    </span>
                                                    {isCreateBillOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                            </CardHeader>
                                            {isCreateBillOpen && (
                                                <CardContent className="p-4">
                                                    {admissionData?.data?.bill_created === 1 ? (
                                                        <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded-lg p-3 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold flex items-center gap-1.5 mb-1">
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Preliminary Bill Created
                                                                </p>
                                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                                    Created on {admissionData.data.bill_created_date ? safeFormatDate(admissionData.data.bill_created_date) : 'N/A'}
                                                                    {' '}· Amount: <strong>{format(grandTotal)}</strong>
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handlePrintBilling}
                                                                className="text-xs border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800 text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                                                            >
                                                                <Printer className="h-3.5 w-3.5 mr-1" />
                                                                Print
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <p className="text-xs text-muted-foreground">
                                                                Generate the preliminary bill based on all items added so far.
                                                            </p>
                                                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                                <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Estimated Total</span>
                                                                <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">{format(grandTotal)}</span>
                                                            </div>
                                                            <Button
                                                                onClick={() => createBillMutation.mutate()}
                                                                disabled={grandTotal === 0 || createBillMutation.isPending}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
                                                            >
                                                                {createBillMutation.isPending ? (
                                                                    <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Creating...</>
                                                                ) : (
                                                                    <><FileText className="h-3.5 w-3.5 mr-2" />Create Preliminary Bill</>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>

                                        {/* CARD 2: Create Final Bill */}
                                        <Card className={cn(
                                            "overflow-hidden shadow-none border transition-all p-0",
                                            admissionData?.data?.final_bill_created_date
                                                ? "border-green-200 dark:border-green-800/60 bg-green-50/30 dark:bg-green-950/10"
                                                : admissionData?.data?.bill_created === 1
                                                    ? "border-indigo-200 dark:border-indigo-800/60"
                                                    : "border-gray-200 dark:border-gray-800/60 opacity-60"
                                        )}>
                                            <CardHeader
                                                className={cn(
                                                    "py-3 px-4 flex flex-row items-center justify-between gap-0",
                                                    admissionData?.data?.bill_created === 1 ? "cursor-pointer select-none" : "cursor-not-allowed select-none",
                                                    admissionData?.data?.final_bill_created_date
                                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-b border-green-100 dark:border-green-900/40"
                                                        : "bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 border-b border-indigo-100 dark:border-indigo-900/30"
                                                )}
                                                onClick={() => admissionData?.data?.bill_created === 1 && setIsFinalBillOpen(!isFinalBillOpen)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "p-1.5 rounded-lg",
                                                        admissionData?.data?.final_bill_created_date ? "bg-green-500" : "bg-indigo-500"
                                                    )}>
                                                        {admissionData?.data?.final_bill_created_date
                                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                            : <Receipt className="h-3.5 w-3.5 text-white" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold leading-none">2. Final Bill</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Finalize and lock billing</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                        admissionData?.data?.final_bill_created_date
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                            : admissionData?.data?.bill_created === 1
                                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                    )}>
                                                        {admissionData?.data?.final_bill_created_date ? "Done" : admissionData?.data?.bill_created === 1 ? "Pending" : "Locked"}
                                                    </span>
                                                    {admissionData?.data?.bill_created === 1 && (
                                                        isFinalBillOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            {isFinalBillOpen && admissionData?.data?.bill_created === 1 && (
                                                <CardContent className="p-4">
                                                    {admissionData?.data?.final_bill_created_date ? (
                                                        <div className="space-y-3">
                                                            <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                                                                <p className="font-semibold flex items-center gap-1.5 mb-1">
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Final Bill Created
                                                                </p>
                                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                                    Created on {safeFormatDate(admissionData.data.final_bill_created_date)}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => {
                                                                        setIsEditingFinalBill(false)
                                                                        setOpenFinalBillDialog(true)
                                                                    }}
                                                                    variant="outline"
                                                                    className="flex-1 text-sm h-9"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                                                    View Final Bill
                                                                </Button>
                                                                <Button
                                                                    onClick={() => {
                                                                        const initialDiscounts: Record<string, number> = {}
                                                                        const existingDoctorId = finalBill?.discounted_by_doctor_id
                                                                            ? String(finalBill.discounted_by_doctor_id)
                                                                            : ''
                                                                        const existingNotes = finalBill?.notes || ''
                                                                        
                                                                        if (finalBill?.items) {
                                                                            finalBill.items.forEach((item: any) => {
                                                                                initialDiscounts[item.id] = Number(item.total_discount) || 0
                                                                            })
                                                                        }
                                                                        setRowDiscounts(initialDiscounts)
                                                                        setSelectedDoctorId(existingDoctorId)
                                                                        setDiscountNotes(existingNotes)
                                                                        setIsEditingFinalBill(true)
                                                                        setOpenFinalBillDialog(true)
                                                                    }}
                                                                    variant="outline"
                                                                    className="flex-1 text-sm h-9 border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800 text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                                                    Edit Final Bill
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                                <span className="text-xs font-medium text-indigo-800 dark:text-indigo-300">Gross Amount</span>
                                                                <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{format(gridGross)}</span>
                                                            </div>
                                                            {gridDiscount > 0 && (
                                                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                                                    <span className="text-xs font-medium text-green-800 dark:text-green-300">After Discount</span>
                                                                    <span className="text-sm font-extrabold text-green-700 dark:text-green-300">{format(gridNet)}</span>
                                                                </div>
                                                            )}
                                                            <Button
                                                                onClick={() => {
                                                                    setIsEditingFinalBill(false)
                                                                    setOpenFinalBillDialog(true)
                                                                }}
                                                                disabled={gridGross === 0}
                                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-9"
                                                            >
                                                                <Receipt className="h-3.5 w-3.5 mr-2" />
                                                                {gridDiscount > 0 ? 'Review & Finalize' : 'Create Final Bill'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>

                                        {/* Transactions Ledger */}
                                        <Card className="overflow-hidden shadow-none border p-0">
                                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-0 bg-gradient-to-r from-indigo-50/60 to-slate-50/40 dark:from-indigo-950/20 dark:to-slate-950/10 border-b border-indigo-100 dark:border-indigo-900/30">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-indigo-500">
                                                        <Receipt className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold leading-none">Transactions</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Ledger &amp; running due</p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap",
                                                    currentRunning > 0
                                                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                                        : currentRunning < 0
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                )}>
                                                    {currentRunning > 0 ? `Due ${formatNumber(currentRunning)}` : currentRunning < 0 ? `Bal ${formatNumber(Math.abs(currentRunning))}` : 'Settled'}
                                                </span>
                                            </CardHeader>
                                            <CardContent className="p-3 space-y-3">
                                                {transactions.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground text-center py-4">No transactions yet.</p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {transactions.map((t: any) => (
                                                            <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className={cn(
                                                                        "h-2 w-2 rounded-full flex-shrink-0",
                                                                        t.kind === 'charge' ? 'bg-indigo-500' : 'bg-emerald-500'
                                                                    )} />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-semibold truncate">{t.label}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{formatDateTime(t.date)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex-shrink-0">
                                                                    <p className={cn(
                                                                        "text-xs font-bold",
                                                                        t.kind === 'charge' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
                                                                    )}>
                                                                        {t.kind === 'charge' ? '+' : '−'}{formatNumber(t.amount)}
                                                                    </p>
                                                                    <p className={cn(
                                                                        "text-[10px] font-medium",
                                                                        t.running > 0 ? 'text-orange-600' : t.running < 0 ? 'text-emerald-600' : 'text-muted-foreground'
                                                                    )}>
                                                                        {t.running > 0 ? `Due ${formatNumber(t.running)}` : t.running < 0 ? `Bal ${formatNumber(Math.abs(t.running))}` : 'Settled'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Summary footer */}
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Billed</p>
                                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{formatNumber(txnBilled)}</p>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Paid</p>
                                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(txnPaid)}</p>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Due</p>
                                                        <p className="text-xs font-bold text-orange-700 dark:text-orange-300">{formatNumber(Math.max(0, currentRunning))}</p>
                                                    </div>
                                                </div>

                                                {/* Actions: Advance (any) · Payment (≤ due) · Refund (≤ refundable) */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button
                                                        onClick={() => { setTxnAmount(0); setTxnNotes(''); setTxnDate(toISODate(new Date())); setTxnDialogMode('advance') }}
                                                        disabled={!!admissionData?.data?.final_bill_created_date}
                                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Advance
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setTxnAmount(maxPayment); setTxnNotes(''); setTxnDate(toISODate(new Date())); setTxnDialogMode('payment') }}
                                                        disabled={maxPayment <= 0}
                                                        className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                                                    >
                                                        <DollarSign className="h-3 w-3 mr-1" /> Payment
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setTxnAmount(maxRefund); setTxnNotes(''); setTxnDialogMode('refund') }}
                                                        disabled={maxRefund <= 0}
                                                        className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs"
                                                    >
                                                        <Repeat className="h-3 w-3 mr-1" /> Refund
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* CARD 4: Discharge Patient */}
                                        <Card className={cn(
                                            "overflow-hidden shadow-none border transition-all p-0",
                                            admissionData?.data?.status === 'discharged'
                                                ? "border-green-200 dark:border-green-800/60 bg-green-50/30 dark:bg-green-950/10"
                                                : admissionData?.data?.final_bill_created_date
                                                    ? "border-orange-200 dark:border-orange-800/60"
                                                    : "border-gray-200 dark:border-gray-800/60 opacity-60"
                                        )}>
                                            <CardHeader
                                                className={cn(
                                                    "py-3 px-4 flex flex-row items-center justify-between gap-0",
                                                    admissionData?.data?.final_bill_created_date ? "cursor-pointer select-none" : "cursor-not-allowed select-none",
                                                    admissionData?.data?.status === 'discharged'
                                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-b border-green-100 dark:border-green-900/40"
                                                        : "bg-gradient-to-r from-orange-50/60 to-amber-50/40 dark:from-orange-950/20 dark:to-amber-950/10 border-b border-orange-100 dark:border-orange-900/30"
                                                )}
                                                onClick={() => admissionData?.data?.final_bill_created_date && setIsDischargeOpen(!isDischargeOpen)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "p-1.5 rounded-lg",
                                                        admissionData?.data?.status === 'discharged' ? "bg-green-500" : "bg-orange-500"
                                                    )}>
                                                        {admissionData?.data?.status === 'discharged'
                                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                            : <DoorOpen className="h-3.5 w-3.5 text-white" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold leading-none">4. Discharge</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Release patient from hospital</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                        admissionData?.data?.status === 'discharged'
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                            : admissionData?.data?.final_bill_created_date
                                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                    )}>
                                                        {admissionData?.data?.status === 'discharged' ? "Done" : admissionData?.data?.final_bill_created_date ? "Pending" : "Locked"}
                                                    </span>
                                                    {admissionData?.data?.final_bill_created_date && (
                                                        isDischargeOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            {isDischargeOpen && admissionData?.data?.final_bill_created_date && (
                                                <CardContent className="p-4">
                                                    {admissionData?.data?.status === 'discharged' ? (
                                                        <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                                                            <p className="font-semibold flex items-center gap-1.5 mb-1">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Patient Discharged
                                                            </p>
                                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                                Discharged on {admissionData.data.discharge_date ? safeFormatDate(admissionData.data.discharge_date) : 'N/A'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <p className="text-xs text-muted-foreground">
                                                                Formally discharge the patient and release the bed/cabin.
                                                            </p>
                                                            <Button
                                                                onClick={() => setOpenDischargeDialog(true)}
                                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm h-9"
                                                            >
                                                                <DoorOpen className="h-3.5 w-3.5 mr-2" />
                                                                Discharge Patient
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>

                                        {/* CARD 4: Distribute Bill */}
                                        <Card className={cn(
                                            "overflow-hidden shadow-none border transition-all p-0",
                                            distributionsData?.data?.length > 0
                                                ? "border-green-200 dark:border-green-800/60 bg-green-50/30 dark:bg-green-950/10"
                                                : admissionData?.data?.final_bill_created_date
                                                    ? "border-purple-200 dark:border-purple-800/60"
                                                    : "border-gray-200 dark:border-gray-800/60 opacity-60"
                                        )}>
                                            <CardHeader
                                                className={cn(
                                                    "py-3 px-4 flex flex-row items-center justify-between gap-0",
                                                    admissionData?.data?.final_bill_created_date ? "cursor-pointer select-none" : "cursor-not-allowed select-none",
                                                    distributionsData?.data?.length > 0
                                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-b border-green-100 dark:border-green-900/40"
                                                        : "bg-gradient-to-r from-purple-50/60 to-violet-50/40 dark:from-purple-950/20 dark:to-violet-950/10 border-b border-purple-100 dark:border-purple-900/30"
                                                )}
                                                onClick={() => admissionData?.data?.final_bill_created_date && setIsDistributeOpen(!isDistributeOpen)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "p-1.5 rounded-lg",
                                                        distributionsData?.data?.length > 0 ? "bg-green-500" : "bg-purple-500"
                                                    )}>
                                                        {distributionsData?.data?.length > 0
                                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                            : <DollarSign className="h-3.5 w-3.5 text-white" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold leading-none">5. Distribute</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Distribute payables to providers</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                        distributionsData?.data?.length > 0
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                            : admissionData?.data?.final_bill_created_date
                                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                    )}>
                                                        {distributionsData?.data?.length > 0
                                                            ? `${distributionsData.data.length} entries`
                                                            : admissionData?.data?.final_bill_created_date ? "Pending" : "Locked"}
                                                    </span>
                                                    {admissionData?.data?.final_bill_created_date && (
                                                        isDistributeOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            {isDistributeOpen && admissionData?.data?.final_bill_created_date && (
                                                <CardContent className="p-4 space-y-4">
                                                    <p className="text-xs text-muted-foreground">
                                                        Distribute the final bill amount to surgeons, consultants, and other providers. You can create multiple distributions over time.
                                                    </p>

                                                    {/* Existing Distributions */}
                                                    {distributionsData?.data?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Distributions</p>
                                                            {distributionsData.data.map((dist: any) => (
                                                                <div key={dist.id} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 text-sm">
                                                                    <div>
                                                                        <p className="font-semibold text-xs">{dist.service_provided_by}</p>
                                                                        <p className="text-[11px] text-muted-foreground">
                                                                            Payable: {format(Number(dist.final_bill))} · Paid: {format(Number(dist.pay_now || 0))}
                                                                        </p>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                                        Number(dist.due_amount) <= 0
                                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                                                    )}>
                                                                        {Number(dist.due_amount) <= 0 ? "Paid" : `Due: ${format(Number(dist.due_amount))}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Distribute Action */}
                                                    <Button
                                                        onClick={() => setOpenDistributeDialog(true)}
                                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9"
                                                    >
                                                        <DollarSign className="h-3.5 w-3.5 mr-2" />
                                                        {distributionsData?.data?.length > 0 ? "Add More Distribution" : "Distribute Bill"}
                                                    </Button>
                                                </CardContent>
                                            )}
                                        </Card>

                                    </div>{/* ===== END RIGHT COLUMN ===== */}

                                </div>{/* ===== END TWO-COLUMN GRID ===== */}

                            </div>
                        </Form>
                    </div>

                    {/* Dialogs - These are siblings to the billing content, inside max-w-full div */}

                    {/* Bed Status Board Dialog */}
                    <Dialog open={isBoardOpen} onOpenChange={setIsBoardOpen}>
                        <DialogContent className="sm:max-w-[850px] max-w-[850px] w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Bed className="h-5 w-5 text-blue-500" />
                                    <span>Bed & Cabin Status Board</span>
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Real-time occupancy status. Select an available bed to change to.
                                </p>
                            </DialogHeader>

                            {/* Search & Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between my-5">
                                <div className="relative w-full sm:flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by code, ward, or type..."
                                        value={boardSearch}
                                        onChange={(e) => setBoardSearch(e.target.value)}
                                        className="pl-9 h-10 w-full rounded-xl"
                                    />
                                </div>
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={boardFilter}
                                        onValueChange={(val: any) => setBoardFilter(val)}
                                    >
                                        <SelectTrigger className="w-full h-10 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 font-medium text-sm">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Beds</SelectItem>
                                            <SelectItem value="free">Available (Free)</SelectItem>
                                            <SelectItem value="booked">Occupied (Booked)</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Grid Layout of Beds */}
                            {allBedsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <span className="text-sm font-medium text-muted-foreground">Loading status board...</span>
                                </div>
                            ) : filteredBoardBeds.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed rounded-2xl border-gray-200 dark:border-gray-800 w-full">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-muted-foreground">No beds match your filter/search criteria.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-150 dark:border-gray-800 w-full">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-gray-50/70 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold border-b border-gray-150 dark:border-gray-800">
                                            <tr>
                                                <th className="px-4 py-3">Bed / Cabin Code</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Ward / Department</th>
                                                <th className="px-4 py-3">Price / Day</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                            {filteredBoardBeds.map((bed: any) => {
                                                const statusKey = String(bed.status || 'Available').toLowerCase().trim();
                                                const isAvailable = statusKey === 'available' || statusKey === 'free';
                                                const isOccupied = statusKey === 'occupied' || statusKey === 'booked';
                                                const isMaintenance = statusKey === 'maintenance';

                                                return (
                                                    <tr
                                                        key={bed.id}
                                                        className={cn(
                                                            "hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors",
                                                            isAvailable && "bg-green-50/5 dark:bg-green-950/2",
                                                            isOccupied && "bg-red-50/5 dark:bg-red-950/2",
                                                            isMaintenance && "bg-amber-50/5 dark:bg-amber-950/2"
                                                        )}
                                                    >
                                                        <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">{bed.code}</td>
                                                        <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">{bed.type}</td>
                                                        <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 font-medium">{bed.ward}</td>
                                                        <td className="px-4 py-3.5 font-semibold text-blue-600 dark:text-blue-400">{format(Number(bed.price))}</td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                                isAvailable && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
                                                                isOccupied && "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
                                                                isMaintenance && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                                                            )}>
                                                                {isAvailable ? 'Free' : isOccupied ? 'Booked' : 'Maintenance'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={isAvailable ? "default" : "outline"}
                                                                className={cn(
                                                                    "h-8 rounded-lg text-xs font-bold px-3 transition-all",
                                                                    isAvailable
                                                                        ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600"
                                                                        : "opacity-60 pointer-events-none"
                                                                )}
                                                                disabled={!isAvailable}
                                                                onClick={() => {
                                                                    setSelectedNewBedId(String(bed.id));
                                                                    setIsBoardOpen(false);
                                                                }}
                                                            >
                                                                Select
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Bed History Details Dialog */}
                    {selectedBedHistory && (
                        <Dialog open={!!selectedBedHistory} onOpenChange={() => setSelectedBedHistory(null)}>
                            <DialogContent className="sm:max-w-[600px]">
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
                                                {safeFormatDate(selectedBedHistory.from)} {selectedBedHistory.assigned_time || ''}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">To Date</label>
                                            <p className="font-semibold text-sm">
                                                {selectedBedHistory.to
                                                    ? `${safeFormatDate(selectedBedHistory.to)} ${selectedBedHistory.released_time || ''}`
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
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-0">
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
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedBedHistory.status === 'active'
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
                        <DialogContent className="sm:max-w-[750px] w-[95vw] sm:w-[750px] max-h-[90vh] overflow-y-auto">
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
                                    const data = {
                                        bed_cabin_id: Number(selectedNewBedId),
                                        notes: new FormData(e.currentTarget).get('notes') as string || undefined,
                                        change_date: new FormData(e.currentTarget).get('change_date') as string,
                                        change_time: new FormData(e.currentTarget).get('change_time') as string,
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select New Bed/Cabin *</label>
                                            <Popover open={isBedDropdownOpen} onOpenChange={setIsBedDropdownOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between !h-auto min-h-9 !whitespace-normal py-1.5 text-left font-normal border-input"
                                                    >
                                                        {selectedNewBedId ? (
                                                            (() => {
                                                                const selectedBed = bedsCabins.find((b: any) => String(b.id) === selectedNewBedId);
                                                                return selectedBed
                                                                    ? `${selectedBed.code} (${selectedBed.type}) - ${selectedBed.ward} - ${format(selectedBed.price)}/day`
                                                                    : "Select bed/cabin";
                                                            })()
                                                        ) : (
                                                            <span className="text-muted-foreground">Select bed/cabin</span>
                                                        )}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[330px] p-0" align="start">
                                                    <div className="p-3 space-y-3 border-b">
                                                        {/* Filter Options (Tabs/Buttons) */}
                                                        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 w-full">
                                                            {(['All', 'Bed', 'Cabin'] as const).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    type="button"
                                                                    className={cn(
                                                                        "flex-1 text-xs py-1 rounded-md transition-all font-medium",
                                                                        bedTypeFilter === type
                                                                            ? "bg-white dark:bg-gray-700 shadow-sm text-foreground"
                                                                            : "text-muted-foreground hover:text-foreground"
                                                                    )}
                                                                    onClick={() => setBedTypeFilter(type)}
                                                                >
                                                                    {type === 'All' ? 'All Types' : type === 'Bed' ? 'Beds' : 'Cabins'}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Search Input */}
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Search code or ward..."
                                                                value={bedSearchQuery}
                                                                onChange={(e) => setBedSearchQuery(e.target.value)}
                                                                className="pl-8 h-8 text-xs focus-visible:ring-1"
                                                            />
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="h-[200px]">
                                                        <div className="p-1">
                                                            {(() => {
                                                                const filteredBeds = bedsCabins.filter((bed: any) => {
                                                                    if (bed.status !== 'Available') return false;

                                                                    // Type filter
                                                                    if (bedTypeFilter !== 'All' && bed.type !== bedTypeFilter) return false;

                                                                    // Search filter
                                                                    if (bedSearchQuery) {
                                                                        const search = bedSearchQuery.toLowerCase();
                                                                        const codeMatch = bed.code?.toLowerCase().includes(search);
                                                                        const typeMatch = bed.type?.toLowerCase().includes(search);
                                                                        const wardMatch = bed.ward?.toLowerCase().includes(search);
                                                                        return codeMatch || typeMatch || wardMatch;
                                                                    }
                                                                    return true;
                                                                });

                                                                if (filteredBeds.length === 0) {
                                                                    return (
                                                                        <div className="py-6 text-center text-xs text-muted-foreground">
                                                                            No available beds found
                                                                        </div>
                                                                    );
                                                                }

                                                                return filteredBeds.map((bed: any) => (
                                                                    <button
                                                                        key={bed.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full text-left flex flex-col gap-0.5 px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors",
                                                                            selectedNewBedId === String(bed.id) && "bg-accent font-medium"
                                                                        )}
                                                                        onClick={() => {
                                                                            setSelectedNewBedId(String(bed.id));
                                                                            setIsBedDropdownOpen(false);
                                                                            setBedSearchQuery('');
                                                                        }}
                                                                    >
                                                                        <div className="flex justify-between items-center w-full">
                                                                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                                                {bed.code} ({bed.type})
                                                                            </span>
                                                                            <span className="text-gray-500 font-medium">
                                                                                {format(bed.price)}/day
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-muted-foreground text-[10px]">
                                                                            {bed.ward}
                                                                        </span>
                                                                    </button>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </ScrollArea>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full h-9 flex items-center justify-center gap-1.5"
                                                onClick={() => setIsBoardOpen(true)}
                                                title="View Bed Status Board"
                                            >
                                                <LayoutGrid className="h-4 w-4 text-blue-500" />
                                                <span>Status Board</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <label className="text-sm font-medium">Change Date *</label>
                                            <DateField
                                                value={changeBedDate}
                                                onChange={setChangeBedDate}
                                                className="w-full h-10"
                                            />
                                            <input
                                                type="hidden"
                                                name="change_date"
                                                value={changeBedDate}
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
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <label className="text-sm font-medium">From Date *</label>
                                            <DateField
                                                value={bedBillingFromDate}
                                                onChange={setBedBillingFromDate}
                                                className="w-full h-10"
                                            />
                                            <input
                                                type="hidden"
                                                name="from_date"
                                                value={bedBillingFromDate}
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
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <label className="text-sm font-medium">To Date *</label>
                                            <DateField
                                                value={bedBillingToDate}
                                                onChange={setBedBillingToDate}
                                                className="w-full h-10"
                                            />
                                            <input
                                                type="hidden"
                                                name="to_date"
                                                value={bedBillingToDate}
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
                                        <label className="text-sm font-medium">Daily Rate ({currencySymbol}) *</label>
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
                                        <label className="text-sm font-medium">Total Amount ({currencySymbol}) *</label>
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
                    {/* Final Bill Modal (editable grid before lock, read-only after) */}
                    <Dialog open={openFinalBillDialog} onOpenChange={setOpenFinalBillDialog}>
                        <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-indigo-600" />
                                    Final Bill
                                </DialogTitle>
                                <DialogDescription>
                                    {admissionData?.data?.final_bill_created_date
                                        ? 'The final bill is locked. Discounts cannot be changed after creation.'
                                        : 'Adjust the discount on any line, then create the final bill.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-2">
                                {(!admissionData?.data?.final_bill_created_date || isEditingFinalBill) && (billGridRows.length > 0 || (finalBill?.items && finalBill.items.length > 0)) && (
                                    <div className="flex justify-between items-center px-1 py-0.5">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {(!admissionData?.data?.final_bill_created_date || isEditingFinalBill) ? 'Drag handle next to description to reorder services' : 'Bill Line Items'}
                                        </span>
                                    </div>
                                )}

                                {(admissionData?.data?.final_bill_created_date ? displayFinalBillItems.length : billGridRows.length) === 0 ? (
                                    <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                                        No billable charges yet. Add services first.
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/60 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                            <div className="col-span-1 text-center">SL</div>
                                            <div className="col-span-5">Line</div>
                                            <div className="col-span-2 text-right">Amount ({currencySymbol})</div>
                                            <div className="col-span-2 text-right">Discount ({currencySymbol})</div>
                                            <div className="col-span-2 text-right">Net ({currencySymbol})</div>
                                        </div>

                                        {admissionData?.data?.final_bill_created_date ? (
                                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                <DndContext
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event: DragEndEvent) => {
                                                        const { active, over } = event
                                                        if (over && active.id !== over.id) {
                                                            setCustomFinalBillItemsOrder((prev) => {
                                                                const items = prev ? [...prev] : [...displayFinalBillItems]
                                                                const oldIndex = items.findIndex((item) => String(item.id) === String(active.id))
                                                                const newIndex = items.findIndex((item) => String(item.id) === String(over.id))
                                                                if (oldIndex !== -1 && newIndex !== -1) {
                                                                    return arrayMove(items, oldIndex, newIndex)
                                                                }
                                                                return items
                                                            })
                                                        }
                                                    }}
                                                >
                                                    <SortableContext
                                                        items={displayFinalBillItems.map(it => String(it.id))}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {displayFinalBillItems.map((it: any, idx: number) => (
                                                            <SortableDialogRow
                                                                key={String(it.id)}
                                                                id={String(it.id)}
                                                                idx={idx}
                                                                label={it.service_name}
                                                                amount={Number(it.total_amount)}
                                                                discount={Number(rowDiscounts[it.id]) || 0}
                                                                onChangeDiscount={
                                                                    isEditingFinalBill
                                                                        ? (val) => setRowDiscounts((prev) => ({ ...prev, [it.id]: val }))
                                                                        : undefined
                                                                }
                                                                isPending={updateFinalBillMutation.isPending}
                                                                isEditable={isEditingFinalBill}
                                                                formatNumber={formatNumber}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                <DndContext
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event: DragEndEvent) => {
                                                        const { active, over } = event
                                                        if (over && active.id !== over.id) {
                                                            setCustomRowOrderKeys((prev) => {
                                                                const items = prev ? [...prev] : sortedBillGridRows.map(r => r.key)
                                                                const oldIndex = items.indexOf(String(active.id))
                                                                const newIndex = items.indexOf(String(over.id))
                                                                if (oldIndex !== -1 && newIndex !== -1) {
                                                                    return arrayMove(items, oldIndex, newIndex)
                                                                }
                                                                return items
                                                            })
                                                        }
                                                    }}
                                                >
                                                    <SortableContext
                                                        items={sortedBillGridRows.map(row => String(row.key))}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {sortedBillGridRows.map((row, idx) => (
                                                            <SortableDialogRow
                                                                key={String(row.key)}
                                                                id={String(row.key)}
                                                                idx={idx}
                                                                label={row.label}
                                                                amount={row.amount}
                                                                discount={Number(rowDiscounts[row.key]) || 0}
                                                                onChangeDiscount={(val) => setRowDiscounts((prev) => ({ ...prev, [row.key]: val }))}
                                                                isPending={finalizeWithDiscountMutation.isPending}
                                                                isEditable={true}
                                                                formatNumber={formatNumber}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/60 text-sm font-semibold border-t">
                                            <div className="col-span-6">Total</div>
                                            <div className="col-span-2 text-right">
                                                {formatNumber(
                                                    admissionData?.data?.final_bill_created_date
                                                        ? (isEditingFinalBill ? finalBillGross : Number(finalBill?.total_bill_amount || 0))
                                                        : gridGross
                                                )}
                                            </div>
                                            <div className="col-span-2 text-right text-orange-600">
                                                {formatNumber(
                                                    admissionData?.data?.final_bill_created_date
                                                        ? (isEditingFinalBill ? finalBillDiscount : Number(finalBill?.total_discount || 0))
                                                        : gridDiscount
                                                )}
                                            </div>
                                            <div className="col-span-2 text-right text-green-700 dark:text-green-300">
                                                {formatNumber(
                                                    admissionData?.data?.final_bill_created_date
                                                        ? (isEditingFinalBill ? finalBillNetVal : Number(finalBill?.total_discounted_amount || 0))
                                                        : gridNet
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(!admissionData?.data?.final_bill_created_date || isEditingFinalBill) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 animate-in fade-in duration-200 mt-3">
                                        <div className="space-y-1.5 flex flex-col justify-start">
                                            <Label htmlFor="auth-doctor" className="text-xs font-semibold">Authorizing Doctor (Discounted By)</Label>
                                            <Popover open={isDoctorDropdownOpen} onOpenChange={setIsDoctorDropdownOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="auth-doctor"
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={isDoctorDropdownOpen}
                                                        className="w-full justify-between h-9 text-xs bg-white dark:bg-slate-950 font-normal"
                                                    >
                                                        {selectedDoctorId ? (
                                                            <span>Dr. {doctors.find((d: any) => String(d.id) === selectedDoctorId)?.doctor_name}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Select Authorizing Doctor</span>
                                                        )}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command
                                                        filter={(value, search) => {
                                                            if (!search) return 1;
                                                            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                                                        }}
                                                    >
                                                        <CommandInput placeholder="Search doctor..." className="h-8 text-xs" value={doctorSearchQuery} onValueChange={setDoctorSearchQuery} />
                                                        <CommandList className="max-h-[200px]">
                                                            <CommandEmpty>No doctor found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {doctors.map((doctor: any) => (
                                                                    <CommandItem
                                                                        key={doctor.id}
                                                                        value={`${doctor.doctor_name} ${doctor.id}`}
                                                                        onSelect={() => {
                                                                            setSelectedDoctorId(String(doctor.id))
                                                                            setIsDoctorDropdownOpen(false)
                                                                            setDoctorSearchQuery('')
                                                                        }}
                                                                        className="text-xs py-1.5 px-3 cursor-pointer"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-3.5 w-3.5 shrink-0",
                                                                                String(doctor.id) === selectedDoctorId ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        Dr. {doctor.doctor_name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="disc-notes" className="text-xs font-semibold">Bill Notes / Remarks</Label>
                                            <Textarea
                                                id="disc-notes"
                                                placeholder="Enter final bill notes or remarks..."
                                                value={discountNotes}
                                                onChange={(e) => setDiscountNotes(e.target.value)}
                                                rows={2}
                                                className="text-xs resize-none bg-white dark:bg-slate-950 min-h-[36px] py-1.5 h-[36px]"
                                            />
                                        </div>
                                    </div>
                                )}
 
                                {admissionData?.data?.final_bill_created_date && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                                <span className="text-muted-foreground">Paid</span>
                                                <span className="font-semibold text-green-700 dark:text-green-300">{format(Number(finalBill?.paid_amount || 0))}</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                                <span className="text-muted-foreground">Due</span>
                                                <span className="font-semibold text-orange-700 dark:text-orange-300">{format(Number(finalBill?.due_amount || 0))}</span>
                                            </div>
                                        </div>
                                        {!isEditingFinalBill && (finalBill?.discountDoctor?.doctor_name || finalBill?.notes) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 text-xs mt-3">
                                                {finalBill?.discountDoctor?.doctor_name && (
                                                    <div className="space-y-1">
                                                        <span className="font-semibold text-muted-foreground block">Authorizing Doctor (Discounted By)</span>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">Dr. {finalBill.discountDoctor.doctor_name}</p>
                                                    </div>
                                                )}
                                                {finalBill?.notes && (
                                                    <div className="space-y-1">
                                                        <span className="font-semibold text-muted-foreground block">Bill Notes / Remarks</span>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{finalBill.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setOpenFinalBillDialog(false)}
                                    disabled={finalizeWithDiscountMutation.isPending || updateFinalBillMutation.isPending || updateFinalBillOrderMutation.isPending}
                                >
                                    {admissionData?.data?.final_bill_created_date && !isEditingFinalBill ? 'Close' : 'Cancel'}
                                </Button>
                                
                                {isEditingFinalBill && admissionData?.data?.final_bill_created_date ? (
                                    <>
                                        <Button
                                            onClick={() => updateFinalBillOrderMutation.mutate()}
                                            disabled={updateFinalBillOrderMutation.isPending || updateFinalBillMutation.isPending}
                                            variant="outline"
                                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                                        >
                                            {updateFinalBillOrderMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Ordering...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                                    Update Order
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => updateFinalBillMutation.mutate()}
                                            disabled={updateFinalBillMutation.isPending || updateFinalBillOrderMutation.isPending}
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {updateFinalBillMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Confirm Final Bill
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : !admissionData?.data?.final_bill_created_date ? (
                                    <Button
                                        onClick={() => finalizeWithDiscountMutation.mutate()}
                                        disabled={gridGross === 0 || finalizeWithDiscountMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {finalizeWithDiscountMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Receipt className="h-4 w-4 mr-2" />
                                                Create Final Bill
                                            </>
                                        )}
                                    </Button>
                                ) : null}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Transaction (Advance / Payment / Refund) Dialog */}
                    <Dialog open={txnDialogMode !== null} onOpenChange={(open) => { if (!open) setTxnDialogMode(null) }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {txnDialogMode === 'advance'
                                        ? <Plus className="h-5 w-5 text-emerald-600" />
                                        : txnDialogMode === 'refund'
                                            ? <Repeat className="h-5 w-5 text-rose-600" />
                                            : <DollarSign className="h-5 w-5 text-green-600" />}
                                    {txnDialogMode === 'advance' ? 'Add Advance' : txnDialogMode === 'refund' ? 'Refund Overpayment' : 'Add Payment'}
                                </DialogTitle>
                                <DialogDescription>
                                    {txnDialogMode === 'advance'
                                        ? 'Record an advance payment before the final bill is created.'
                                        : txnDialogMode === 'refund'
                                            ? 'Refund the overpaid balance back to the patient.'
                                            : 'Record a payment against the due amount.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label>Amount ({currencySymbol}) *</Label>
                                        {txnDialogMode === 'payment' && <span className="text-[10px] text-muted-foreground">Max {formatNumber(maxPayment)}</span>}
                                        {txnDialogMode === 'refund' && <span className="text-[10px] text-muted-foreground">Max {formatNumber(maxRefund)}</span>}
                                    </div>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={txnDialogMode === 'payment' ? maxPayment : txnDialogMode === 'refund' ? maxRefund : undefined}
                                        value={txnAmount || ''}
                                        onChange={(e) => setTxnAmount(Number(e.target.value) || 0)}
                                        disabled={recordTxnMutation.isPending}
                                    />
                                    {txnDialogMode === 'payment' && txnAmount > maxPayment && (
                                        <p className="text-[10px] text-rose-600">Amount cannot exceed the due ({formatNumber(maxPayment)}).</p>
                                    )}
                                    {txnDialogMode === 'refund' && txnAmount > maxRefund && (
                                        <p className="text-[10px] text-rose-600">Amount cannot exceed the refundable ({formatNumber(maxRefund)}).</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label>Method</Label>
                                    <Select value={txnMethod} onValueChange={setTxnMethod}>
                                        <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="card">Card</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(txnDialogMode === 'advance' || txnDialogMode === 'payment') && (
                                    <div className="space-y-1">
                                        <Label>{txnDialogMode === 'advance' ? 'Advance Date' : 'Payment Date'}</Label>
                                        <DateField
                                            value={txnDate}
                                            onChange={setTxnDate}
                                            disabled={!txnDateChangeable || recordTxnMutation.isPending}
                                            className="w-full h-10"
                                        />
                                        {!txnDateChangeable && (
                                            <p className="text-[10px] text-muted-foreground">Locked to today by settings.</p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label>Notes</Label>
                                    <Input value={txnNotes} onChange={(e) => setTxnNotes(e.target.value)} placeholder="Optional" disabled={recordTxnMutation.isPending} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setTxnDialogMode(null)} disabled={recordTxnMutation.isPending}>Cancel</Button>
                                <Button
                                    onClick={() => recordTxnMutation.mutate()}
                                    disabled={!txnAmount || txnAmount <= 0 || recordTxnMutation.isPending || (txnDialogMode === 'payment' && txnAmount > maxPayment) || (txnDialogMode === 'refund' && txnAmount > maxRefund)}
                                    className={cn(
                                        'text-white',
                                        txnDialogMode === 'advance' ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : txnDialogMode === 'refund' ? 'bg-rose-600 hover:bg-rose-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                    )}
                                >
                                    {recordTxnMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                    {txnDialogMode === 'advance' ? 'Save Advance' : txnDialogMode === 'refund' ? 'Save Refund' : 'Save Payment'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Discharge Patient Dialog */}
                    <Dialog open={openDischargeDialog} onOpenChange={setOpenDischargeDialog}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <DoorOpen className="h-5 w-5 text-orange-600" />
                                    Discharge Patient
                                </DialogTitle>
                                <DialogDescription>
                                    Formally discharge the patient and release the bed/cabin. Nothing on this bill can be changed afterwards.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Discharge Date *</Label>
                                    <DateField value={dischargeDate} onChange={setDischargeDate} className="w-full h-10" />
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                    <p className="text-xs text-orange-800 dark:text-orange-300">
                                        Patient status will change to <strong>Discharged</strong>, the bed/cabin will be released, and all billing will be locked.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenDischargeDialog(false)} disabled={dischargePatientMutation.isPending}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => dischargePatientMutation.mutate()}
                                    disabled={dischargePatientMutation.isPending || !dischargeDate}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {dischargePatientMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Discharging...
                                        </>
                                    ) : (
                                        <>
                                            <DoorOpen className="h-4 w-4 mr-2" />
                                            Confirm Discharge
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Reorder Bill Items Dialog — drag to set the print/final-bill order */}
                    <Dialog open={openReorderDialog} onOpenChange={setOpenReorderDialog}>
                        <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    Reorder Bill Items
                                </DialogTitle>
                                <DialogDescription>
                                    Drag rows to set the order. It is applied to the printed/finalized bill.
                                </DialogDescription>
                            </DialogHeader>

                            {sortedBillGridRows.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No billable items yet.
                                </p>
                            ) : (
                                <div className="border rounded-md overflow-hidden">
                                    <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/60 text-[11px] font-bold uppercase tracking-wide text-muted-foreground border-b">
                                        <div className="col-span-1" />
                                        <div className="col-span-1 text-center">#</div>
                                        <div className="col-span-2">Category</div>
                                        <div className="col-span-3">Description</div>
                                        <div className="col-span-1 text-center">Qty</div>
                                        <div className="col-span-2 text-right">Rate ({currencySymbol})</div>
                                        <div className="col-span-2 text-right">Amount ({currencySymbol})</div>
                                    </div>
                                    <DndContext
                                        collisionDetection={closestCenter}
                                        onDragEnd={(event) => {
                                            const { active, over } = event
                                            if (!over || active.id === over.id) return
                                            const cur = orderKeysRef.current ?? sortedBillGridRows.map((r) => r.key)
                                            const oldIndex = cur.indexOf(String(active.id))
                                            const newIndex = cur.indexOf(String(over.id))
                                            if (oldIndex === -1 || newIndex === -1) return
                                            const next = arrayMove(cur, oldIndex, newIndex)
                                            setCustomRowOrderKeys(next)
                                            // persist the new serial order
                                            fetch(`${API_URL}/api/admission/${admissionId}/bill-item-order`, {
                                                method: 'PUT',
                                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ order: next }),
                                            }).catch(() => {})
                                        }}
                                    >
                                        <SortableContext
                                            items={sortedBillGridRows.map((r) => r.key)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {sortedBillGridRows.map((row, idx) => (
                                                <SortableReorderRow
                                                    key={row.key}
                                                    id={row.key}
                                                    idx={idx}
                                                    category={row.category}
                                                    label={row.label}
                                                    qty={row.qty}
                                                    rate={row.rate}
                                                    amount={row.amount}
                                                    formatNumber={formatNumber}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenReorderDialog(false)}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </Main>
        </>
    )
}

function SortableReorderRow({
    id,
    idx,
    category,
    label,
    qty,
    rate,
    amount,
    formatNumber,
}: {
    id: string
    idx: number
    category: string
    label: string
    qty: number
    rate: number
    amount: number
    formatNumber: (val: number) => string
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        zIndex: isDragging ? 50 : undefined,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "grid grid-cols-12 gap-2 items-center px-3 py-2.5 text-xs border-b last:border-b-0 bg-white dark:bg-slate-950",
                isDragging ? "opacity-60 bg-indigo-50/40" : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
            )}
        >
            <div className="col-span-1 flex items-center">
                <button
                    type="button"
                    className="cursor-grab text-muted-foreground hover:text-indigo-600 focus:outline-none p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            </div>
            <div className="col-span-1 text-center text-muted-foreground tabular-nums">{idx + 1}</div>
            <div className="col-span-2 font-semibold uppercase text-gray-700 dark:text-gray-300 truncate">{category}</div>
            <div className="col-span-3 font-medium truncate">{label}</div>
            <div className="col-span-1 text-center tabular-nums">{qty}</div>
            <div className="col-span-2 text-right tabular-nums text-muted-foreground">{formatNumber(rate)}</div>
            <div className="col-span-2 text-right tabular-nums font-semibold">{formatNumber(amount)}</div>
        </div>
    )
}

interface SortableDialogRowProps {
    id: string
    idx: number
    label: string
    amount: number
    discount: number
    onChangeDiscount?: (val: number) => void
    isPending?: boolean
    isEditable?: boolean
    formatNumber: (val: number) => string
}

function SortableDialogRow({
    id,
    idx,
    label,
    amount,
    discount,
    onChangeDiscount,
    isPending,
    isEditable = false,
    formatNumber,
}: SortableDialogRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        zIndex: isDragging ? 50 : undefined,
    }

    const net = amount - discount

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "grid grid-cols-12 gap-2 px-3 py-2 text-xs items-center transition-all bg-white dark:bg-slate-950 border-b last:border-b-0",
                isDragging ? "opacity-50 border-indigo-500 scale-[1.01] bg-indigo-50/10 dark:bg-indigo-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
            )}
        >
            <div className="col-span-1 flex items-center justify-center gap-1">
                {isEditable && (
                    <button
                        type="button"
                        className="cursor-grab text-muted-foreground hover:text-indigo-600 focus:outline-none p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </button>
                )}
                <span className="font-medium text-slate-500">{idx + 1}</span>
            </div>
            
            <div className="col-span-5 font-medium text-slate-800 dark:text-slate-200 truncate" title={label}>
                {label}
            </div>
            
            <div className="col-span-2 text-right text-slate-700 dark:text-slate-300">
                {formatNumber(amount)}
            </div>
            
            <div className="col-span-2 text-right">
                {isEditable && onChangeDiscount ? (
                    <Input
                        type="number"
                        min={0}
                        max={amount}
                        value={discount || ''}
                        onChange={(e) => {
                            const val = Math.min(amount, Math.max(0, Number(e.target.value) || 0))
                            onChangeDiscount(val)
                        }}
                        disabled={isPending}
                        className="h-7 text-right text-xs py-0.5 px-1.5 w-full bg-white dark:bg-slate-950"
                    />
                ) : (
                    <span className="text-orange-600">{formatNumber(discount)}</span>
                )}
            </div>
            
            <div className="col-span-2 text-right font-medium text-slate-900 dark:text-slate-100">
                {formatNumber(net)}
            </div>
        </div>
    )
}

