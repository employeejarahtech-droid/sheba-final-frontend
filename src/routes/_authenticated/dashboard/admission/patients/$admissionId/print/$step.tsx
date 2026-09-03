import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, type CSSProperties } from 'react'
import { getCookie } from '@/lib/cookies'
import { Loader2, Building2, ArrowLeft, Printer, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type StepPrintPadding = { top: number; right: number; bottom: number; left: number }
const DEFAULT_PADDING: StepPrintPadding = { top: 32, right: 32, bottom: 32, left: 32 }

// Paper sizes offered for printing this step report. `cssSize` feeds the
// @page size (browsers use this to pick/suggest the matching physical
// paper), and `margin` is tuned per size — the 80mm thermal option needs a
// near-zero margin since receipt printers have almost no physical border.
const PAPER_SIZES: Record<string, { label: string; cssSize: string; margin: string }> = {
    a4: { label: 'A4', cssSize: 'A4 portrait', margin: '12mm' },
    a5: { label: 'A5', cssSize: 'A5 portrait', margin: '8mm' },
    letter: { label: 'Letter', cssSize: 'letter portrait', margin: '12mm' },
    legal: { label: 'Legal', cssSize: 'legal portrait', margin: '12mm' },
    thermal80: { label: '80mm (Thermal)', cssSize: '80mm auto', margin: '2mm' },
}

// Overall scale for the report content. Most cells/headings here use
// Tailwind text-size utilities (text-sm, text-xs, ...), which set their own
// explicit rem font-size and don't inherit a parent's font-size — so scaling
// via `zoom` (which resizes everything: text, padding, borders) is used
// instead of trying to override every element's own font size.
const FONT_SIZES: Record<string, { label: string; zoom: number }> = {
    sm: { label: 'Small', zoom: 0.85 },
    base: { label: 'Medium', zoom: 1 },
    lg: { label: 'Large', zoom: 1.15 },
    xl: { label: 'Extra Large', zoom: 1.3 },
}

type AdmissionData = {
    id: number
    admission_prefix: string | null
    patient_name: string
    age: number
    sex: string
    phone: string
    admission_date: string
    discharge_date: string | null
    status: 'active' | 'discharged' | 'critical'
    bedCabin?: {
        id: number
        code: string
        type: string
        ward: string
    }
    doctor?: {
        id: number
        doctor_name: string
        speciality: string
    }
    diagnosis: string | null
    bill_created: number
    bill_created_date: string | null
    bill_created_by_user?: {
        id: number
        name: string
    }
    final_bill_created: number
    final_bill_created_date: string | null
    final_bill_created_by_user?: {
        id: number
        name: string
    }
    discharged: number
    discharged_date: string | null
    discharged_by_user?: {
        id: number
        name: string
    }
    payment_completed: number
    payment_completed_date: string | null
    payment_completed_by_user?: {
        id: number
        name: string
    }
    bills_distributed: number
    bills_distributed_date: string | null
    bills_distributed_by_user?: {
        id: number
        name: string
    }
    balance_distributed: number
    balance_distributed_date: string | null
    balance_distributed_by_user?: {
        id: number
        name: string
    }
    total_bill_amount?: number
    finalBill?: {
        id: number
        total_bill_amount: number
        total_discount: number
        total_discounted_amount: number
        paid_amount: number
        due_amount: number
        status: 'pending' | 'partial' | 'paid' | 'cancelled'
        payment_count: number
    }
    advancePayments?: {
        total_amount: number
        payment_count: number
        payments?: Array<{
            id: number
            amount: number
            payment_date: string
            notes?: string
            payment_method?: string
        }>
    }
}

export const Route = createFileRoute('/_authenticated/dashboard/admission/patients/$admissionId/print/$step')({
    component: AdmissionStepPrintPage,
})

function AdmissionStepPrintPage() {
    const { admissionId, step } = Route.useParams()
    const { format } = useCurrency()
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()

    const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('a4')
    const { cssSize, margin } = PAPER_SIZES[paperSize]
    const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('base')
    const [padding, setPadding] = useState<StepPrintPadding>(DEFAULT_PADDING)
    const [settingsOpen, setSettingsOpen] = useState(false)

    const { data: admissionData, isLoading } = useQuery({
        queryKey: ['admission-detail', admissionId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admission/${admissionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch admission details')
            const data = await res.json()

            // Fetch final bill if exists
            const billRes = await fetch(`${API_URL}/api/admission/${admissionId}/final-bill`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (billRes.ok) {
                const billData = await billRes.json()
                data.data.finalBill = billData.data
            }

            // Fetch advance payments
            const advRes = await fetch(`${API_URL}/api/admission/${admissionId}/advance-payments`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (advRes.ok) {
                const advData = await advRes.json()
                data.data.advancePayments = advData.data
            }

            return data as { data: AdmissionData }
        },
        enabled: !!token,
    })

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
            top: companySettings.admission_step_padding_top ?? DEFAULT_PADDING.top,
            right: companySettings.admission_step_padding_right ?? DEFAULT_PADDING.right,
            bottom: companySettings.admission_step_padding_bottom ?? DEFAULT_PADDING.bottom,
            left: companySettings.admission_step_padding_left ?? DEFAULT_PADDING.left,
        })
        if (companySettings.admission_step_font_size && companySettings.admission_step_font_size in FONT_SIZES) {
            setFontSize(companySettings.admission_step_font_size)
        }
        if (companySettings.admission_step_paper_size && companySettings.admission_step_paper_size in PAPER_SIZES) {
            setPaperSize(companySettings.admission_step_paper_size)
        }
    }, [companySettings])

    // Persist every print setting as the company-wide default — every
    // admission step print (this one and every other) picks it up via /api/company-settings.
    const saveDefaultsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admission_step_padding_top: padding.top,
                    admission_step_padding_right: padding.right,
                    admission_step_padding_bottom: padding.bottom,
                    admission_step_padding_left: padding.left,
                    admission_step_font_size: fontSize,
                    admission_step_paper_size: paperSize,
                }),
            })
            if (!res.ok) throw new Error('Failed to save print settings')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Default print settings saved — applies to every admission step print from now on')
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
        },
        onError: () => toast.error('Failed to save default print settings'),
    })

    const admission = admissionData?.data
    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${API_URL}${companySettings.company_logo}`
        : null;
    const companyName = companySettings?.company_name || 'Sheba Hospital';

    // Get step info
    const stepConfig: Record<string, { title: string; description: string; getStatus: () => boolean; getDate: () => string | null; getUser: () => string | null }> = {
        'bill-created': {
            title: 'Bill Created',
            description: 'Preliminary bill has been created for this admission',
            getStatus: () => admission?.bill_created === 1,
            getDate: () => admission?.bill_created_date || null,
            getUser: () => admission?.bill_created_by_user?.name || null,
        },
        'final-bill': {
            title: 'Final Bill Created',
            description: 'Final bill has been generated for this admission',
            getStatus: () => admission?.final_bill_created === 1,
            getDate: () => admission?.final_bill_created_date || null,
            getUser: () => admission?.final_bill_created_by_user?.name || null,
        },
        'discharged': {
            title: 'Patient Discharged',
            description: 'Patient has been discharged from the hospital',
            getStatus: () => admission?.discharged === 1,
            getDate: () => admission?.discharged_date || null,
            getUser: () => admission?.discharged_by_user?.name || null,
        },
        'payment-completed': {
            title: 'Payment Completed',
            description: 'All payments have been completed for this admission',
            getStatus: () => admission?.payment_completed === 1,
            getDate: () => admission?.payment_completed_date || null,
            getUser: () => admission?.payment_completed_by_user?.name || null,
        },
        'bills-distributed': {
            title: 'Bills Distributed',
            description: 'Bills have been distributed to relevant parties',
            getStatus: () => admission?.bills_distributed === 1,
            getDate: () => admission?.bills_distributed_date || null,
            getUser: () => admission?.bills_distributed_by_user?.name || null,
        },
        'balance-distributed': {
            title: 'Balance Distributed',
            description: 'Balance amount has been distributed',
            getStatus: () => admission?.balance_distributed === 1,
            getDate: () => admission?.balance_distributed_date || null,
            getUser: () => admission?.balance_distributed_by_user?.name || null,
        },
    }

    const currentStep = stepConfig[step]

    if (isLoading || !admission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!currentStep) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 text-lg font-semibold mb-4">Invalid Step Type</p>
                    <Link to="/dashboard/admission/patients">
                        <Button variant="outline">Back to Admissions</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const isCompleted = currentStep.getStatus()
    const stepDate = currentStep.getDate()
    const stepUser = currentStep.getUser()
    const formattedDate = stepDate ? new Date(stepDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'

    const formattedAdmissionDate = admission.admission_date 
        ? new Date(admission.admission_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
        : 'N/A'
    const formattedAdmissionTime = admission.created_at
        ? new Date(admission.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : ''
    const admissionDateAndTime = formattedAdmissionTime 
        ? `${formattedAdmissionDate} ${formattedAdmissionTime}` 
        : formattedAdmissionDate
    const dischargeDate = admission.discharge_date ? new Date(admission.discharge_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'
    const bedCabinInfo = admission.bedCabin ? `${admission.bedCabin.code} (${admission.bedCabin.type})` : 'N/A'
    const doctorName = admission.doctor?.doctor_name || 'N/A'

    const statusColors = {
        active: { bg: '#dcfce7', color: '#166534' },
        discharged: { bg: '#f3f4f6', color: '#374151' },
        critical: { bg: '#fee2e2', color: '#991b1b' },
    }
    const statusStyle = statusColors[admission.status] || statusColors.active

    return (
        <>
            <AppHeader fixed className="print:hidden" />

            <Main>
                <div
                    className="invoice-print-area max-w-3xl mx-auto w-full bg-white mt-10 print:mt-0 rounded-lg print:rounded-none"
                    style={{
                        zoom: FONT_SIZES[fontSize].zoom,
                        paddingTop: padding.top,
                        paddingRight: padding.right,
                        paddingBottom: padding.bottom,
                        paddingLeft: padding.left,
                    } as CSSProperties}
                >
                    <style>{`
                        .bg-row-blue {
                            background-color: #cfd2d8ff !important;
                        }
                        @media print {
                            .bg-row-blue {
                                background-color: #cfd2d8ff !important;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
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
                            .border {
                                border-color: oklch(0.929 0.013 255.508);
                            }
                            .border-dashed {
                                border-color: oklch(0.929 0.013 255.508);
                            }
                        }
                        @page {
                            margin: ${margin};
                            size: ${cssSize};
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
                                        <SheetDescription className="text-xs font-normal text-left">Adjust how this report looks and prints</SheetDescription>
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
                                            <Label htmlFor="step-padding-top" className="text-xs text-muted-foreground">Top</Label>
                                            <Input
                                                id="step-padding-top"
                                                type="number"
                                                min={0}
                                                value={padding.top}
                                                onChange={(e) => setPadding((p) => ({ ...p, top: Number(e.target.value) || 0 }))}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="step-padding-right" className="text-xs text-muted-foreground">Right</Label>
                                            <Input
                                                id="step-padding-right"
                                                type="number"
                                                min={0}
                                                value={padding.right}
                                                onChange={(e) => setPadding((p) => ({ ...p, right: Number(e.target.value) || 0 }))}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="step-padding-bottom" className="text-xs text-muted-foreground">Bottom</Label>
                                            <Input
                                                id="step-padding-bottom"
                                                type="number"
                                                min={0}
                                                value={padding.bottom}
                                                onChange={(e) => setPadding((p) => ({ ...p, bottom: Number(e.target.value) || 0 }))}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="step-padding-left" className="text-xs text-muted-foreground">Left</Label>
                                            <Input
                                                id="step-padding-left"
                                                type="number"
                                                min={0}
                                                value={padding.left}
                                                onChange={(e) => setPadding((p) => ({ ...p, left: Number(e.target.value) || 0 }))}
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
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
                                    Saved defaults apply to every admission step print, not just this one.
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
                                <h1 className="text-2xl font-bold text-slate-900">{companyName}</h1>
                                {companySettings?.address1 && (
                                    <p className="text-sm mt-1 leading-5 text-slate-600">{companySettings.address1}</p>
                                )}
                                {companySettings?.address2 && (
                                    <p className="text-sm leading-5 text-slate-600">{companySettings.address2}</p>
                                )}
                            </div>
                        </div>

                        <div className="w-1/2 text-right">
                            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-800">{currentStep.title}</h2>
                            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-semibold">
                                {currentStep.description}
                            </p>
                        </div>
                    </div>

                    {/* Verification Status */}
                    <table className="w-full text-sm border mb-6">
                        <tbody>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/2">
                                    Verification Status:{' '}
                                    <strong className="inline-flex items-center gap-1.5">
                                        {isCompleted ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                                Completed
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                                Pending
                                            </>
                                        )}
                                    </strong>
                                </td>
                                <td className="border px-2 py-1 w-1/2">
                                    {isCompleted ? (
                                        <>Completion Date: <strong>{formattedDate}</strong>{stepUser && <> by <strong>{stepUser}</strong></>}</>
                                    ) : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Patient Information Table */}
                    <table className="w-full text-sm border mb-6">
                        <tbody>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/3">
                                    Admission ID: <strong>{admission.admission_prefix || `ADM-${admission.id}`}</strong>
                                </td>
                                <td className="border px-2 py-1 w-1/3">
                                    Generated Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="border px-2 py-1 w-1/3">
                                    Patient Status: <strong style={{ color: statusStyle.color }}>{admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}</strong>
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1" colSpan={2}>
                                    Patient Name: <strong>{admission.patient_name || 'N/A'}</strong>
                                    {admission.age || admission.sex ? ` — ${admission.age ? `${admission.age} yrs` : ''}${admission.age && admission.sex ? ' / ' : ''}${admission.sex ? admission.sex.toUpperCase() : ''}` : ''}
                                </td>
                                <td className="border px-2 py-1">
                                    Phone: {admission.phone || 'N/A'}
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1">
                                    Bed/Cabin: {bedCabinInfo}
                                </td>
                                <td className="border px-2 py-1">
                                    Ward: {admission.bedCabin?.ward || 'N/A'}
                                </td>
                                <td className="border px-2 py-1">
                                    Attending Doctor: <strong>{doctorName}</strong>
                                </td>
                            </tr>
                            {admission.diagnosis && (
                                <tr className="border">
                                    <td className="border px-2 py-1" colSpan={3}>
                                        Diagnosis: {admission.diagnosis}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Admission Details Table */}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Admission Details</h3>
                    <table className="w-full text-sm border mb-6">
                        <thead>
                            <tr className="border-t border-b bg-row-blue">
                                <th className="px-2 py-1 text-left text-xs uppercase w-[50%]">Detail</th>
                                <th className="px-2 py-1 text-left text-xs uppercase w-[50%]">Information</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Admission Date and Time</td>
                                <td className="px-2 py-1 text-xs font-semibold">{admissionDateAndTime}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Discharge Date</td>
                                <td className="px-2 py-1 text-xs font-semibold">{dischargeDate}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Bed/Cabin Info</td>
                                <td className="px-2 py-1 text-xs font-semibold">{bedCabinInfo}</td>
                            </tr>
                            <tr className="border-b border-dashed">
                                <td className="px-2 py-1 text-xs">Attending Doctor</td>
                                <td className="px-2 py-1 text-xs font-semibold">{doctorName}</td>
                            </tr>
                            {/* Show bill amount if bill created */}
                            {step === 'bill-created' && admission.total_bill_amount && (
                                <tr className="border-b-2 font-bold bg-slate-50">
                                    <td className="px-2 py-1 text-xs">Total Bill Amount</td>
                                    <td className="px-2 py-1 text-xs text-slate-900 font-semibold">{format(admission.total_bill_amount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Financial Information if final bill */}
                    {(step === 'final-bill' || step === 'payment-completed') && admission.finalBill && (
                        <>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Financial Summary</h3>
                            <table className="w-full text-sm border mb-6">
                                <thead>
                                    <tr className="border-t border-b bg-row-blue">
                                        <th className="px-2 py-1 text-left text-xs uppercase w-[50%]">Financial Detail</th>
                                        <th className="px-2 py-1 text-right text-xs uppercase w-[50%]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-dashed">
                                        <td className="px-2 py-1 text-xs">Total Amount</td>
                                        <td className="px-2 py-1 text-xs text-right font-semibold">{format(admission.finalBill.total_discounted_amount)}</td>
                                    </tr>
                                    <tr className="border-b border-dashed">
                                        <td className="px-2 py-1 text-xs">Paid Amount</td>
                                        <td className="px-2 py-1 text-xs text-right font-semibold">{format(admission.finalBill.paid_amount)}</td>
                                    </tr>
                                    <tr className="border-b border-dashed">
                                        <td className="px-2 py-1 text-xs">Due Amount</td>
                                        <td className="px-2 py-1 text-xs text-right font-semibold">{format(admission.finalBill.due_amount)}</td>
                                    </tr>
                                    <tr className="border-b-2 font-bold bg-slate-50">
                                        <td className="px-2 py-1 text-xs">Payment Status</td>
                                        <td className="px-2 py-1 text-xs text-right uppercase tracking-wider">{admission.finalBill.status}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Footer Signatures */}
                    <div className="grid grid-cols-2 text-sm mt-24">
                        <div>
                            <p className="border-t border-dashed w-40 pt-1 text-center text-xs">Processed By:</p>
                        </div>
                        <div className="text-right">
                            <p className="border-t border-dashed w-56 ml-auto pt-1 text-center text-xs">
                                Authorized By:
                            </p>
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
