import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Building2, CreditCard, Printer, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { amountToWords } from '@/lib/utils'
import { FONT_SIZE_OPTIONS, DEFAULT_FONT_SIZE, type FontSizeKey } from '@/lib/print-font-size'
import { useGetExpenseByIdQuery, useGetIncomeByIdQuery } from '@/features/accounting/accountingQueries'

const API_URL = import.meta.env.VITE_API_URL

// Same paper sizes / margins as the outdoor invoice and payment-receipt
// Print Settings — the 80mm thermal option matters since some counters
// print vouchers on a receipt printer.
const PAPER_SIZES: Record<string, { label: string; cssSize: string; margin: string }> = {
    a4: { label: 'A4', cssSize: 'A4 portrait', margin: '12mm' },
    a5: { label: 'A5', cssSize: 'A5 portrait', margin: '8mm' },
    letter: { label: 'Letter', cssSize: 'letter portrait', margin: '12mm' },
    legal: { label: 'Legal', cssSize: 'legal portrait', margin: '12mm' },
    thermal80: { label: '80mm (Thermal)', cssSize: '80mm auto', margin: '2mm' },
}

type VoucherPadding = { top: number; right: number; bottom: number; left: number }
const DEFAULT_PADDING: VoucherPadding = { top: 20, right: 20, bottom: 20, left: 20 }

type CompanySettings = {
    company_name?: string
    company_logo?: string | null
    address1?: string | null
    address2?: string | null
    phone?: string | null
    email?: string | null
    transaction_voucher_padding_top?: number
    transaction_voucher_padding_right?: number
    transaction_voucher_padding_bottom?: number
    transaction_voucher_padding_left?: number
    transaction_voucher_font_size?: string
    transaction_voucher_paper_size?: string
    transaction_voucher_show_border?: boolean
    transaction_voucher_show_signatures?: boolean
}

type VoucherType = 'income' | 'expense'

// Shared voucher layout for both accounting transaction kinds — income (money
// received) and expense (money paid out). Mirrors the letterhead/particulars/
// amount-in-words/signature layout already used by the admission and outdoor
// payment-receipt vouchers, including the same Print Settings sheet pattern
// (paper size, font size, padding, border/signature toggles), persisted to
// company_settings via transaction_voucher_* so it applies to every income
// and expense voucher print from then on.
export function TransactionVoucherPrint({ type, id, backTo }: { type: VoucherType; id: string; backTo: string }) {
    const { format, currencySymbol } = useCurrency()
    const { formatDateTime } = useDateFormat()
    const isIncome = type === 'income'
    const queryClient = useQueryClient()
    const currentUserName = useAuthStore((s) => s.user?.name)

    // Only the query matching `type` is enabled — the other stays idle.
    const { data: incomeData, isLoading: incomeLoading } = useGetIncomeByIdQuery(isIncome ? id : undefined)
    const { data: expenseData, isLoading: expenseLoading } = useGetExpenseByIdQuery(!isIncome ? id : undefined)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: any = isIncome ? incomeData?.data : expenseData?.data
    const isLoading = isIncome ? incomeLoading : expenseLoading

    // Print Settings
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('a4')
    const [fontSize, setFontSize] = useState<FontSizeKey>(DEFAULT_FONT_SIZE)
    const [padding, setPadding] = useState<VoucherPadding>(DEFAULT_PADDING)
    const [showBorder, setShowBorder] = useState(true)
    const [showSignatures, setShowSignatures] = useState(true)
    const { cssSize, margin } = PAPER_SIZES[paperSize]

    const { data: companySettings } = useQuery<CompanySettings>({
        queryKey: ['company-settings'],
        queryFn: async () => (await api.get('/company-settings')).data.data,
    })

    // Seed every print-setting control from the saved company-wide default once it loads.
    useEffect(() => {
        if (!companySettings) return
        setPadding({
            top: companySettings.transaction_voucher_padding_top ?? DEFAULT_PADDING.top,
            right: companySettings.transaction_voucher_padding_right ?? DEFAULT_PADDING.right,
            bottom: companySettings.transaction_voucher_padding_bottom ?? DEFAULT_PADDING.bottom,
            left: companySettings.transaction_voucher_padding_left ?? DEFAULT_PADDING.left,
        })
        if (companySettings.transaction_voucher_font_size && companySettings.transaction_voucher_font_size in FONT_SIZE_OPTIONS) {
            setFontSize(companySettings.transaction_voucher_font_size as FontSizeKey)
        }
        if (companySettings.transaction_voucher_paper_size && companySettings.transaction_voucher_paper_size in PAPER_SIZES) {
            setPaperSize(companySettings.transaction_voucher_paper_size as keyof typeof PAPER_SIZES)
        }
        if (companySettings.transaction_voucher_show_border !== undefined) {
            setShowBorder(Boolean(companySettings.transaction_voucher_show_border))
        }
        if (companySettings.transaction_voucher_show_signatures !== undefined) {
            setShowSignatures(Boolean(companySettings.transaction_voucher_show_signatures))
        }
    }, [companySettings])

    // Persist every print setting as the company-wide default — every income
    // and expense voucher print picks it up via /api/company-settings.
    const saveDefaultsMutation = useMutation({
        mutationFn: async () => {
            await api.put('/company-settings', {
                transaction_voucher_padding_top: padding.top,
                transaction_voucher_padding_right: padding.right,
                transaction_voucher_padding_bottom: padding.bottom,
                transaction_voucher_padding_left: padding.left,
                transaction_voucher_font_size: fontSize,
                transaction_voucher_paper_size: paperSize,
                transaction_voucher_show_border: showBorder,
                transaction_voucher_show_signatures: showSignatures,
            })
        },
        onSuccess: () => {
            toast.success('Default print settings saved — applies to every income/expense voucher print from now on')
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
        },
        onError: () => toast.error('Failed to save default print settings'),
    })

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!record) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <p className="text-red-600 text-lg font-semibold mb-4">
                        {isIncome ? 'Income' : 'Expense'} record not found
                    </p>
                    <Button onClick={() => window.history.back()} variant="outline">Go Back</Button>
                </div>
            </div>
        )
    }

    const voucherType = isIncome ? 'Receipt' : 'Payment'
    const voucherTitle = isIncome ? 'Receipt Voucher' : 'Payment Voucher'
    const voucherNo = `${isIncome ? 'RV' : 'PV'}-${String(record.id).padStart(6, '0')}`
    const amount = Math.abs(Number(record.amount) || 0)
    const dateValue = record[isIncome ? 'income_date' : 'expense_date'] || record.date || record.created_at
    const head = (isIncome ? record.creditHead?.name : record.debitHead?.name) || 'N/A'
    const particulars = record.description || record.title || '-'

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
                            .transaction-voucher-print-area {
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
                        <Link to={backTo}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setSettingsOpen(true)}>
                                <Settings2 className="h-4 w-4" />
                                <span>Print Settings</span>
                            </Button>
                            <Button variant="default" size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                <Printer className="mr-2 h-4 w-4" />
                                Print Voucher
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
                                        id="show-border"
                                        checked={showBorder}
                                        onCheckedChange={(checked) => setShowBorder(checked === true)}
                                    />
                                    <Label htmlFor="show-border" className="text-sm font-medium cursor-pointer select-none">
                                        Voucher Border
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
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
                                    Saved defaults apply to every income/expense voucher print, not just this one.
                                </p>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Voucher frame */}
                    <div
                        className={`transaction-voucher-print-area ${showBorder ? 'border border-gray-400 dark:border-gray-600' : ''}`}
                        style={{
                            zoom: FONT_SIZE_OPTIONS[fontSize].zoom,
                            paddingTop: padding.top,
                            paddingRight: padding.right,
                            paddingBottom: padding.bottom,
                            paddingLeft: padding.left,
                        } as CSSProperties}
                    >
                        {/* Header: Logo/Company (left 50%) + Title (right 50%) */}
                        <div className={`p-2 ${showBorder ? 'border-b border-gray-400 dark:border-gray-600' : ''}`}>
                            <div className="flex items-start justify-between gap-6">
                                <div className="w-3/5 flex items-center gap-4">
                                    {companySettings?.company_logo ? (
                                        <img
                                            src={companySettings.company_logo.startsWith('http') ? companySettings.company_logo : `${API_URL}${companySettings.company_logo}`}
                                            alt="Company Logo"
                                            className="w-24 h-24 object-contain"
                                        />
                                    ) : (
                                        <div className={`p-3 rounded-full shadow-lg ${isIncome ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                            <Building2 className="h-6 w-6 text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-2xl font-bold">{companySettings?.company_name || 'Sheba Hospital'}</h1>
                                        {companySettings?.address1 && (
                                            <p className="text-sm mt-1 leading-5">{companySettings.address1}</p>
                                        )}
                                        {companySettings?.address2 && (
                                            <p className="text-sm leading-5">{companySettings.address2}</p>
                                        )}
                                        {(companySettings?.phone || companySettings?.email) && (
                                            <p className="text-sm leading-5">
                                                {companySettings.phone && `Phone: ${companySettings.phone}`}
                                                {companySettings.phone && companySettings.email && ' | '}
                                                {companySettings.email && `Email: ${companySettings.email}`}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="w-2/5 text-right">
                                    <h2 className="text-lg font-bold tracking-widest uppercase">{voucherTitle}</h2>
                                    <p className="text-sm mt-1 leading-5">Voucher No: <span className="font-mono font-semibold">{voucherNo}</span></p>
                                    <p className="text-sm leading-5">Date: {formatDateTime(dateValue)}</p>
                                    <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                        isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                        ({(record.status || '-').toUpperCase()})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-0 space-y-5">
                            {/* Head */}
                            <table className="w-full text-sm border">
                                <tbody>
                                    <tr className="border">
                                        <td className="border px-2 py-1 whitespace-nowrap">
                                            {isIncome ? 'Income' : 'Expense'} Head: <strong>{head}</strong>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

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
                                        <td className="py-3 pr-4">
                                            {particulars}
                                            {record.reference_number && (
                                                <div className="text-xs text-muted-foreground mt-1">Ref: {record.reference_number}</div>
                                            )}
                                        </td>
                                        <td className="py-3 text-right font-medium align-top">{format(amount)}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-400 dark:border-gray-600">
                                        <td className="py-2 font-bold text-right">Total</td>
                                        <td className="py-2 text-right font-bold">{format(amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Payment mode / reference */}
                            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                <tbody>
                                    <tr>
                                        <td className="w-1/2 align-top pr-4">
                                            <span className="text-muted-foreground">Payment Mode:</span>
                                            <p className="font-medium capitalize flex items-center gap-1.5">
                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                {record.payment_method || '-'}
                                            </p>
                                        </td>
                                        <td className="w-1/2 align-top pl-4">
                                            <span className="text-muted-foreground">Reference:</span>
                                            <p className="font-medium">{record.reference_number || '-'}</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Amount in words + boxed total */}
                            <div className="flex items-stretch gap-4">
                                <div className="flex-1 border border-dashed rounded p-3 text-sm">
                                    <span className="text-muted-foreground block mb-1">In Words:</span>
                                    <p className="font-semibold italic">{amountToWords(amount)}</p>
                                </div>
                                <div className="border border-gray-400 dark:border-gray-600 rounded px-6 py-2 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{voucherType} Amount</span>
                                    <span className="text-2xl font-bold whitespace-nowrap">{format(amount)}</span>
                                </div>
                            </div>

                            {/* Signatures */}
                            {showSignatures && (
                                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr>
                                            <td className="w-1/3 text-center align-top pt-14">
                                                <p className="border-t border-dashed w-4/5 pt-1 mx-auto">Prepared By: <span className="font-medium">{currentUserName || '-'}</span></p>
                                            </td>
                                            <td className="w-1/3 text-center align-top pt-14">
                                                <p className="border-t border-dashed w-4/5 pt-1 mx-auto">{isIncome ? 'Received By' : 'Received By (Payee)'}</p>
                                            </td>
                                            <td className="w-1/3 text-center align-top pt-14">
                                                <p className="border-t border-dashed w-4/5 pt-1 mx-auto">Authorized Signatory</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className={`px-5 py-2 text-center text-[10px] text-muted-foreground ${showBorder ? 'border-t border-gray-300 dark:border-gray-700' : ''}`}>
                            This is a computer-generated {voucherType.toLowerCase()} voucher and does not require a physical seal.
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
