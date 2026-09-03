import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Loader2, ArrowLeft, Printer, Building2, CreditCard, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { FONT_SIZE_OPTIONS, DEFAULT_FONT_SIZE, type FontSizeKey } from '@/lib/print-font-size'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { amountToWords } from '@/lib/utils'

const API_URL = import.meta.env.VITE_API_URL

// Same paper sizes / margins as the admission payment receipt and the outdoor
// invoice's own Print Settings — the 80mm thermal option matters here since
// receipts are commonly printed on a receipt/thermal printer at the counter.
const PAPER_SIZES: Record<string, { label: string; cssSize: string; margin: string }> = {
    a4: { label: 'A4', cssSize: 'A4 portrait', margin: '12mm' },
    a5: { label: 'A5', cssSize: 'A5 portrait', margin: '8mm' },
    letter: { label: 'Letter', cssSize: 'letter portrait', margin: '12mm' },
    legal: { label: 'Legal', cssSize: 'legal portrait', margin: '12mm' },
    thermal80: { label: '80mm (Thermal)', cssSize: '80mm auto', margin: '2mm' },
}

type ReceiptPadding = { top: number; right: number; bottom: number; left: number }
const DEFAULT_PADDING: ReceiptPadding = { top: 20, right: 20, bottom: 20, left: 20 }

// Shares the same company_settings print-defaults as the admission payment
// receipt (payment_receipt_*) — it's the same document type (a Receipt
// Voucher), just sourced from a different module, so one shared default
// keeps every voucher the hospital prints looking consistent.
type CompanySettings = {
    company_name?: string
    company_logo?: string | null
    address1?: string | null
    address2?: string | null
    phone?: string | null
    email?: string | null
    payment_receipt_padding_top?: number
    payment_receipt_padding_right?: number
    payment_receipt_padding_bottom?: number
    payment_receipt_padding_left?: number
    payment_receipt_font_size?: string
    payment_receipt_paper_size?: string
    payment_receipt_show_signatures?: boolean
}

type InvoicePayment = {
    id: number
    invoice_id: number
    amount: number
    method: string
    payment_date: string
    created_at: string
    creator?: {
        id: number
        name: string
    } | null
}

type InvoiceData = {
    id: number
    invoice_prefix: string | null
    patient_name: string
    age?: number
    age_text?: string
    sex: string
    phone: string
    invoice_date: string
    doctor?: {
        doctor_name: string
        speciality: string
    }
    payments?: InvoicePayment[]
}

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/invoices/$invoiceId/payment-receipt/$paymentId',
)({
    component: InvoicePaymentReceiptPrintPage,
})

function InvoicePaymentReceiptPrintPage() {
    const { invoiceId, paymentId } = Route.useParams()
    const { format, currencySymbol } = useCurrency()
    const { formatDate } = useDateFormat()
    const token = getCookie('accessToken')

    const hasPrinted = useRef(false)
    const queryClient = useQueryClient()

    // Print Settings
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('a4')
    const [fontSize, setFontSize] = useState<FontSizeKey>(DEFAULT_FONT_SIZE)
    const [padding, setPadding] = useState<ReceiptPadding>(DEFAULT_PADDING)
    const [showSignatures, setShowSignatures] = useState(true)
    const { cssSize, margin } = PAPER_SIZES[paperSize]

    // Fetch company settings
    const { data: companySettings } = useQuery<CompanySettings>({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) return {}
            const d = await res.json()
            return d.data
        },
        enabled: !!token,
    })

    // Seed every print-setting control from the saved company-wide default once it loads.
    useEffect(() => {
        if (!companySettings) return
        setPadding({
            top: companySettings.payment_receipt_padding_top ?? DEFAULT_PADDING.top,
            right: companySettings.payment_receipt_padding_right ?? DEFAULT_PADDING.right,
            bottom: companySettings.payment_receipt_padding_bottom ?? DEFAULT_PADDING.bottom,
            left: companySettings.payment_receipt_padding_left ?? DEFAULT_PADDING.left,
        })
        if (companySettings.payment_receipt_font_size && companySettings.payment_receipt_font_size in FONT_SIZE_OPTIONS) {
            setFontSize(companySettings.payment_receipt_font_size as FontSizeKey)
        }
        if (companySettings.payment_receipt_paper_size && companySettings.payment_receipt_paper_size in PAPER_SIZES) {
            setPaperSize(companySettings.payment_receipt_paper_size as keyof typeof PAPER_SIZES)
        }
        if (companySettings.payment_receipt_show_signatures !== undefined) {
            setShowSignatures(Boolean(companySettings.payment_receipt_show_signatures))
        }
    }, [companySettings])

    // Persist every print setting as the company-wide default — every payment
    // receipt print (indoor or outdoor) picks it up via /api/company-settings.
    const saveDefaultsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/company-settings`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_receipt_padding_top: padding.top,
                    payment_receipt_padding_right: padding.right,
                    payment_receipt_padding_bottom: padding.bottom,
                    payment_receipt_padding_left: padding.left,
                    payment_receipt_font_size: fontSize,
                    payment_receipt_paper_size: paperSize,
                    payment_receipt_show_signatures: showSignatures,
                }),
            })
            if (!res.ok) throw new Error('Failed to save print settings')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Default print settings saved — applies to every payment receipt print from now on')
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
        },
        onError: () => toast.error('Failed to save default print settings'),
    })

    // Fetch invoice details (payments are embedded — outdoor has no separate
    // payments-list endpoint the way admission does).
    const { data: invoiceResData, isLoading: invoiceLoading } = useQuery({
        queryKey: ['outdoor-invoice', invoiceId],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/outdoor-invoice/${invoiceId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        enabled: !!token && !!invoiceId,
    })

    const invoice = invoiceResData?.data as InvoiceData | undefined
    const currentPayment = invoice?.payments?.find((p) => p.id === Number(paymentId))

    // Auto-print only on initial load, not on refresh
    useEffect(() => {
        if (invoice && currentPayment && !hasPrinted.current) {
            const printKey = `outdoor-payment-print-${paymentId}`
            const alreadyPrinted = sessionStorage.getItem(printKey)

            if (!alreadyPrinted) {
                hasPrinted.current = true
                sessionStorage.setItem(printKey, 'true')
                setTimeout(() => {
                    window.print()
                }, 500)
            }
        }
    }, [invoice, currentPayment, paymentId])

    if (invoiceLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading payment details...</p>
                </div>
            </div>
        )
    }

    if (!invoice || !currentPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <p className="text-red-600 text-lg font-semibold mb-4">Payment Receipt Not Found</p>
                    <Button onClick={() => window.history.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    const fmtDateTime = (d: any) => {
        if (!d) return '-'
        const date = new Date(d)
        return `${formatDate(date)} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    }

    // Every outdoor invoice payment is a straightforward collection — there's no
    // advance/refund concept on this table the way admission has, so this is
    // always a plain Receipt Voucher.
    const voucherNo = `RV-${String(currentPayment.id).padStart(6, '0')}`
    const absAmount = Math.abs(Number(currentPayment.amount))
    const invoiceRef = invoice.invoice_prefix || `INV-${invoice.id}`
    const particulars = `Payment received against Invoice No. ${invoiceRef} (${invoice.patient_name || '-'})`

    return (
        <>
            <AppHeader fixed className="print:hidden" />
            <Main>
                <div className="max-w-3xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:mt-0 print:pb-0 print-report" style={{ paddingTop: '20px' }}>
                    <style>{`
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            .no-print { display: none !important; }
                            .receipt-voucher-print-area {
                                padding-top: ${padding.top}px !important;
                                padding-right: ${padding.right}px !important;
                                padding-bottom: ${padding.bottom}px !important;
                                padding-left: ${padding.left}px !important;
                            }
                        }
                        @page {
                            margin: ${margin};
                            size: ${cssSize};
                        }
                    `}</style>

                    {/* Header Action Buttons */}
                    <div className="print:hidden flex items-center justify-between gap-4 mb-6">
                        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setSettingsOpen(true)}>
                                <Settings2 className="h-4 w-4" />
                                <span>Print Settings</span>
                            </Button>
                            <Button variant="default" size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                <Printer className="mr-2 h-4 w-4" />
                                Print Receipt
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
                                        <SheetDescription className="text-xs font-normal text-left">Adjust how this voucher looks and prints</SheetDescription>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Font Size</Label>
                                    <Select value={fontSize} onValueChange={(v) => setFontSize(v as FontSizeKey)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Font size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(FONT_SIZE_OPTIONS).map(([key, opt]) => (
                                                <SelectItem key={key} value={key}>{opt.label}</SelectItem>
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
                                <div className="flex items-center gap-2 pt-1">
                                    <Checkbox
                                        id="show-signatures"
                                        checked={showSignatures}
                                        onCheckedChange={(checked) => setShowSignatures(checked === true)}
                                    />
                                    <Label htmlFor="show-signatures" className="text-sm font-medium cursor-pointer select-none">
                                        Signatures
                                    </Label>
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
                                    Saved defaults apply to every payment receipt print, not just this one.
                                </p>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Voucher frame */}
                    <div
                        className="receipt-voucher-print-area border border-gray-400 dark:border-gray-600"
                        style={{
                            zoom: FONT_SIZE_OPTIONS[fontSize].zoom,
                            paddingTop: padding.top,
                            paddingRight: padding.right,
                            paddingBottom: padding.bottom,
                            paddingLeft: padding.left,
                        } as CSSProperties}
                    >

                        {/* Brand + Voucher title bar */}
                        <div className="flex items-start justify-between gap-6 p-5 border-b border-gray-400 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                                {companySettings?.company_logo ? (
                                    <img
                                        src={companySettings.company_logo.startsWith('http') ? companySettings.company_logo : `${API_URL}${companySettings.company_logo}`}
                                        alt="Hospital Logo"
                                        className="h-14 w-14 object-contain"
                                    />
                                ) : (
                                    <div className="p-3 bg-blue-600 rounded-full shadow-lg">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                )}
                                <div className="text-left">
                                    <h1 className="text-xl font-bold leading-tight">
                                        {companySettings?.company_name || 'Sheba Hospital'}
                                    </h1>
                                    <div className="text-muted-foreground text-xs space-y-0.5 mt-0.5">
                                        {companySettings?.address1 && <p>{companySettings.address1}</p>}
                                        {companySettings?.address2 && <p>{companySettings.address2}</p>}
                                        {(companySettings?.phone || companySettings?.email) && (
                                            <p>
                                                {companySettings.phone && `Phone: ${companySettings.phone}`}
                                                {companySettings.phone && companySettings.email && ' | '}
                                                {companySettings.email && `Email: ${companySettings.email}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <h2 className="text-lg font-bold uppercase tracking-wider">
                                    Receipt Voucher
                                </h2>
                                <p className="text-sm mt-1">Voucher No: <span className="font-mono font-semibold">{voucherNo}</span></p>
                                <p className="text-sm">Date: {fmtDateTime(currentPayment.payment_date || currentPayment.created_at)}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                                    Payment
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Received from / patient details */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm pb-4 border-b border-dashed">
                                <div>
                                    <span className="text-muted-foreground">Received From:</span>
                                    <p className="font-semibold">{invoice.patient_name || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Invoice No:</span>
                                    <p className="font-semibold">{invoiceRef}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Age / Sex:</span>
                                    <p className="font-medium">{invoice.age_text || invoice.age || '-'} / {invoice.sex?.toUpperCase() || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Phone:</span>
                                    <p className="font-medium">{invoice.phone || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Invoice Date:</span>
                                    <p className="font-medium">{invoice.invoice_date ? formatDate(new Date(invoice.invoice_date)) : '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Referring Doctor:</span>
                                    <p className="font-medium">{invoice.doctor?.doctor_name || '-'}</p>
                                </div>
                            </div>

                            {/* Particulars table */}
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-400 dark:border-gray-600">
                                        <th className="text-left py-2 font-semibold w-2/3">Particulars</th>
                                        <th className="text-right py-2 font-semibold w-1/3">Amount ({currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-dashed">
                                        <td className="py-3 pr-4">{particulars}</td>
                                        <td className="py-3 text-right font-medium align-top">{format(absAmount)}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-400 dark:border-gray-600">
                                        <td className="py-2 font-bold text-right">Total</td>
                                        <td className="py-2 text-right font-bold">{format(absAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Payment mode / collected by */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Payment Mode:</span>
                                    <p className="font-medium capitalize flex items-center gap-1.5">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        {currentPayment.method || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Collected By:</span>
                                    <p className="font-medium">{currentPayment.creator?.name || '-'}</p>
                                </div>
                            </div>

                            {/* Amount in words + boxed total */}
                            <div className="flex items-stretch gap-4">
                                <div className="flex-1 border border-dashed rounded p-3 text-sm">
                                    <span className="text-muted-foreground block mb-1">In Words:</span>
                                    <p className="font-semibold italic">Taka {amountToWords(absAmount)}</p>
                                </div>
                                <div className="border border-gray-400 dark:border-gray-600 rounded px-6 py-2 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Payment Amount</span>
                                    <span className="text-2xl font-bold whitespace-nowrap">{format(absAmount)}</span>
                                </div>
                            </div>

                            {/* Signatures */}
                            {showSignatures && (
                                <div className="grid grid-cols-3 text-sm pt-14 text-center">
                                    <div>
                                        <p className="border-t border-dashed w-36 pt-1 mx-auto">Prepared By</p>
                                    </div>
                                    <div>
                                        <p className="border-t border-dashed w-36 pt-1 mx-auto">Received By</p>
                                    </div>
                                    <div>
                                        <p className="border-t border-dashed w-36 pt-1 mx-auto">Authorized Signatory</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-300 dark:border-gray-700 px-5 py-2 text-center text-[10px] text-muted-foreground">
                            This is a computer-generated payment voucher and does not require a physical seal.
                        </div>
                    </div>

                </div>
            </Main>
        </>
    )
}
