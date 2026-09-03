import { useMemo, useState, useEffect, type CSSProperties } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ArrowLeft, Printer, Settings2, ChevronDown } from 'lucide-react'
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
import { useCurrency } from '@/hooks/use-currency'
import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useAuthStore } from '@/stores/auth-store'

const API_URL = import.meta.env.VITE_API_URL || ''

type FinalBillPadding = { top: number; right: number; bottom: number; left: number }
const DEFAULT_PADDING: FinalBillPadding = { top: 32, right: 32, bottom: 32, left: 32 }

type FinalBillColumns = { sl: boolean; category: boolean; description: boolean; amount: boolean; discount: boolean; final: boolean }
const DEFAULT_COLUMNS: FinalBillColumns = { sl: true, category: true, description: true, amount: true, discount: true, final: true }
const COLUMN_LABELS: Record<keyof FinalBillColumns, string> = {
    sl: '#', category: 'Category', description: 'Description', amount: 'Amount', discount: 'Discount', final: 'Final',
}

// Paper sizes offered for printing this final bill. `cssSize` feeds the
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

// Overall scale for the final bill content. Most cells/headings here use
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

// ─── Types ────────────────────────────────────────────────────────────────────

type FinalBillItem = {
    id: number
    service_name: string
    service_type: string
    service_note?: string
    quantity: number
    unit_price: number
    total_amount: number
    total_discount: number
    final_amount: number
}

type FinalBill = {
    id: number
    admission_id: number
    total_bill_amount: number
    total_discount: number
    total_discounted_amount: number
    status: 'pending' | 'partial' | 'paid' | 'cancelled'
    notes?: string
    paid_amount: number
    due_amount: number
    created_at: string
    discounted_bill_created_at?: string
    discounted_by_doctor_id?: number
    items?: FinalBillItem[]
    admission?: {
        id: number
        admission_prefix?: string | null
        patient_name: string
        phone?: string
        age?: number
        age_text?: string | null
        sex?: string
        patient_address?: string
        admission_date: string
        discharge_date?: string
        bedCabin?: { code: string; type: string; ward?: string } | null
        doctor_name?: string
        diagnosis?: string
        bill_created_by_user?: { id: number; name: string } | null
        created_by_user?: { id: number; name: string } | null
    }
    discountDoctor?: {
        doctor_name?: string
    }
    created_by_user?: { id: number; name: string } | null
    total_discounted_by_user?: { id: number; name: string } | null
    discounted_by_user?: { id: number; name: string } | null
}

type Distribution = {
    id: number
    admission_id: number
    final_bill_id: number
    service_provided_by: string
    provider_id?: number
    provider_name?: string
    doctor?: { id: number; doctor_name: string }
    clinicService?: { id: number; name: string }
    bill_amount: number
    less_amount: number
    final_bill: number
    pay_now: number
    due_amount: number
    payment_status: 'pending' | 'partial' | 'paid'
    notes?: string
}

type FinalBillPrintPageProps = {
    finalBill: FinalBill
    distributions?: Distribution[]
    onClose?: () => void
}

// ─── Label helpers ────────────────────────────────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
    bed_charges: 'Bed Charges',
    operation: 'Operation Charges',
    consultant: 'Consultant Fees',
    surgeon: 'Surgeon Fees',
    assistant: 'Assistant Fees',
    service: 'Clinical Services',
    medicine: 'Medicine',
    other: 'Other Charges',
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
    Surgeon: 'Surgeon Fee',
    Anesthetist: 'Anesthesiologist Fee',
    Assistant: 'Assistant Surgeon Fee',
    Consultant: 'Consultant Fee',
    'Clinical Service': 'Clinical Service',
    Other: 'Hospital / Other',
    Operation: 'Operation Charge',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FinalBillPrintPage({
    finalBill,
    distributions = [],
    onClose,
}: FinalBillPrintPageProps) {
    const { currencySymbol, locale } = useCurrency()
    const admission = finalBill.admission || {} as FinalBill['admission']
    const token = getCookie('accessToken')
    const currentUserName = useAuthStore((s) => s.user?.name)
    const queryClient = useQueryClient()

    const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('a4')
    const { cssSize, margin } = PAPER_SIZES[paperSize]
    const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('base')
    const [padding, setPadding] = useState<FinalBillPadding>(DEFAULT_PADDING)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<FinalBillColumns>(DEFAULT_COLUMNS)
    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length
    const toggleColumn = (key: keyof FinalBillColumns, checked: boolean) => {
        setVisibleColumns((prev) => {
            if (!checked && visibleColumnCount <= 1) return prev // keep at least one column visible
            return { ...prev, [key]: checked }
        })
    }

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
            top: companySettings.final_bill_padding_top ?? DEFAULT_PADDING.top,
            right: companySettings.final_bill_padding_right ?? DEFAULT_PADDING.right,
            bottom: companySettings.final_bill_padding_bottom ?? DEFAULT_PADDING.bottom,
            left: companySettings.final_bill_padding_left ?? DEFAULT_PADDING.left,
        })
        if (companySettings.final_bill_font_size && companySettings.final_bill_font_size in FONT_SIZES) {
            setFontSize(companySettings.final_bill_font_size)
        }
        if (companySettings.final_bill_paper_size && companySettings.final_bill_paper_size in PAPER_SIZES) {
            setPaperSize(companySettings.final_bill_paper_size)
        }
        // JSON columns sometimes come back as a raw string rather than a
        // parsed object depending on the read path — handle both.
        const incomingColumns = typeof companySettings.final_bill_visible_columns === 'string'
            ? (() => { try { return JSON.parse(companySettings.final_bill_visible_columns) } catch { return null } })()
            : companySettings.final_bill_visible_columns
        if (incomingColumns && typeof incomingColumns === 'object' && !Array.isArray(incomingColumns)) {
            setVisibleColumns((prev) => {
                const next = { ...prev }
                for (const key of Object.keys(prev) as (keyof FinalBillColumns)[]) {
                    if (typeof incomingColumns[key] === 'boolean') next[key] = incomingColumns[key]
                }
                return next
            })
        }
    }, [companySettings])

    // Persist every print setting as the company-wide default — every final
    // bill print (this one and every other) picks it up via /api/company-settings.
    const saveDefaultsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    final_bill_padding_top: padding.top,
                    final_bill_padding_right: padding.right,
                    final_bill_padding_bottom: padding.bottom,
                    final_bill_padding_left: padding.left,
                    final_bill_font_size: fontSize,
                    final_bill_paper_size: paperSize,
                    final_bill_visible_columns: visibleColumns,
                }),
            })
            if (!res.ok) throw new Error('Failed to save print settings')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Default print settings saved — applies to every final bill print from now on')
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
        },
        onError: () => toast.error('Failed to save default print settings'),
    })

    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${API_URL}${companySettings.company_logo}`
        : null
    const companyName = companySettings?.company_name || 'Sheba Hospital'

    // Plain number formatter — no currency prefix; symbol stays in column headers only
    const fmtNum = (val: number | string | null | undefined) => {
        const n = typeof val === 'string' ? parseFloat(val) : (val ?? 0)
        return isNaN(n) ? '0.00' : n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    const items = finalBill.items || []

    // Filter out Clinic Part (Profit) from visible distribution heads
    const providerDistributions = useMemo(
        () => distributions.filter(d => d.notes !== 'Clinic Part (Profit)'),
        [distributions]
    )

    const clinicProfit = useMemo(
        () => distributions.find(d => d.notes === 'Clinic Part (Profit)'),
        [distributions]
    )

    const totals = useMemo(() => {
        const totalBill = Number(finalBill.total_bill_amount) || 0
        const totalDiscount = items.reduce((sum, item) => sum + (Number(item.total_discount) || 0), 0)
        const netAmount = Number(finalBill.total_discounted_amount) || 0
        const paidAmount = Number(finalBill.paid_amount) || 0
        const dueAmount = Number(finalBill.due_amount) || 0
        return { totalBill, totalDiscount, netAmount, paidAmount, dueAmount }
    }, [finalBill, items, locale])

    const distributionTotals = useMemo(() => {
        const totalFinal = providerDistributions.reduce((s, d) => s + Number(d.final_bill || 0), 0)
        const totalPayNow = providerDistributions.reduce((s, d) => s + Number(d.pay_now || 0), 0)
        const totalDue = providerDistributions.reduce((s, d) => s + Number(d.due_amount || 0), 0)
        const totalLess = providerDistributions.reduce((s, d) => s + Number(d.less_amount || 0), 0)
        const totalBilled = providerDistributions.reduce((s, d) => s + Number(d.bill_amount || 0), 0)
        return { totalFinal, totalPayNow, totalDue, totalLess, totalBilled }
    }, [providerDistributions])

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    const getProviderName = (d: Distribution) => {
        if (d.doctor?.doctor_name) return `Dr. ${d.doctor.doctor_name}`
        if (d.clinicService?.name) return d.clinicService.name
        if (d.provider_name) return d.provider_name
        return '—'
    }

    return (
        <div
            className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 print-report"
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
                .bg-background { background-color: #fff; }
                body { color: #000; background-color: #fff; }
                .border { border-color: oklch(0.929 0.013 255.508); }
                .border-dashed { border-color: oklch(0.929 0.013 255.508); }
                .print-report {
                    max-width: 100% !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding-top: ${padding.top}px !important;
                    padding-right: ${padding.right}px !important;
                    padding-bottom: ${padding.bottom}px !important;
                    padding-left: ${padding.left}px !important;
                }
              }
            `}</style>

            {/* Back/Close, Print Settings & Print Buttons */}
            <div className="flex justify-between items-center mb-4 print:hidden">
                {onClose ? (
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="w-4 h-4 mr-2" />
                        Close
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                )}
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
                                <SheetDescription className="text-xs font-normal text-left">Adjust how this final bill looks and prints</SheetDescription>
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
                                    <Label htmlFor="fb-padding-top" className="text-xs text-muted-foreground">Top</Label>
                                    <Input
                                        id="fb-padding-top"
                                        type="number"
                                        min={0}
                                        value={padding.top}
                                        onChange={(e) => setPadding((p) => ({ ...p, top: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fb-padding-right" className="text-xs text-muted-foreground">Right</Label>
                                    <Input
                                        id="fb-padding-right"
                                        type="number"
                                        min={0}
                                        value={padding.right}
                                        onChange={(e) => setPadding((p) => ({ ...p, right: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fb-padding-bottom" className="text-xs text-muted-foreground">Bottom</Label>
                                    <Input
                                        id="fb-padding-bottom"
                                        type="number"
                                        min={0}
                                        value={padding.bottom}
                                        onChange={(e) => setPadding((p) => ({ ...p, bottom: Number(e.target.value) || 0 }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fb-padding-left" className="text-xs text-muted-foreground">Left</Label>
                                    <Input
                                        id="fb-padding-left"
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
                                    {(Object.keys(visibleColumns) as (keyof FinalBillColumns)[]).map((key) => (
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
                            Saved defaults apply to every final bill print, not just this one.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ── Header: Logo/Company (left 50%) + Title (right 50%) ───────────── */}
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
                    <h2 className="text-xl font-bold tracking-widest uppercase">FINAL BILL INVOICE</h2>
                    <p className="text-sm mt-1 leading-5">
                        Admission Date: {admission?.admission_date ? formatDate(admission.admission_date) : '-'}
                    </p>
                    <p className="text-sm leading-5">
                        Discharged Date: {admission?.discharge_date ? formatDate(admission.discharge_date) : '-'}
                    </p>
                </div>
            </div>

            {/* ── Patient Info Table ──────────────────────────────────────────── */}
            <table className="w-full text-sm border">
                <tbody>
                    <tr className="border">
                        <td className="border px-2 py-1 w-1/3">
                            Admission ID: #{finalBill.admission_id}
                        </td>
                        <td className="border px-2 py-1 w-1/3">
                            Generated Date: {formatDate(new Date().toISOString())}
                        </td>
                        <td className="border px-2 py-1 w-1/3">
                            Status: Final
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
                        {visibleColumns.sl && <th className="px-2 py-1 text-left text-xs w-[4%]">#</th>}
                        {visibleColumns.category && <th className="px-2 py-1 text-left text-xs w-[18%]">Category</th>}
                        {visibleColumns.description && <th className="px-2 py-1 text-left text-xs w-[39%]">Description</th>}
                        {visibleColumns.amount && <th className="px-2 py-1 text-right text-xs w-[13%]">Amount ({currencySymbol})</th>}
                        {visibleColumns.discount && <th className="px-2 py-1 text-right text-xs w-[13%]">Disc. ({currencySymbol})</th>}
                        {visibleColumns.final && <th className="px-2 py-1 text-right text-xs w-[13%]">Final ({currencySymbol})</th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-dashed">
                            {visibleColumns.sl && <td className="px-2 py-1 text-xs text-gray-500">{item.serial_no || idx + 1}</td>}
                            {visibleColumns.category && (
                                <td className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase">
                                    {SERVICE_TYPE_LABELS[item.service_type] || item.service_type}
                                </td>
                            )}
                            {visibleColumns.description && (
                                <td className="px-2 py-1 text-xs">
                                    {item.service_name}
                                    {item.service_note && (
                                        <span className="block text-gray-500 mt-0.5">{item.service_note}</span>
                                    )}
                                </td>
                            )}
                            {visibleColumns.amount && <td className="px-2 py-1 text-right text-xs">{fmtNum(item.total_amount)}</td>}
                            {visibleColumns.discount && (
                                <td className="px-2 py-1 text-right text-xs">
                                    {item.total_discount > 0 ? (
                                        <span>-{fmtNum(item.total_discount)}</span>
                                    ) : '—'}
                                </td>
                            )}
                            {visibleColumns.final && <td className="px-2 py-1 text-right text-xs font-semibold">{fmtNum(item.final_amount)}</td>}
                        </tr>
                    ))}
                    {/* Items totals row */}
                    <tr className="font-bold text-xs border-t-2 border-b border-gray-500">
                        <td className="px-2 py-1" colSpan={[visibleColumns.sl, visibleColumns.category, visibleColumns.description].filter(Boolean).length || 1}>Total</td>
                        {visibleColumns.amount && <td className="px-2 py-1 text-right">{fmtNum(totals.totalBill)}</td>}
                        {visibleColumns.discount && (
                            <td className="px-2 py-1 text-right">
                                {totals.totalDiscount > 0 ? `-${fmtNum(totals.totalDiscount)}` : '—'}
                            </td>
                        )}
                        {visibleColumns.final && <td className="px-2 py-1 text-right">{fmtNum(totals.netAmount)}</td>}
                    </tr>
                </tbody>
            </table>

            {/* ── Bill Totals ─────────────────────────────────────────────────── */}
            <table className="w-full text-sm mt-3">
                <tbody>
                    <tr className="border">
                        <td className="border px-2 py-1 text-right" colSpan={Math.max(1, visibleColumnCount - 1)}>Total Bill Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(totals.totalBill)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1 text-right" colSpan={Math.max(1, visibleColumnCount - 1)}>Total Discount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{totals.totalDiscount > 0 ? `-${fmtNum(totals.totalDiscount)}` : '0.00'}</td>
                    </tr>
                    <tr className="border font-bold">
                        <td className="border px-2 py-1 text-right" colSpan={Math.max(1, visibleColumnCount - 1)}>Net Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(totals.netAmount)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1 text-right" colSpan={Math.max(1, visibleColumnCount - 1)}>Paid Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(totals.paidAmount)}</td>
                    </tr>
                    <tr className="border">
                        <td
                            className="border px-2 py-1 text-right font-bold"
                            colSpan={Math.max(1, visibleColumnCount - 1)}
                        >
                            {totals.dueAmount > 0 ? `Due Amount (${currencySymbol}):` : `Balance (${currencySymbol}):`}
                        </td>
                        <td
                            className="border px-2 py-1 text-right font-bold"
                            colSpan={1}
                        >
                            {fmtNum(totals.dueAmount)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <p className="text-sm mt-6 italic">Total In Words: {amountToWords(totals.netAmount)}</p>


            {/* ── Signature Row ───────────────────────────────────────────────── */}
            <div className="flex justify-between mt-32 text-sm w-full">
                <div style={{ textAlign: 'left' }}>
                    <p className="border-t border-dashed pt-1">Prepared By: <span className="font-medium">{currentUserName || '-'}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className="inline-block border-t border-dashed pt-1">Authorized Signature:</span>
                </div>
            </div>

        </div>
    )
}
