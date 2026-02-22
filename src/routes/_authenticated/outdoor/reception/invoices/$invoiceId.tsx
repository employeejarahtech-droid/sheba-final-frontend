
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { amountToWords } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute(
    '/_authenticated/outdoor/reception/invoices/$invoiceId',
)({
    component: InvoiceDetails,
})

function InvoiceDetails() {
    const { invoiceId } = Route.useParams();
    const token = getCookie('accessToken')
    //const queryClient = useQueryClient()
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

    //console.log('invoice', invoice)

    const totalDiscounts = invoice?.department_discounts?.reduce((total: any, discount: any) => total + Number(discount.discount), 0);

    const totalPayments = invoice?.payments?.reduce((total: any, payment: any) => total + Number(payment.amount), 0);

    const dueAmount = Number(invoice?.net_amount) - Number(totalPayments);

    return (
        <>
            {/* ===== Top Heading ===== */}
            <AppHeader fixed />
            <Main>
                {/* Back Button */}
                <div className="max-w-3xl mx-auto w-full px-8 pt-6 print:hidden">
                    <Button
                        variant="outline"
                        className="mb-4"
                        onClick={() => window.location.href = '/outdoor/reception/invoices/list'}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to List
                    </Button>
                </div>

                <div className="max-w-3xl mx-auto w-full p-8 bg-white mt-6 print:w-[850px]">

                    {/* Header */}
                    <div className="mb-6">
                        <div className='flex justify-center items-center gap-8'>
                            <img
                                src="https://i.ibb.co/3R8GSxV/logo.png"
                                alt="Clinic Logo"
                                className="w-24 mb-2"
                            />

                            <div className="text-center">
                                <h1 className="text-2xl font-bold">SHEBA CLINIC</h1>
                                <p className="text-sm mt-1 leading-5">
                                    Ghoshpara, Hospital Road, Kurigram <br />
                                    Ph: 61450, 61867, Mobile: 01558-309138
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mb-2">
                        <h2 className="text-xl font-semibold underline mt-4">INVOICE</h2>
                    </div>

                    <hr />

                    {/* Patient Information */}
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                            <p>Receipt ID : {invoice?.id}</p>
                            <p>Patient’s Name : {invoice?.patient_name}</p>
                            <p>Ref. Doctor name : {invoice?.doctor?.name || ''}</p>
                            <p>Contact No : {invoice?.phone || '-'} </p>
                            <p>Age : {invoice?.age || '-'}</p>
                        </div>

                        <div className="text-right">
                            <p>Delivery Date: {invoice?.delivery_date}</p>
                            <p>Date: {invoice?.created_at}</p>
                            <p>Sex: {invoice?.sex.toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Test Table */}
                    <div className="mt-6">
                        <table className="w-full text-sm border">
                            <thead>
                                <tr className="border">
                                    <th className="py-2 border text-left px-3 w-10">SL</th>
                                    <th className="py-2 border text-left px-3">Test Name</th>
                                    <th className="py-2 border text-center px-3 w-32">Test Charge</th>
                                </tr>
                            </thead>

                            <tbody>
                                {invoice?.selected_tests?.map((test: any, index: number) => (
                                    <tr key={test.id}>
                                        <td className="border px-3 py-2 text-center">{index + 1}</td>
                                        <td className="border px-3 py-2">{test?.test?.name}</td>
                                        <td className="border px-3 py-2 text-center">{test?.price}</td>
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
                                <span>Total =</span>
                                <span>{invoice?.total_amount}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span>Discount =</span>
                                <span>{totalDiscounts || 0.00}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span>Discounted Charge =</span>
                                <span>{Number(invoice?.net_amount)?.toFixed(2) || 0.00}</span>
                            </div>

                            <div className="flex justify-between py-1 font-semibold">
                                <span>Paid =</span>
                                <span>{Number(totalPayments)?.toFixed(2) || 0.00}</span>
                            </div>

                            <div className="flex justify-between py-1 font-semibold border-t mt-2 pt-2">
                                <span>Due Amount =</span>
                                <span>{Number(dueAmount)?.toFixed(2) || 0.00}</span>
                            </div>
                        </div>
                    </div>

                    {/* Paid Stamp */}

                    {/* Paid Stamp */}
                    <p className="text-sm mt-6 italic">Taka in words : &nbsp; {amountToWords(Number(totalPayments || 0))}</p>

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
