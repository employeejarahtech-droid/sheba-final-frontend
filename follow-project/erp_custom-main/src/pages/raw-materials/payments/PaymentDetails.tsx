import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "react-router";
import { useAppSelector } from "@/store/store";
import {
    useGetRawMaterialPaymentByIdQuery,
    type RawMaterialPayment,
} from "@/store/features/admin/rawMaterialApiService";
import { ChevronLeft, CreditCard, FileText, ShoppingBag, User } from "lucide-react";

export default function PaymentDetails() {
    const { id } = useParams();
    const currency = useAppSelector((state) => state.currency.value);

    const { data, isLoading } = useGetRawMaterialPaymentByIdQuery(
        id as string,
        {
            skip: !id,
        }
    );

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <p className="text-muted-foreground text-lg">Loading payment details...</p>
            </div>
        );
    }

    if (!data?.data) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <p className="text-muted-foreground text-lg">Payment not found</p>
            </div>
        );
    }

    const payment: RawMaterialPayment = data.data;
    const invoice = payment.invoice;
    const purchaseOrder = payment.purchase_order;
    const supplier = purchaseOrder?.supplier;

    // Format payment method
    const formatPaymentMethod = (method: string) => {
        return method
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-5">
                <h1 className="text-3xl font-bold">
                    Payment #{payment.id}
                </h1>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link to="/dashboard/raw-materials/payments">
                        <Button variant="outline">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Payments
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Payment Info */}
                <div className="col-span-2 space-y-5">
                    {/* Payment Information Card */}
                    <div className="border rounded-md p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <h2 className="font-semibold text-lg">Payment Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Payment ID</p>
                                    <p className="font-semibold">#{payment.id}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Payment Date</p>
                                    <p className="font-semibold">
                                        {new Date(payment.payment_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Payment Method</p>
                                    <Badge className="bg-blue-600 text-white mt-1">
                                        {formatPaymentMethod(payment.payment_method)}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Amount Paid</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {currency} {Number(payment.amount).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {payment.reference_number && (
                                    <div>
                                        <p className="text-sm text-gray-500">Reference Number</p>
                                        <p className="font-semibold">{payment.reference_number}</p>
                                    </div>
                                )}

                                {payment.notes && (
                                    <div>
                                        <p className="text-sm text-gray-500">Notes</p>
                                        <p className="text-sm">{payment.notes}</p>
                                    </div>
                                )}

                                {payment.created_at && (
                                    <div>
                                        <p className="text-sm text-gray-500">Recorded On</p>
                                        <p className="text-sm">
                                            {new Date(payment.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Related Documents Card */}
                    <div className="border rounded-md p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <h2 className="font-semibold text-lg">Related Documents</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Invoice */}
                            {invoice && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm text-gray-500">Invoice Number</p>
                                            <p className="font-semibold">{invoice.invoice_number}</p>
                                        </div>
                                    </div>
                                    <Link to={`/dashboard/raw-materials/invoices/${invoice.id}`}>
                                        <Button variant="outline" size="sm">
                                            View Invoice
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {/* Purchase Order */}
                            {purchaseOrder && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm text-gray-500">Purchase Order</p>
                                            <p className="font-semibold">{purchaseOrder.po_number}</p>
                                        </div>
                                    </div>
                                    <Link to={`/dashboard/raw-materials/purchase-orders/${purchaseOrder.id}`}>
                                        <Button variant="outline" size="sm">
                                            View PO
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Supplier Information */}
                    {supplier && (
                        <div className="border rounded-md p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-5 w-5 text-orange-600" />
                                <h3 className="font-semibold text-lg">Supplier</h3>
                            </div>

                            <div className="space-y-2">
                                <p className="font-semibold text-lg">{supplier.name}</p>
                                {supplier.email && (
                                    <p className="text-sm text-gray-600">{supplier.email}</p>
                                )}
                                {supplier.phone && (
                                    <p className="text-sm text-gray-600">{supplier.phone}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment Summary */}
                    <div className="border rounded-md p-5">
                        <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment ID</span>
                                <span className="font-medium">#{payment.id}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Method</span>
                                <span className="font-medium">{formatPaymentMethod(payment.payment_method)}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center pt-2">
                                <span className="font-semibold">Amount Paid</span>
                                <span className="text-xl font-bold text-green-600">
                                    {currency} {Number(payment.amount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Summary */}
                    {invoice && (
                        <div className="border rounded-md p-5">
                            <h3 className="font-semibold text-lg mb-4">Invoice Summary</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Invoice #
                                    </span>
                                    <span className="font-medium">
                                        {invoice.invoice_number}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="font-medium">
                                        {currency} {Number(invoice.total_payable_amount || 0).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Due Date</span>
                                    <span className="font-medium">
                                        {invoice.due_date}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
