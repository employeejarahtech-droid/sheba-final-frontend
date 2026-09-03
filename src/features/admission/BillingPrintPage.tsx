import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useMemo, useState, useEffect, type CSSProperties } from 'react'
import { Loader2, ArrowLeft, Printer, Settings2, ChevronDown } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { useDateFormat } from '@/hooks/use-date-format'
import { useCurrency } from '@/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { amountToWords } from '@/lib/utils'

const API_URL = import.meta.env.VITE_API_URL || ''

type BillingPadding = { top: number; right: number; bottom: number; left: number }
const DEFAULT_PADDING: BillingPadding = { top: 32, right: 32, bottom: 32, left: 32 }

type BillingColumns = { sl: boolean; category: boolean; description: boolean; qty: boolean; rate: boolean }
const DEFAULT_COLUMNS: BillingColumns = { sl: true, category: true, description: true, qty: true, rate: true }
const COLUMN_LABELS: Record<keyof BillingColumns, string> = {
    sl: '#', category: 'Category', description: 'Description', qty: 'Qty/Days', rate: 'Rate',
}

// Paper sizes offered for printing this billing statement. `cssSize` feeds
// the @page size (browsers use this to pick/suggest the matching physical
// paper), and `margin` is tuned per size — the 80mm thermal option needs a
// near-zero margin since receipt printers have almost no physical border.
const PAPER_SIZES: Record<string, { label: string; cssSize: string; margin: string }> = {
    a4: { label: 'A4', cssSize: 'A4 portrait', margin: '12mm' },
    a5: { label: 'A5', cssSize: 'A5 portrait', margin: '8mm' },
    letter: { label: 'Letter', cssSize: 'letter portrait', margin: '12mm' },
    legal: { label: 'Legal', cssSize: 'legal portrait', margin: '12mm' },
    thermal80: { label: '80mm (Thermal)', cssSize: '80mm auto', margin: '2mm' },
}

// Overall scale for the billing statement content. Most cells/headings here
// use Tailwind text-size utilities (text-sm, text-xs, ...), which set their
// own explicit rem font-size and don't inherit a parent's font-size — so
// scaling via `zoom` (which resizes everything: text, padding, borders) is
// used instead of trying to override every element's own font size.
const FONT_SIZES: Record<string, { label: string; zoom: number }> = {
    sm: { label: 'Small', zoom: 0.85 },
    base: { label: 'Medium', zoom: 1 },
    lg: { label: 'Large', zoom: 1.15 },
    xl: { label: 'Extra Large', zoom: 1.3 },
}

type BillingData = {
    patient_name: string
    age: number
    sex: string
    phone: string
    age_text?: string | null
    admission_date: string
    discharge_date?: string | null
    bedCabin?: {
        code: string
        type: string
        ward: string
        price: number
    }
    doctor?: {
        doctor_name: string
    }
    diagnosis?: string
    bill_created_by_user?: { id: number; name: string } | null
    created_by_user?: { id: number; name: string } | null
}

type Operation = {
    id: number
    operation_type: string
    operation_date: string
    charges: number
}

type Consultant = {
    id: number
    consultant_name: string
    visit_date: string
    fees: number
}

type Surgeon = {
    id: number
    surgeon_name: string
    operation_date: string
    fees: number
}

type Assistant = {
    id: number
    assistant_name: string
    operation_date: string
    fees: number
}

type Service = {
    id: number
    service_name: string
    note: string
    amount: number
}

type BedBill = {
    id: number
    bed_code: string
    bed_type: string
    from_date: string
    to_date: string
    days: number
    rate_per_day: number
    total_amount: number
}

export function BillingPrintPage() {
    const { admissionId } = useParams({ from: '/_authenticated/dashboard/admission/patients/$admissionId/billing-print/' })
    const token = getCookie('accessToken')
    const { formatDate } = useDateFormat()
    const { format, currencySymbol, locale } = useCurrency()
    const queryClient = useQueryClient()

    const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('a4')
    const { cssSize, margin } = PAPER_SIZES[paperSize]
    const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('base')
    const [padding, setPadding] = useState<BillingPadding>(DEFAULT_PADDING)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<BillingColumns>(DEFAULT_COLUMNS)
    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length
    const toggleColumn = (key: keyof BillingColumns, checked: boolean) => {
        setVisibleColumns((prev) => {
            if (!checked && visibleColumnCount <= 1) return prev // keep at least one column visible
            return { ...prev, [key]: checked }
        })
    }

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

    const fmtNum = (val: number | string | null | undefined) => {
        const n = typeof val === 'string' ? parseFloat(val) : (val ?? 0)
        return isNaN(n) ? '0.00' : n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // Fetch admission details
    const { data: admissionData, isLoading: admissionLoading } = useQuery({
        queryKey: ['admission', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission')
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch company settings for company name, address and logo
    const { data: companySettings } = useQuery({
        queryKey: ["company-settings"],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch company settings");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token,
    })

    // Seed every print-setting control from the saved company-wide default once it loads.
    useEffect(() => {
        if (!companySettings) return
        setPadding({
            top: companySettings.billing_padding_top ?? DEFAULT_PADDING.top,
            right: companySettings.billing_padding_right ?? DEFAULT_PADDING.right,
            bottom: companySettings.billing_padding_bottom ?? DEFAULT_PADDING.bottom,
            left: companySettings.billing_padding_left ?? DEFAULT_PADDING.left,
        })
        if (companySettings.billing_font_size && companySettings.billing_font_size in FONT_SIZES) {
            setFontSize(companySettings.billing_font_size)
        }
        if (companySettings.billing_paper_size && companySettings.billing_paper_size in PAPER_SIZES) {
            setPaperSize(companySettings.billing_paper_size)
        }
        // JSON columns sometimes come back as a raw string rather than a
        // parsed object depending on the read path — handle both.
        const incomingColumns = typeof companySettings.billing_visible_columns === 'string'
            ? (() => { try { return JSON.parse(companySettings.billing_visible_columns) } catch { return null } })()
            : companySettings.billing_visible_columns
        if (incomingColumns && typeof incomingColumns === 'object' && !Array.isArray(incomingColumns)) {
            setVisibleColumns((prev) => {
                const next = { ...prev }
                for (const key of Object.keys(prev) as (keyof BillingColumns)[]) {
                    if (typeof incomingColumns[key] === 'boolean') next[key] = incomingColumns[key]
                }
                return next
            })
        }
    }, [companySettings])

    // Persist every print setting as the company-wide default — every billing
    // statement print (this one and every other) picks it up via /api/company-settings.
    const saveDefaultsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    billing_padding_top: padding.top,
                    billing_padding_right: padding.right,
                    billing_padding_bottom: padding.bottom,
                    billing_padding_left: padding.left,
                    billing_font_size: fontSize,
                    billing_paper_size: paperSize,
                    billing_visible_columns: visibleColumns,
                }),
            })
            if (!res.ok) throw new Error('Failed to save print settings')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Default print settings saved — applies to every billing statement print from now on')
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
        },
        onError: () => toast.error('Failed to save default print settings'),
    })

    // Fetch operations
    const { data: operationsData } = useQuery({
        queryKey: ['billing-operations', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/operations/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch consultants
    const { data: consultantsData } = useQuery({
        queryKey: ['billing-consultants', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/consultants/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch surgeons
    const { data: surgeonsData } = useQuery({
        queryKey: ['billing-surgeons', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/surgeons/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch assistants
    const { data: assistantsData } = useQuery({
        queryKey: ['billing-assistants', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/assistants/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch services
    const { data: servicesData } = useQuery({
        queryKey: ['billing-services', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/services/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch bed billing
    const { data: bedBillingData } = useQuery({
        queryKey: ['bed-billing', admissionId],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/billing/bed-cabins/admission/${admissionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return { data: [] }
                return res.json()
            } catch {
                return { data: [] }
            }
        },
        enabled: !!token && !!admissionId,
    })

    // Fetch bed charges
    const { data: bedChargesData } = useQuery({
        queryKey: ['bed-charges', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/bed-charges`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { data: { total: 0, breakdown: [] } }
            return res.json()
        },
        enabled: !!token && !!admissionId,
    })

    // User's saved drag-and-drop order (admissions.bill_item_order)
    const { data: billItemOrderData } = useQuery({
        queryKey: ['bill-item-order', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}/bill-item-order`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return { order: [] as string[] }
            const json = await res.json()
            return { order: Array.isArray(json?.data?.order) ? json.data.order : [] } as { order: string[] }
        },
        enabled: !!token && !!admissionId,
    })
    const billItemOrder: string[] = billItemOrderData?.order || []

    const admission = admissionData?.data as BillingData
    const finalBillItems = admissionData?.data?.finalBill?.items || []
    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${API_URL}${companySettings.company_logo}`
        : null;
    const companyName = companySettings?.company_name || 'Sheba Hospital';
    const operations = operationsData?.data || []
    const consultants = consultantsData?.data || []
    const surgeons = surgeonsData?.data || []
    const assistants = assistantsData?.data || []
    const services = servicesData?.data || []
    const bedBills = bedBillingData?.data || []
    const bedCharges = bedChargesData?.data || { total: 0, breakdown: [] }

    // Calculate totals - prefer final bill totals if available, otherwise calculate from individual items.
    // This is the PRELIMINARY billing statement, so it must show the bill
    // BEFORE any discount — total_bill_amount (gross), not
    // total_discounted_amount (net after discount, shown on the final bill).
    const finalBillTotals = finalBillItems.length > 0 ? {
        total: Number(admissionData?.data?.finalBill?.total_bill_amount ?? 0),
        paid: Number(admissionData?.data?.finalBill?.paid_amount || 0),
        due: Number(admissionData?.data?.finalBill?.due_amount || 0)
    } : null

    const totalBedCharges = finalBillTotals
        ? finalBillItems.filter((i: any) => i.service_type === 'bed_charges').reduce((sum: number, i: any) => sum + Number(i.final_amount || 0), 0)
        : bedBills.length > 0
            ? bedBills.reduce((sum: number, b: BedBill) => sum + Number(b.total_amount), 0)
            : bedCharges.total

    const totalOperations = finalBillTotals
        ? finalBillItems.filter((i: any) => i.service_type === 'operation').reduce((sum: number, i: any) => sum + Number(i.final_amount || 0), 0)
        : operations.reduce((sum: number, op: Operation) => sum + Number(op.charges), 0)

    const totalConsultants = finalBillTotals
        ? finalBillItems.filter((i: any) => i.service_type === 'consultant').reduce((sum: number, i: any) => sum + Number(i.final_amount || 0), 0)
        : consultants.reduce((sum: number, c: Consultant) => sum + Number(c.fees), 0)

    const totalSurgeons = finalBillTotals
        ? finalBillItems.filter((i: any) => i.service_type === 'surgeon').reduce((sum: number, i: any) => sum + Number(i.final_amount || 0), 0)
        : surgeons.reduce((sum: number, s: Surgeon) => sum + Number(s.fees), 0)

    const totalAssistants = finalBillTotals
        ? finalBillItems.filter((i: any) => i.service_type === 'assistant').reduce((sum: number, i: any) => sum + Number(i.final_amount || 0), 0)
        : assistants.reduce((sum: number, a: Assistant) => sum + Number(a.fees), 0)

    const totalServices = finalBillTotals
        ? finalBillItems.filter((i: any) => i.service_type === 'service').reduce((sum: number, i: any) => sum + Number(i.final_amount || 0), 0)
        : services.reduce((sum: number, s: Service) => sum + Number(s.amount), 0)

    const grandTotal = finalBillTotals
        ? finalBillTotals.total
        : totalBedCharges + totalOperations + totalConsultants + totalSurgeons + totalAssistants + totalServices

    const consolidatedItems = useMemo(() => {
        const list: {
            key?: string
            category: string
            description: string
            note?: string
            date?: string
            qty: number
            rate: number
            amount: number
            discount?: number
            serial_no?: number
        }[] = []

        // If final bill items exist, use them (they're already serialized and ordered)
        if (finalBillItems.length > 0) {
            finalBillItems.forEach((item: any) => {
                const serviceType = item.service_type || 'service'
                let category = 'Service'
                let description = item.service_name || 'Service'
                let date = undefined

                // Map service_type to category and extract relevant details
                switch (serviceType) {
                    case 'bed_charges':
                        category = 'Bed Charges'
                        // For bed charges, we need to fetch the details from the reference table
                        description = item.service_note || 'Bed Charges'
                        break
                    case 'operation':
                        category = 'Operation'
                        description = item.service_name || 'Operation'
                        break
                    case 'consultant':
                        category = 'Consultant'
                        description = item.service_name || 'Consultant'
                        break
                    case 'surgeon':
                        category = 'Surgeon'
                        description = item.service_name || 'Surgeon'
                        break
                    case 'assistant':
                        category = 'Assistant'
                        description = item.service_name || 'Assistant'
                        break
                    case 'service':
                        category = 'Clinical Service'
                        description = item.service_name || 'Service'
                        break
                    default:
                        category = 'Service'
                        description = item.service_name || 'Service'
                }

                list.push({
                    key: item.service_reference_table && item.service_reference_id
                        ? `${item.service_reference_table}:${item.service_reference_id}`
                        : undefined,
                    serial_no: item.serial_no || item.item_order || 0,
                    category,
                    description,
                    // Bed charges already use service_note as the description itself
                    // (the "N day(s) - from to" text) — repeating it as a note below
                    // would just show the same line twice.
                    note: serviceType === 'bed_charges' ? undefined : (item.service_note || undefined),
                    qty: Number(item.quantity) || 1,
                    rate: Number(item.unit_price) || 0,
                    amount: Number(item.final_amount) || 0,
                    discount: Number(item.total_discount) || 0
                })
            })

            // Sort by serial_no/item_order (already ordered from API, but ensure it)
            return list.sort((a, b) => (a.serial_no || 0) - (b.serial_no || 0))
        }

        // Fallback: If no final bill items, use individual billing queries
        // 1. Bed charges
        if (bedBills.length > 0) {
            bedBills.forEach((b: BedBill) => {
                list.push({
                    key: `indoor_billing_bed_cabin:${b.id}`,
                    serial_no: b.id || 0,
                    category: 'Bed Charges',
                    description: `${b.bed_code} (${b.bed_type})`,
                    date: `${safeFormatDate(b.from_date)} to ${safeFormatDate(b.to_date)}`,
                    qty: b.days,
                    rate: Number(b.rate_per_day),
                    amount: Number(b.total_amount)
                })
            })
        } else if (bedCharges?.breakdown?.length > 0) {
            bedCharges.breakdown.forEach((b: any) => {
                list.push({
                    key: `indoor_billing_bed_cabin:${b.id}`,
                    serial_no: b.id || 0,
                    category: 'Bed Charges',
                    description: `${b.bed_code} (${b.bed_type})`,
                    date: `${b.from ? safeFormatDate(b.from.split('T')[0]) : ''} to ${b.to ? safeFormatDate(b.to.split('T')[0]) : ''}`,
                    qty: b.days,
                    rate: Number(b.daily_rate),
                    amount: Number(b.charges)
                })
            })
        }

        // 2. Operations
        operations.forEach((op: Operation) => {
            list.push({
                key: `indoor_billing_operations:${op.id}`,
                serial_no: op.id || 0,
                category: 'Operation',
                description: op.operation_type,
                date: safeFormatDate(op.operation_date),
                qty: 1,
                rate: Number(op.charges),
                amount: Number(op.charges)
            })
        })

        // 3. Consultants
        consultants.forEach((c: Consultant) => {
            list.push({
                key: `indoor_billing_consultants:${c.id}`,
                serial_no: c.id || 0,
                category: 'Consultant',
                description: c.consultant_name,
                date: safeFormatDate(c.visit_date),
                qty: 1,
                rate: Number(c.fees),
                amount: Number(c.fees)
            })
        })

        // 4. Surgeons
        surgeons.forEach((s: Surgeon) => {
            list.push({
                key: `indoor_billing_surgeons:${s.id}`,
                serial_no: s.id || 0,
                category: 'Surgeon',
                description: s.surgeon_name,
                date: safeFormatDate(s.operation_date),
                qty: 1,
                rate: Number(s.fees),
                amount: Number(s.fees)
            })
        })

        // 5. Assistants
        assistants.forEach((a: Assistant) => {
            list.push({
                key: `indoor_billing_assistants:${a.id}`,
                serial_no: a.id || 0,
                category: 'Assistant',
                description: a.assistant_name,
                date: safeFormatDate(a.operation_date),
                qty: 1,
                rate: Number(a.fees),
                amount: Number(a.fees)
            })
        })

        // 6. Clinical Services
        services.forEach((s: Service) => {
            list.push({
                key: `indoor_billing_services:${s.id}`,
                serial_no: s.id || 0,
                category: 'Clinical Service',
                description: s.service_name,
                note: s.note,
                qty: 1,
                rate: Number(s.amount),
                amount: Number(s.amount)
            })
        })

        // Keep logical insertion order (bed → operation → consultant → …). SL is
        // rendered as a running index (idx + 1) in the table, so no sort needed.
        return list
    }, [admissionData, finalBillItems, bedBills, bedCharges, operations, consultants, surgeons, assistants, services, safeFormatDate])

    // Apply the user's saved drag-and-drop order (matches by item key).
    const orderedItems = useMemo(() => {
        if (!billItemOrder.length) return consolidatedItems
        const indexByKey = new Map(billItemOrder.map((k, i) => [k, i]))
        return [...consolidatedItems].sort((a, b) => {
            const ai = a.key ? indexByKey.get(a.key) : undefined
            const bi = b.key ? indexByKey.get(b.key) : undefined
            if (ai !== undefined && bi !== undefined) return ai - bi
            if (ai !== undefined) return -1
            if (bi !== undefined) return 1
            return 0
        })
    }, [consolidatedItems, billItemOrder])

    if (admissionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!admissionData?.data?.bill_created) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 mb-4">
                        Preliminary bill not created yet. Please create the bill first.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="invoice-print-area max-w-3xl mx-auto w-full bg-white mt-0 print:mt-0 rounded-lg print:rounded-none"
            style={{
                zoom: FONT_SIZES[fontSize].zoom,
                paddingTop: padding.top,
                paddingRight: padding.right,
                paddingBottom: padding.bottom,
                paddingLeft: padding.left,
            } as CSSProperties}
        >
            <style>{`
              .bg-row-blue { background-color: #cfd2d8ff !important; }
              @media print {
                .bg-row-blue { background-color: #cfd2d8ff !important; }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                @page {
                    size: ${cssSize};
                    margin: ${margin};
                }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #fff !important;
                }
                /* Hide app chrome on print */
                .print\\:hidden {
                    display: none !important;
                }
                /* Reset layout constraints for printing */
                .invoice-print-area {
                    max-width: 100% !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding-top: ${padding.top}px !important;
                    padding-right: ${padding.right}px !important;
                    padding-bottom: ${padding.bottom}px !important;
                    padding-left: ${padding.left}px !important;
                    box-shadow: none !important;
                }
                .invoice-print-area table {
                    width: 100% !important;
                }
                /* Avoid breaking rows across pages */
                tr, td, th {
                    page-break-inside: avoid;
                }
                .border { border-color: oklch(0.929 0.013 255.508); }
                .border-dashed { border-color: oklch(0.929 0.013 255.508); }
              }
            `}</style>

            {/* Back, Print Settings & Print Buttons */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setSettingsOpen(true)}>
                        <Settings2 className="h-4 w-4" />
                        <span>Print Settings</span>
                    </Button>
                    <Button size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                    <SheetHeader className="border-b px-4 py-3 gap-0">
                        <SheetTitle className="flex items-center gap-3 pr-8">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Settings2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <div className="text-base font-semibold text-left">Print Settings</div>
                                <SheetDescription className="text-xs font-normal text-left">Adjust how this billing statement looks and prints</SheetDescription>
                            </div>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Font Size</Label>
                            <Select value={fontSize} onValueChange={(v) => setFontSize(v as keyof typeof FONT_SIZES)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Font size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(FONT_SIZES).map(([key, { label }]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Paper Size</Label>
                            <Select value={paperSize} onValueChange={(v) => setPaperSize(v as keyof typeof PAPER_SIZES)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Paper size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Content Padding (px)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="padding-top" className="text-xs text-muted-foreground">Top</Label>
                                    <Input
                                        id="padding-top"
                                        type="number"
                                        min={0}
                                        value={padding.top}
                                        onChange={(e) => setPadding((p) => ({ ...p, top: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="padding-right" className="text-xs text-muted-foreground">Right</Label>
                                    <Input
                                        id="padding-right"
                                        type="number"
                                        min={0}
                                        value={padding.right}
                                        onChange={(e) => setPadding((p) => ({ ...p, right: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="padding-bottom" className="text-xs text-muted-foreground">Bottom</Label>
                                    <Input
                                        id="padding-bottom"
                                        type="number"
                                        min={0}
                                        value={padding.bottom}
                                        onChange={(e) => setPadding((p) => ({ ...p, bottom: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="padding-left" className="text-xs text-muted-foreground">Left</Label>
                                    <Input
                                        id="padding-left"
                                        type="number"
                                        min={0}
                                        value={padding.left}
                                        onChange={(e) => setPadding((p) => ({ ...p, left: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Item Table Columns</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full justify-between h-8">
                                        <span>{visibleColumnCount} of {Object.keys(visibleColumns).length} columns shown</span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[220px]">
                                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {(Object.keys(visibleColumns) as (keyof BillingColumns)[]).map((key) => (
                                        <DropdownMenuCheckboxItem
                                            key={key}
                                            checked={visibleColumns[key]}
                                            onCheckedChange={(checked) => toggleColumn(key, checked === true)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {COLUMN_LABELS[key]}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="border-t p-4 space-y-2">
                        <Button
                            className="w-full"
                            onClick={() => saveDefaultsMutation.mutate()}
                            disabled={saveDefaultsMutation.isPending}
                        >
                            {saveDefaultsMutation.isPending ? 'Saving...' : 'Save as Default'}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Saved defaults apply to every billing statement print, not just this one.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Header: Logo/Company (left 50%) + Title (right 50%) */}
            <div className="mb-6 flex items-start justify-between gap-6">
                <div className="w-1/2 flex items-center gap-4">
                    {companyLogo ? (
                        <img
                            src={companyLogo}
                            alt="Company Logo"
                            className="w-24 h-24 object-contain"
                        />
                    ) : null}

                    <div>
                        <h1 className="text-2xl font-bold">{companyName}</h1>
                        {companySettings?.address1 && (
                            <p className="text-sm mt-1 leading-5">{companySettings.address1}</p>
                        )}
                        {companySettings?.address2 && (
                            <p className="text-sm leading-5">{companySettings.address2}</p>
                        )}
                    </div>
                </div>

                <div className="w-1/2 text-right">
                    <h2 className="text-xl font-bold tracking-widest uppercase">PRELIMINARY BILLING STATEMENT</h2>
                    <p className="text-sm mt-1 leading-5">
                        Admission Date: {admission?.admission_date ? safeFormatDate(admission.admission_date) : '-'}
                    </p>
                    <p className="text-sm leading-5">
                        Discharged Date: {admission?.discharge_date ? safeFormatDate(admission.discharge_date) : '-'}
                    </p>
                </div>
            </div>

            {/* ── Patient Info Table ──────────────────────────────────────────── */}
            <table className="w-full text-sm border">
                <tbody>
                    <tr className="border">
                        <td className="border px-2 py-1 w-1/3">
                            Admission ID: #{admissionId}
                        </td>
                        <td className="border px-2 py-1 w-1/3">
                            Generated Date: {safeFormatDate(new Date())}
                        </td>
                        <td className="border px-2 py-1 w-1/3">
                            Status: Preliminary
                        </td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1" colSpan={2}>
                            Patient Name: <strong>{admission?.patient_name || 'Unknown'}</strong>
                        </td>
                        <td className="border px-2 py-1">
                            Phone: {admission?.phone || 'N/A'}
                        </td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1">
                            Bed/Cabin: {admission?.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : 'N/A'}
                        </td>
                        <td className="border px-2 py-1">
                            Age: {admission?.age_text
                                ? admission.age_text.replace(/^(\d+)Y/, '$1 yrs')
                                : admission?.age ? `${admission.age} yrs` : 'N/A'}
                        </td>
                        <td className="border px-2 py-1">
                            Sex: {admission?.sex || 'N/A'}
                        </td>
                    </tr>
                    {admission?.diagnosis && (
                        <tr className="border">
                            <td className="border px-2 py-1" colSpan={3}>
                                Diagnosis: {admission.diagnosis}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ── Bill Items Table ────────────────────────────────────────────── */}
            <table className="w-full text-sm mt-6">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        {visibleColumns.sl && <th className="px-2 py-1 text-left text-xs w-[5%]">#</th>}
                        {visibleColumns.category && <th className="px-2 py-1 text-left text-xs w-[22%]">Category</th>}
                        {visibleColumns.description && <th className="px-2 py-1 text-left text-xs w-[45%]">Description</th>}
                        {visibleColumns.qty && <th className="px-2 py-1 text-center text-xs w-[10%]">Qty/Days</th>}
                        {visibleColumns.rate && <th className="px-2 py-1 text-right text-xs w-[18%]">Rate ({currencySymbol})</th>}
                    </tr>
                </thead>
                <tbody>
                    {orderedItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed">
                            {visibleColumns.sl && <td className="px-2 py-1 text-xs text-gray-500">{idx + 1}</td>}
                            {visibleColumns.category && (
                                <td className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase">
                                    {item.category}
                                </td>
                            )}
                            {visibleColumns.description && (
                                <td className="px-2 py-1 text-xs">
                                    {item.description}
                                    {item.note && <span className="block text-gray-500 mt-0.5">{item.note}</span>}
                                    {item.date && <span className="block text-gray-400 text-[10px] mt-0.5">{item.date}</span>}
                                </td>
                            )}
                            {visibleColumns.qty && <td className="px-2 py-1 text-center text-xs">{item.qty}</td>}
                            {visibleColumns.rate && <td className="px-2 py-1 text-right text-xs font-semibold">{fmtNum(item.rate)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── Bill Totals ─────────────────────────────────────────────────── */}
            <table className="w-full text-sm mt-3">
                <tbody>
                    <tr className="border font-bold">
                        <td className="border px-2 py-1 text-right" colSpan={Math.max(1, visibleColumnCount - 1)}>Grand Total Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(grandTotal)}</td>
                    </tr>
                </tbody>
            </table>

            <p className="text-sm mt-6 italic">Total In Words: {amountToWords(grandTotal)}</p>

            {/* ── Signature Row ───────────────────────────────────────────────── */}
            <div className="flex justify-between mt-32 text-sm w-full">
                <div style={{ textAlign: 'left' }}>
                    <p className="border-t border-dashed pt-1">
                        Prepared By: <span className="font-medium">{admission?.bill_created_by_user?.name || admission?.created_by_user?.name || '-'}</span>
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className="inline-block border-t border-dashed pt-1">Authorized Signature:</span>
                </div>
            </div>
        </div>
    )
}
