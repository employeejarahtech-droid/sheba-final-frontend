import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'
import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'

const API_URL = import.meta.env.VITE_API_URL || ''

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
    paddingTop?: number
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
    paddingTop = 40,
}: FinalBillPrintPageProps) {
    const { currencySymbol, locale } = useCurrency()
    const admission = finalBill.admission || {} as FinalBill['admission']
    const token = getCookie('accessToken')

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
            className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 print:w-[850px] print-report"
            style={{ paddingTop: `${paddingTop}px` }}
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
                .bg-background { background-color: #fff; }
                body { color: #000; background-color: #fff; }
                .border { border-color: oklch(0.929 0.013 255.508); }
                .border-dashed { border-color: oklch(0.929 0.013 255.508); }
              }
            `}</style>

            {onClose && (
                <div className="flex justify-end mb-4 print:hidden">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="w-4 h-4 mr-2" />
                        Close
                    </Button>
                </div>
            )}

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
                        <th className="px-2 py-1 text-left text-xs w-[4%]">#</th>
                        <th className="px-2 py-1 text-left text-xs w-[57%]">Description</th>
                        <th className="px-2 py-1 text-right text-xs w-[13%]">Amount ({currencySymbol})</th>
                        <th className="px-2 py-1 text-right text-xs w-[13%]">Disc. ({currencySymbol})</th>
                        <th className="px-2 py-1 text-right text-xs w-[13%]">Final ({currencySymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-dashed">
                            <td className="px-2 py-1 text-xs text-gray-500">{item.serial_no || idx + 1}</td>
                            <td className="px-2 py-1 text-xs">
                                <span className="font-semibold text-gray-700 uppercase">
                                    {SERVICE_TYPE_LABELS[item.service_type] || item.service_type}{' '}
                                </span>
                                {item.service_name}
                                {item.service_note && (
                                    <span className="block text-gray-500 mt-0.5">{item.service_note}</span>
                                )}
                            </td>
                            <td className="px-2 py-1 text-right text-xs">{fmtNum(item.total_amount)}</td>
                            <td className="px-2 py-1 text-right text-xs">
                                {item.total_discount > 0 ? (
                                    <span>-{fmtNum(item.total_discount)}</span>
                                ) : '—'}
                            </td>
                            <td className="px-2 py-1 text-right text-xs font-semibold">{fmtNum(item.final_amount)}</td>
                        </tr>
                    ))}
                    {/* Items totals row */}
                    <tr className="font-bold text-xs border-t-2 border-b border-gray-500">
                        <td className="px-2 py-1" colSpan={2}>Total</td>
                        <td className="px-2 py-1 text-right">{fmtNum(totals.totalBill)}</td>
                        <td className="px-2 py-1 text-right">
                            {totals.totalDiscount > 0 ? `-${fmtNum(totals.totalDiscount)}` : '—'}
                        </td>
                        <td className="px-2 py-1 text-right">{fmtNum(totals.netAmount)}</td>
                    </tr>
                </tbody>
            </table>

            {/* ── Bill Totals ─────────────────────────────────────────────────── */}
            <table className="w-full text-sm mt-3">
                <tbody>
                    <tr className="border">
                        <td className="border px-2 py-1 text-right" colSpan={4}>Total Bill Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(totals.totalBill)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1 text-right" colSpan={4}>Total Discount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{totals.totalDiscount > 0 ? `-${fmtNum(totals.totalDiscount)}` : '0.00'}</td>
                    </tr>
                    <tr className="border font-bold">
                        <td className="border px-2 py-1 text-right" colSpan={4}>Net Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(totals.netAmount)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-2 py-1 text-right" colSpan={4}>Paid Amount ({currencySymbol}):</td>
                        <td className="border px-2 py-1 text-right" colSpan={1}>{fmtNum(totals.paidAmount)}</td>
                    </tr>
                    <tr className="border">
                        <td
                            className="border px-2 py-1 text-right font-bold"
                            colSpan={4}
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

            {totals.totalDiscount > 0 && (
                <p className="text-sm mt-1">
                    Discount Authorized By: {finalBill.discountDoctor?.doctor_name
                        ? `Dr. ${finalBill.discountDoctor.doctor_name}`
                        : finalBill.discounted_by_user?.name || '-'}
                </p>
            )}


            {/* ── Signature Row ───────────────────────────────────────────────── */}
            <div className="flex justify-between mt-32 text-sm w-full">
                <div style={{ textAlign: 'left' }}>
                    <span className="inline-block border-t border-dashed pt-1">Prepared By:</span>
                    <p className="font-medium">
                        {finalBill.discounted_by_user?.name
                            || finalBill.total_discounted_by_user?.name
                            || finalBill.created_by_user?.name
                            || admission?.bill_created_by_user?.name
                            || admission?.created_by_user?.name
                            || '-'}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className="inline-block border-t border-dashed pt-1">Authorized Signature:</span>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-10 print:hidden">
                <Button variant="outline" onClick={() => window.print()}>
                    Print
                </Button>
            </div>
        </div>
    )
}
