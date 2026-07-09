
import { useState, type CSSProperties } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QRCodeSVG } from 'qrcode.react'
import { useDateFormat } from '@/hooks/use-date-format'

// Paper sizes offered for printing this invoice. `cssSize` feeds the @page
// size (browsers use this to pick/suggest the matching physical paper), and
// `margin` is tuned per size — the 80mm thermal option needs a near-zero
// margin since receipt printers have almost no physical border.
const PAPER_SIZES: Record<string, { label: string; cssSize: string; margin: string }> = {
    a4: { label: 'A4', cssSize: 'A4 portrait', margin: '12mm' },
    a5: { label: 'A5', cssSize: 'A5 portrait', margin: '8mm' },
    letter: { label: 'Letter', cssSize: 'letter portrait', margin: '12mm' },
    legal: { label: 'Legal', cssSize: 'legal portrait', margin: '12mm' },
    thermal80: { label: '80mm (Thermal)', cssSize: '80mm auto', margin: '2mm' },
}

// Overall scale for the invoice content. Most cells/headings here use
// Tailwind text-size utilities (text-sm, text-lg, ...), which set their own
// explicit rem font-size and don't inherit a parent's font-size — so scaling
// via `zoom` (which resizes everything: text, padding, borders, the QR code)
// is used instead of trying to override every element's own font size.
const FONT_SIZES: Record<string, { label: string; zoom: number }> = {
    sm: { label: 'Small', zoom: 0.85 },
    base: { label: 'Medium', zoom: 1 },
    lg: { label: 'Large', zoom: 1.15 },
    xl: { label: 'Extra Large', zoom: 1.3 },
}

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/invoices/$invoiceId/',
)({
    component: InvoiceDetails,
})

function InvoiceDetails() {
    const { invoiceId } = Route.useParams();
    const token = getCookie('accessToken')
    const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('a4')
    const { cssSize, margin } = PAPER_SIZES[paperSize]
    const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('base')

    // Tenant date format (from company settings), used for each test row's
    // per-test delivery date below.
    const { formatDate: fmtDate } = useDateFormat();

    // delivery_date comes back as a plain "YYYY-MM-DD" (Sequelize DATEONLY).
    // Parse the components directly instead of `new Date(str)` — that parses
    // as UTC midnight, which can shift the displayed date in timezones west
    // of UTC once local getters are applied.
    const formatItemDeliveryDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const [y, m, d] = dateStr.split('-').map(Number);
        if (!y || !m || !d) return '-';
        return fmtDate(new Date(y, m - 1, d));
    };

    // delivery_time is a raw 24h "HH:MM" — convert to 12h AM/PM for display.
    const formatItemDeliveryTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return timeStr;
        const hours24 = parseInt(match[1], 10);
        const minutes = match[2];
        const period = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12;
        return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
    };

    // Invoice-level invoice_date / delivery_date are full DATETIME values
    // (unlike the per-item DATEONLY delivery_date above), so plain
    // `new Date(str)` parsing is safe here.
    const formatInvoiceLevelDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return '-';
        return fmtDate(date);
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
                        padding: 0 !important;
                        box-shadow: none !important;
                    }
                    .invoice-print-area table {
                        width: 100% !important;
                    }
                    /* Preserve the 35/25/40 Totals Area column split on print */
                    .invoice-totals-row {
                        display: flex !important;
                    }
                    .invoice-totals-col-1 { width: 35% !important; min-width: 0 !important; }
                    .invoice-totals-col-2 { width: 25% !important; min-width: 0 !important; }
                    .invoice-totals-col-3 { width: 40% !important; min-width: 0 !important; }
                    /* Some print engines ignore the Tailwind text-right/w-32 utilities on th/td */
                    .invoice-charge-col {
                        text-align: right !important;
                        width: 128px !important;
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
                {/* Back Button + Paper Size */}
                <div className="max-w-3xl mx-auto w-full px-8 pt-6 print:hidden flex items-center justify-between mb-4">
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex items-center gap-2">
                        <Select value={fontSize} onValueChange={(v) => setFontSize(v as keyof typeof FONT_SIZES)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Font size" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(FONT_SIZES).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={paperSize} onValueChange={(v) => setPaperSize(v as keyof typeof PAPER_SIZES)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Paper size" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div
                    className="invoice-print-area max-w-3xl mx-auto w-full p-8 bg-white mt-10 print:mt-0 shadow-sm print:shadow-none border border-slate-100 print:border-none rounded-lg print:rounded-none"
                    style={{ zoom: FONT_SIZES[fontSize].zoom } as CSSProperties}
                >

                    {/* Header */}
                    <div className="mb-2 flex items-start justify-between gap-6">
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
                    <table className="w-full text-sm border mt-1" data-table-ignore="true">
                        <tbody>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/2">
                                    Receipt ID : {invoice?.invoice_prefix || invoice?.id}
                                </td>
                                <td className="border px-2 py-1 w-1/2">
                                    Age : {invoice?.age_text || (invoice?.age ? `${invoice.age}Y` : '-')}
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/2">
                                    Patient's Name : {invoice?.patient_name}
                                </td>
                                <td className="border px-2 py-1 w-1/2">
                                    Sex : {invoice?.sex?.toUpperCase() || '-'}
                                </td>
                            </tr>
                            <tr className="border">
                                <td className="border px-2 py-1 w-1/2">
                                    Ref. Doctor : {invoice?.doctor?.doctor_name || '-'}
                                </td>
                                <td className="border px-2 py-1 w-1/2">
                                    Contact No : {invoice?.phone || '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Test Table */}
                    <div className="mt-3">
                        <table className="w-full text-sm border" data-table-ignore="true">
                            <thead>
                                <tr className="border">
                                    <th className="py-1 px-1 border text-center font-bold w-12 ">SL</th>
                                    <th className="py-1 px-1 border text-left font-bold">Test Name</th>
                                    <th className="py-1 px-1 border text-left font-bold w-40">Del. Date &amp; Time</th>
                                    <th className="invoice-charge-col py-1 px-1 border text-right font-bold w-32" style={{ textAlign: 'right', width: '128px' }}>Charge ({companySettings?.currency || 'BDT'})</th>
                                </tr>
                            </thead>

                            <tbody>
                                {invoice?.selected_tests?.map((test: any, index: number) => (
                                    <tr key={test.id}>
                                        <td className="border px-1 py-1 text-center">{index + 1}</td>
                                        <td className="border px-1 py-1">{test?.test?.name}</td>
                                        <td className="border px-1 py-1">
                                            {!test?.delivery_date && !test?.delivery_time
                                                ? '-'
                                                : `${formatItemDeliveryDate(test?.delivery_date)} ${formatItemDeliveryTime(test?.delivery_time)}`.trim()}
                                        </td>
                                        <td className="invoice-charge-col border px-1 py-1 text-right font-semibold" style={{ textAlign: 'right', width: '128px' }}>
                                            {Number(test?.price || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Area */}
                    <div className="invoice-totals-row flex items-center gap-4 mt-4">
                        {/* Column 1: Sample Collection Rooms — 35% */}
                        <div className="invoice-totals-col-1 w-[35%] min-w-0 text-sm">
                            {invoice?.sample_collection_rooms?.length > 0 ? (
                                <>
                                    <p className="font-semibold text-slate-700 mb-1">Sample Collection Room{invoice.sample_collection_rooms.length > 1 ? 's' : ''}</p>
                                    <table className="w-full text-xs border" data-table-ignore="true">
                                        <thead>
                                            <tr className="border">
                                                <th className="py-1 px-2 border text-left font-bold">Room</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.sample_collection_rooms.map((r: any) => (
                                                <tr key={r.id} className="border">
                                                    <td className="py-1 px-2 border">{r.room?.name || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : null}

                            <div className="mt-2 space-y-0.5">
                                <p>Inv. Date: <strong>{formatInvoiceLevelDate(invoice?.invoice_date)}</strong></p>
                                <p>Del. Date: <strong>{formatInvoiceLevelDate(invoice?.delivery_date)}</strong></p>
                                <p>Created By: <strong>{invoice?.creator?.name || invoice?.created_by || '-'}</strong></p>
                            </div>
                        </div>

                        {/* Column 2: Paid / Due stamp — 25% */}
                        <div className="invoice-totals-col-2 w-[25%] min-w-0 flex justify-center">
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

                        {/* Column 3: Summary details — 40% */}
                        <div className="invoice-totals-col-3 w-[40%] min-w-0 text-sm space-y-2 border-t border-b border-slate-400 py-3">
                            <div className="flex justify-between text-slate-600">
                                <span>Total Amt.</span>
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

                    {/* Footer Note (from Settings → Report Settings) */}
                    {companySettings?.footer_note && (
                        <p className="text-xs text-slate-500 text-center mt-8 pt-3 border-t whitespace-pre-line">
                            {companySettings.footer_note}
                        </p>
                    )}

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
