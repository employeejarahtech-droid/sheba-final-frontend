import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { topNav } from "@/data/data"
import { Button } from "@/components/ui/button"
import { useGetPurchasePaymentByIdQuery } from "@/features/purchase/api/purchaseQueries"

export const Route = createFileRoute('/_authenticated/purchase/payments/$id/')({
    component: PurchasePaymentDetails,
})

function PurchasePaymentDetails() {
    const { id } = Route.useParams()
    const currency = "BDT"; // Placeholder for dynamic currency
    const { data: response, isLoading, error } = useGetPurchasePaymentByIdQuery(id);
    const payment = response?.data;

    if (isLoading) {
        return <div className="p-10 text-center">Loading payment details...</div>;
    }

    if (error || !payment) {
        return <div className="p-10 text-center text-red-500">Payment not found or error occurred.</div>;
    }

    // --------------------------
    // Payment Core Info
    // --------------------------
    const formattedPayment = {
        number: `PPAY-${payment.id.toString().padStart(6, "0")}`,
        date: new Date(payment.payment_date).toLocaleDateString(),
        method: payment.payment_method
            ? payment.payment_method.replaceAll("_", " ").replace(/^\w/, (c: string) => c.toUpperCase())
            : "-",
        reference: payment.reference_number || "-",
        amount: Number(payment.amount),
        recordedBy: payment.created_by || "System", // Fallback if created_by is missing
        status: payment.status,
    };

    // --------------------------
    // Purchase Order Info
    // --------------------------
    const po = payment.purchase_order
        ? {
            number: payment.purchase_order.po_number,
            total: payment.purchase_order.total_amount,
            total_payable_amount: payment.purchase_order.total_payable_amount || payment.purchase_order.total_amount,
            supplier: payment.purchase_order.supplier,
        }
        : null;

    // --------------------------
    // Invoice Info
    // --------------------------
    const invoice = payment.invoice
        ? {
            invoice_id: payment.invoice_id || payment.invoice?.id,
            number: payment.invoice.invoice_number,
            total: payment.invoice.total_amount,
            total_payable_amount: payment.invoice.total_payable_amount,
            dueDate: payment.invoice.due_date,
        }
        : null;

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className="ms-auto flex items-center space-x-4">
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <main className="p-6 lg:p-10">
                <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Purchase Payment {formattedPayment.number}
                        </h1>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link to="/purchase/payments">
                                <Button variant="outline">← Back to Payments</Button>
                            </Link>

                            {invoice && (
                                <Link to="/purchase/invoices/$id" params={{ id: String(invoice.invoice_id) }}>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        View Invoice {invoice.number}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Main Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Payment Details */}
                        <div className="col-span-1 lg:col-span-2 border rounded-md p-5 shadow-sm bg-card">
                            <h2 className="font-semibold text-lg mb-4">Payment Details</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Payment Number</p>
                                        <p>{formattedPayment.number}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-muted-foreground">Recorded By</p>
                                        <p>{formattedPayment.recordedBy}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-muted-foreground">Method</p>
                                        <p>{formattedPayment.method}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-muted-foreground">Reference Number</p>
                                        <p>{formattedPayment.reference}</p>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Payment Date</p>
                                        <p>{formattedPayment.date}</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-muted-foreground">Status</p>
                                        <p className="capitalize px-2 py-1 rounded bg-green-100 text-green-800 w-fit text-sm">
                                            {formattedPayment.status}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-muted-foreground">Amount</p>
                                        <p className="text-xl font-bold text-primary">
                                            {currency} {formattedPayment.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="space-y-4">
                            {/* Supplier */}
                            {po?.supplier && (
                                <div className="border rounded-md p-5 shadow-sm bg-card">
                                    <h3 className="font-semibold text-lg mb-4">Supplier</h3>

                                    <div className="space-y-2">
                                        <p className="font-medium">{po.supplier.name}</p>
                                        {po.supplier.email && <p className="text-sm text-muted-foreground">{po.supplier.email}</p>}
                                        {po.supplier.phone && <p className="text-sm text-muted-foreground">{po.supplier.phone}</p>}
                                        {po.supplier.contact_person && <p className="text-sm text-muted-foreground">Contact: {po.supplier.contact_person}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Purchase Order Summary */}
                            {po && (
                                <div className="border rounded-md p-5 space-y-3 shadow-sm bg-card">
                                    <h3 className="font-semibold text-lg">Purchase Order</h3>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">PO Number</span>
                                        <span className="font-semibold">{po.number}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Amount</span>
                                        <span className="font-semibold">{currency} {(po.total_payable_amount ?? 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Invoice Summary */}
                            {invoice && (
                                <div className="border rounded-md p-5 space-y-3 shadow-sm bg-card">
                                    <h3 className="font-semibold text-lg">Invoice Summary</h3>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Invoice #</span>
                                        <span className="font-semibold">{invoice.number}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-semibold">{currency} {(invoice.total_payable_amount ?? 0).toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Due Date</span>
                                        <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
