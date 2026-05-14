import { useMemo } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'

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
        patient_name: string
        phone?: string
        patient_address?: string
        admission_date: string
        discharge_date?: string
        bed_number?: string
        cabin_number?: string
        doctor_name?: string
    }
    discountDoctor?: {
        doctor_name?: string
    }
}

type FinalBillPrintPageProps = {
    finalBill: FinalBill
    onClose?: () => void
    paddingTop?: number
}

export function FinalBillPrintPage({ finalBill, onClose, paddingTop = 40 }: FinalBillPrintPageProps) {
    const { currencySymbol, format } = useCurrency()
    const admission = finalBill.admission || {} as FinalBill['admission']
    const items = finalBill.items || []

    const totals = useMemo(() => {
        const totalBill = Number(finalBill.total_bill_amount) || 0
        const totalDiscount = items.reduce((sum, item) => sum + (Number(item.total_discount) || 0), 0)
        const netAmount = Number(finalBill.total_discounted_amount) || 0
        const paidAmount = Number(finalBill.paid_amount) || 0
        const dueAmount = Number(finalBill.due_amount) || 0
        return { totalBill, totalDiscount, netAmount, paidAmount, dueAmount }
    }, [finalBill, items])

    const getServiceTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            bed_charges: 'Bed Charges',
            operation: 'Operation Charges',
            consultant: 'Consultant Fees',
            surgeon: 'Surgeon Fees',
            assistant: 'Assistant Fees',
            service: 'Clinical Services',
            medicine: 'Medicine',
            other: 'Other Charges',
        }
        return labels[type] || type
    }

    // const groupedItems = items.reduce((acc, item) => {
    //     if (!acc[item.service_type]) {
    //         acc[item.service_type] = []
    //     }
    //     acc[item.service_type].push(item)
    //     return acc
    // }, {} as Record<string, FinalBillItem[]>)

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    return (
        <div className="max-w-4xl w-full mx-auto bg-background pb-10 px-5 print:w-[850px] print-report" style={{ paddingTop: `${paddingTop}px` }}>
            <style>
                {`
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

                  .bg-background {
                    background-color: #fff;
                  }

                  body{
                    color: #000;
                    background-color: #fff;
                  }

                  .border{
                    border-color: oklch(0.929 0.013 255.508);
                  }

                  .border-dashed{
                    border-color: oklch(0.929 0.013 255.508);
                  }
                }
                `}
            </style>

            {onClose && (
                <div className="flex justify-end mb-4 print:hidden">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="w-4 h-4 mr-2" />
                        Close
                    </Button>
                </div>
            )}

            <h1 className="text-2xl font-bold text-center underline mb-6 tracking-wide uppercase">
                FINAL BILL INVOICE
            </h1>

            <table className="w-full text-sm border">
                <tbody>
                    <tr className="border">
                        <td className="border px-3 py-2 w-1/4">Bill ID: #{finalBill.id}</td>
                        <td className="border px-3 py-2 w-1/4">Admission ID: #{finalBill.admission_id}</td>
                        <td className="border px-3 py-2 w-1/4">Date: {formatDate(finalBill.created_at)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2" colSpan={2}>Patient Name: {admission?.patient_name || 'Unknown'}</td>
                        <td className="border px-3 py-2">Phone: {admission?.phone || 'N/A'}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2">Admission Date: {formatDate(admission?.admission_date || finalBill.created_at)}</td>
                        <td className="border px-3 py-2">Discharge Date: {admission?.discharge_date ? formatDate(admission.discharge_date) : 'Active'}</td>
                        <td className="border px-3 py-2">{(admission?.bed_number || admission?.cabin_number) ? `Room: ${admission?.bed_number || admission?.cabin_number}` : 'Room: N/A'}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2" colSpan={3}>
                            Attending Doctor: {admission?.doctor_name ? `Dr. ${admission.doctor_name}` : 'N/A'}
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="w-full text-sm mt-6">
                <thead>
                    <tr className="border-t border-b bg-row-blue">
                        <th className="px-2 py-2 text-left w-[40%] text-xs">Description</th>
                        <th className="px-2 py-2 text-center w-[10%] text-xs">Qty</th>
                        <th className="px-2 py-2 text-right w-[15%] text-xs">Unit Price ({currencySymbol})</th>
                        <th className="px-2 py-2 text-right w-[15%] text-xs">Amount ({currencySymbol})</th>
                        <th className="px-2 py-2 text-right w-[10%] text-xs">Disc. ({currencySymbol})</th>
                        <th className="px-2 py-2 text-right w-[10%] text-xs">Final ({currencySymbol})</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} className="border-b border-dashed">
                            <td className="px-3 py-2">
                                <span className="text-xs font-semibold text-gray-700 uppercase">{getServiceTypeLabel(item.service_type)} </span>{item.service_name}
                                {item.service_note && (
                                    <span className="block text-xs text-gray-600">{item.service_note}</span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{format(item.unit_price)}</td>
                            <td className="px-3 py-2 text-right">{format(item.total_amount)}</td>
                            <td className="px-3 py-2 text-right">
                                {item.total_discount > 0 ? (
                                    <span className="text-red-600">-{format(item.total_discount)}</span>
                                ) : (
                                    '-'
                                )}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">{format(item.final_amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="w-full text-sm mt-6">
                <tbody>
                    <tr className="border">
                        <td className="border px-3 py-2 text-right font-semibold" colSpan={2}>Total Bill Amount:</td>
                        <td className="border px-3 py-2 text-right font-semibold" colSpan={4}>{format(totals.totalBill)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2 text-right text-red-600 font-semibold" colSpan={2}>Total Discount:</td>
                        <td className="border px-3 py-2 text-right text-red-600 font-semibold" colSpan={4}>-{format(totals.totalDiscount)}</td>
                    </tr>
                    <tr className="border bg-row-blue">
                        <td className="border px-3 py-2 text-right font-bold" colSpan={2}>Net Amount:</td>
                        <td className="border px-3 py-2 text-right font-bold" colSpan={4}>{format(totals.netAmount)}</td>
                    </tr>
                    <tr className="border">
                        <td className="border px-3 py-2 text-right text-green-700" colSpan={2}>Paid Amount:</td>
                        <td className="border px-3 py-2 text-right text-green-700" colSpan={4}>{format(totals.paidAmount)}</td>
                    </tr>
                    <tr className="border">
                        <td className={`border px-3 py-2 text-right font-bold ${totals.dueAmount > 0 ? 'text-red-700' : 'text-green-700'}`} colSpan={2}>
                            {totals.dueAmount > 0 ? 'Due Amount:' : 'Balance:'}
                        </td>
                        <td className={`border px-3 py-2 text-right font-bold ${totals.dueAmount > 0 ? 'text-red-700' : 'text-green-700'}`} colSpan={4}>
                            {format(totals.dueAmount)}
                        </td>
                    </tr>
                </tbody>
            </table>


            <div className="grid grid-cols-2 mt-32 text-sm">
                <div>
                    <p className="border-t border-dashed w-40 pt-1 text-center">Prepared By:</p>
                </div>
                <div className="text-right">
                    <p className="border-t border-dashed w-56 ml-auto pt-1">Authority Signature:</p>
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
