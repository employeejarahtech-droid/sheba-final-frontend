
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDateFormat } from '@/hooks/use-date-format'
import { QRCodeSVG } from 'qrcode.react'

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/invoices/$invoiceId/',
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

    // delivery_time is saved from an HTML <input type="time">, which yields a
    // 24h "HH:MM" string — convert it to 12h AM/PM for display. Already-formatted
    // strings (e.g. "06:00 PM") are left as-is.
    const to12Hour = (timeString: string) => {
        const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return timeString;
        const hours24 = parseInt(match[1], 10);
        const minutes = match[2];
        const period = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12;
        return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
    };

    // Format the delivery date: date portion from delivery_date, plus the
    // delivery_time (converted to 12h AM/PM) when present. Returns '-' when no date.
    const formatDeliveryDate = (dateString: string | null, timeString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        const dateStr = fmtDate(date);
        return timeString ? `${dateStr} ${to12Hour(timeString)}` : dateStr;
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

    // Function to clean DataTables responsive markers
    const cleanPrintView = () => {
        // Remove any [col-X] text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
        );
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.includes('[col-')) {
                textNodes.push(node);
            }
        }
        textNodes.forEach(node => {
            node.nodeValue = node.nodeValue.replace(/\[col-\d+\]*/g, '').trim();
        });
    };

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
                    /* Hide DataTables responsive column indicators */
                    .dtr-title, .dtr-data, .dtr-control, td.control, th.control {
                        display: none !important;
                    }
                    /* Hide any DataTables responsive markers */
                    table::before, table::after, td::before, td::after, th::before, th::after {
                        content: none !important;
                    }
                    /* Specifically hide any content that shows [col-X] patterns */
                    * {
                        &::before {
                            content: none !important;
                        }
                        &::after {
                            content: none !important;
                        }
                    }
                }
            `}</style>

            {/* ===== Top Heading ===== */}
            <AppHeader fixed className="print:hidden" />
            <Main>
                {/* Back Button */}
                <div className="max-w-3xl mx-auto w-full px-8 pt-6 print:hidden">
                    <Button
                        variant="outline"
                        className="mb-4"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                <div className="invoice-print-area max-w-3xl mx-auto w-full p-8 bg-white mt-10 print:mt-0 shadow-sm print:shadow-none border border-slate-100 print:border-none rounded-lg print:rounded-none">

                    {/* Header */}
                    <div className="mb-6 flex items-start justify-between gap-6">
                        {/* Column 1: Logo + Company Info */}
                        <div className="flex items-center gap-4">
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

                        {/* Column 2: Invoice title + QR */}
                        <div className="text-right shrink-0">
                            <h2 className="text-xl font-bold tracking-widest text-slate-800 uppercase">INVOICE</h2>
                            <div className="flex justify-end mt-2">
                                <QRCodeSVG value={`${window.location.origin}/invoice-status/${invoiceId}`} size={72} />
                            </div>
                        </div>
                    </div>


                    {/* Patient Info Table */}
                    <table className="w-full text-sm border mt-4" data-table-ignore="true">
                        <tbody>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/3">
                                    Receipt ID: <strong>{invoice?.invoice_prefix || invoice?.id}</strong>
                                </td>
                                <td className="border px-2 py-1 w-1/3">
                                    Inv. Date: {formatDate(invoice?.invoice_date)}
                                </td>
                                <td className="border px-2 py-1 w-1/3">
                                    Del. Date: {formatDeliveryDate(invoice?.delivery_date, invoice?.delivery_time)}
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1" colSpan={2}>
                                    Patient's Name: <strong>{invoice?.patient_name}</strong>
                                </td>
                                <td className="border px-2 py-1">
                                    Age & Sex: {invoice?.age_text || invoice?.age ? (invoice?.age_text || `${invoice?.age}Y`) : '-'} / {invoice?.sex?.toUpperCase() || '-'}
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/3" colSpan={2}>
                                    Ref. Doctor: <strong>{invoice?.doctor?.doctor_name || '-'}</strong>
                                </td>
                                <td className="border px-2 py-1 w-1/3" >
                                    Contact No: <strong>{invoice?.phone || '-'}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Test Table */}
                    <div className="mt-6">
                        <table className="w-full text-sm border" data-table-ignore="true">
                            <thead>
                                <tr className="border">
                                    <th className="py-1.5 px-2 border text-left font-bold w-12">SL</th>
                                    <th className="py-1.5 px-2 border text-left font-bold">Test Name</th>
                                    <th className="py-1.5 px-2 border text-right font-bold w-32">Test Charge</th>
                                </tr>
                            </thead>

                            <tbody>
                                {invoice?.selected_tests?.map((test: any, index: number) => (
                                    <tr key={test.id}>
                                        <td className="border px-2 py-1.5 text-center">{index + 1}</td>
                                        <td className="border px-2 py-1.5">{test?.test?.name}</td>
                                        <td className="border px-2 py-1.5 text-right font-semibold">
                                            {Number(test?.price || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Area */}
                    <div className="grid grid-cols-3 items-center gap-4 mt-4">
                        {/* Column 1: Sample Collection Rooms */}
                        <div className="text-sm">
                            {invoice?.sample_collection_rooms?.length > 0 ? (
                                <>
                                    <p className="font-semibold text-slate-700 mb-1">Sample Collection Room{invoice.sample_collection_rooms.length > 1 ? 's' : ''}</p>
                                    <table className="text-xs border" data-table-ignore="true">
                                        <thead>
                                            <tr className="border">
                                                <th className="py-1 px-2 border text-left font-bold">Room</th>
                                                <th className="py-1 px-2 border text-left font-bold">Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.sample_collection_rooms.map((r: any) => (
                                                <tr key={r.id} className="border">
                                                    <td className="py-1 px-2 border">{r.room?.name || '-'}</td>
                                                    <td className="py-1 px-2 border">{r.room?.location || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : null}
                        </div>

                        {/* Column 2: Paid / Due stamp */}
                        <div className="flex justify-center">
                            {dueAmount <= 0 ? (
                                <div className="border border-slate-600 text-slate-600 rounded px-6 py-2 text-lg font-bold uppercase tracking-wider rotate-[-10deg]">
                                    Paid
                                </div>
                            ) : (
                                <div className="border border-slate-600 text-slate-600 rounded px-6 py-2 text-lg font-bold uppercase tracking-wider rotate-[-10deg]">
                                    Due
                                </div>
                            )}
                        </div>

                        {/* Column 3: Summary details */}
                        <div className="text-sm max-w-[260px] w-full ml-auto space-y-2 border-t border-b border-slate-400 py-3">
                            <div className="flex justify-between text-slate-600">
                                <span>Total Amt. ({companySettings?.currency || 'BDT'})</span>
                                <span className="font-semibold text-slate-800">{Number(invoice?.total_amount || 0).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-slate-600">
                                <span>Discount</span>
                                <span className="font-semibold text-slate-800">-{Number(totalDiscounts || 0).toFixed(2)}</span>
                            </div>

                            <div className="border-t border-slate-250 pt-1.5 flex justify-between text-slate-700 font-medium">
                                <span>Discounted Amt.</span>
                                <span className="font-bold text-slate-800">{Number(invoice?.net_amount || 0).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-slate-700 font-semibold">
                                <span>Paid</span>
                                <span className="font-bold">{Number(totalPayments || 0).toFixed(2)}</span>
                            </div>

                            <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold text-slate-900">
                                <span>Due Amt.</span>
                                <span className="font-bold">
                                    {Number(dueAmount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Paid Stamp */}
                    <p className="text-sm mt-6 italic">In words: &nbsp; <span className="font-semibold capitalize text-slate-800">{amountToWords(Number(totalPayments || 0))}</span></p>

                    {/* ── Signature Row ───────────────────────────────────────────────── */}
                    <div className="flex justify-between mt-12 text-sm w-full">
                        <div style={{ textAlign: 'left' }}>
                            <span className="inline-block border-t border-dashed pt-1">Prepared By:</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="inline-block border-t border-dashed pt-1">Authorized Signature:</span>
                        </div>
                    </div>

                    {/* Print & Download Buttons */}
                    <div className="flex justify-end gap-3 mt-8 print:hidden">
                        <button
                            onClick={() => {
                                cleanPrintView();
                                setTimeout(() => window.print(), 100);
                            }}
                            className="border px-4 py-2 rounded bg-slate-800 text-white font-medium hover:bg-slate-700 transition shadow"
                        >
                            Print
                        </button>
                    </div>
                </div>
            </Main>
        </>
    )
}
