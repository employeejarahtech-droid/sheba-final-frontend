
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDateFormat } from '@/hooks/use-date-format'

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/invoices/$invoiceId',
)({
    component: InvoiceDetails,
})

function InvoiceDetails() {
    const { invoiceId } = Route.useParams();
    const token = getCookie('accessToken')

    // Tenant date format (from company settings) — date portion only; time is
    // appended separately to preserve the existing "date + time" display.
    const { formatDate: fmtDate } = useDateFormat();

    // Format an invoice timestamp using the tenant date format + a 12h time.
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `${fmtDate(date)} ${timeStr}`;
    };

    // Format the delivery date. delivery_time is stored as a separate string field
    // (e.g. "06:00 PM"), so we only take the date portion from delivery_date and
    // append delivery_time when present. Returns '-' when no date.
    const formatDeliveryDate = (dateString: string | null, timeString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        const dateStr = fmtDate(date);
        return timeString ? `${dateStr} ${timeString}` : dateStr;
    };

    // Fetch existing test data
    const { data: invoice } = useQuery({
        queryKey: ["invoice", invoiceId],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch invoice");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!invoiceId,
    });

    // Fetch company settings for company name, address and logo
    const { data: companySettings } = useQuery({
        queryKey: ["company-settings"],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch company settings");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token,
    });

    // Get company logo URL
    const companyLogo = companySettings?.company_logo
        ? (companySettings.company_logo.startsWith('http') || companySettings.company_logo.startsWith('data:'))
            ? companySettings.company_logo
            : `${import.meta.env.VITE_API_URL}${companySettings.company_logo}`
        : null;

    const companyName = companySettings?.company_name || 'Hospital';

    //console.log('invoice', invoice)

    const totalDiscounts = invoice?.department_discounts?.reduce((total: any, discount: any) => total + Number(discount.discount), 0);

    const totalPayments = invoice?.payments?.reduce((total: any, payment: any) => total + Number(payment.amount), 0);

    const dueAmount = Number(invoice?.net_amount) - Number(totalPayments);

    return (
        <>
            {/* ===== Print Styles ===== */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm;
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
                        padding: 0 !important;
                        box-shadow: none !important;
                    }
                    .invoice-print-area table {
                        width: 100% !important;
                    }
                    /* Avoid breaking rows across pages */
                    tr, td, th {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* ===== Top Heading ===== */}
            <AppHeader fixed />
            <Main>
                {/* Back Button */}
                <div className="max-w-3xl mx-auto w-full px-8 pt-6 print:hidden">
                    <Button
                        variant="outline"
                        className="mb-4"
                        onClick={() => window.location.href = '/dashboard/outdoor/reception/invoices/list'}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to List
                    </Button>
                </div>

                <div className="invoice-print-area max-w-3xl mx-auto w-full p-8 bg-white">

                    {/* Header */}
                    <div className="mb-6">
                        <div className='flex justify-center items-center gap-8'>
                            {companyLogo ? (
                                <img
                                    src={companyLogo}
                                    alt="Company Logo"
                                    className="w-24 h-24 object-contain"
                                />
                            ) : null}

                            <div className="text-center">
                                <h1 className="text-2xl font-bold">{companyName}</h1>
                                <p className="text-sm mt-1 leading-5">
                                    {companySettings?.address1 || ''}
                                    {companySettings?.address2 ? <><br />{companySettings.address2}</> : null}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mb-2">
                        <h2 className="text-xl font-semibold underline mt-4">INVOICE</h2>
                    </div>


                    {/* Patient Information */}
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                            <p>Receipt ID : {invoice?.invoice_prefix || invoice?.id}</p>
                            <p>Patient's Name : {invoice?.patient_name}</p>
                            <p>Ref. Doctor : {invoice?.doctor?.doctor_name || '-'}</p>
                            <p>Contact No : {invoice?.phone || '-'} </p>
                            <p>Age : {invoice?.age_text || (invoice?.age ? `${invoice.age}Y` : '-')}</p>
                        </div>

                        <div className="text-right">
                            <p>Del. Date: {formatDeliveryDate(invoice?.delivery_date, invoice?.delivery_time)}</p>
                            <p>Inv. Date: {formatDate(invoice?.invoice_date)}</p>
                            <p>Sex: {invoice?.sex?.toUpperCase() || '-'}</p>
                        </div>
                    </div>

                    {/* Test Table */}
                    <div className="mt-6">
                        <table className="w-full text-sm border">
                            <thead>
                                <tr className="border">
                                    <th className="py-2 border text-left px-3 w-10">SL</th>
                                    <th className="py-2 border text-left px-3">Test Name</th>
                                    <th className="py-2 border text-right px-3 w-32">Test Charge</th>
                                </tr>
                            </thead>

                            <tbody>
                                {invoice?.selected_tests?.map((test: any, index: number) => (
                                    <tr key={test.id}>
                                        <td className="border px-3 py-2 text-center">{index + 1}</td>
                                        <td className="border px-3 py-2">{test?.test?.name}</td>
                                        <td className="border px-3 py-2 text-right">{test?.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Area */}
                    <div className="flex items-center">
                        <div className="flex justify-center mt-10">
                            {dueAmount <= 0 ? (
                                <div className="border border-emerald-500 text-emerald-500 rounded-lg px-8 py-3 text-xl font-bold uppercase rotate-[-15deg]">
                                    Paid
                                </div>
                            ) : (
                                <div className="border border-red-500 text-red-500 rounded-lg px-8 py-3 text-xl font-bold uppercase rotate-[-15deg]">
                                    Due
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-sm max-w-[250px] w-full ml-auto">
                            <div className="flex justify-between py-1">
                                <span>Total Amt. ({companySettings?.currency || 'BDT'}) =</span>
                                <span>{invoice?.total_amount}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span>Discount =</span>
                                <span>{totalDiscounts || 0.00}</span>
                            </div>

                            <div className="flex justify-between border-t py-1">
                                <span>Discounted Amt. =</span>
                                <span>{Number(invoice?.net_amount)?.toFixed(2) || 0.00}</span>
                            </div>

                            <div className="flex justify-between py-1 font-semibold">
                                <span>Paid =</span>
                                <span>{Number(totalPayments)?.toFixed(2) || 0.00}</span>
                            </div>

                            <div className="flex justify-between py-1 font-semibold border-t">
                                <span>Due Amt.({companySettings?.currency || 'BDT'}) =</span>
                                <span>{Number(dueAmount)?.toFixed(2) || 0.00}</span>
                            </div>
                        </div>
                    </div>

                    {/* Paid Stamp */}

                    {/* Paid Stamp */}
                    <p className="text-sm mt-6 italic">In words : &nbsp; {amountToWords(Number(totalPayments || 0))}</p>

                    {/* Print & Download Buttons */}
                    <div className="flex justify-end gap-3 mt-6 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="border px-4 py-2 rounded"
                        >
                            Print
                        </button>
                        {/* <button className="border px-4 py-2 rounded">
                            Download
                        </button> */}
                    </div>
                </div>
            </Main>
        </>
    )
}
