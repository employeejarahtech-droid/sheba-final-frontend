import { Button } from "@/components/ui/button";
import { useGetPurchasePaymentByIdQuery } from "@/store/features/purchaseOrder/purchaseOrderApiService";
import { useAppSelector } from "@/store/store";

import { Link, useParams } from "react-router";

export default function PurchasePaymentsDetails() {
    const currency = useAppSelector((state) => state.currency.value);

  const { id } = useParams();
  const { data, isLoading, error } = useGetPurchasePaymentByIdQuery(id as string);

  if (isLoading) return <p>Loading...</p>;
  if (error || !data?.data) return <p>Payment not found.</p>;

  const payment = data.data;

  console.log("Payment Data: ", payment);


  // --------------------------
  // Payment Core Info
  // --------------------------
  const formattedPayment = {
    number: `PPAY-${payment.id.toString().padStart(6, "0")}`,
    date: new Date(payment.payment_date).toLocaleDateString(),
    method:
      payment.payment_method.replaceAll("_", " ").replace(/^\w/, (c: string) => c.toUpperCase()),
    reference: payment.reference_number || "-",
    amount: Number(payment.amount),
    recordedBy: payment.created_by,
    status: payment.status,
  };

  // --------------------------
  // Purchase Order Info
  // --------------------------
  const po = payment.purchase_order
    ? {
        number: payment.purchase_order.po_number,
        total: payment.purchase_order.total_amount,
        total_payable_amount: payment.purchase_order.total_payable_amount,
        supplier: payment.purchase_order.supplier,
      }
    : null;

  // --------------------------
  // Invoice Info
  // --------------------------
  const invoice = payment.invoice
    ? {
        invoice_id: payment.invoice_id,
        number: payment.invoice.invoice_number,
        total: payment.invoice.total_amount,
        total_payable_amount: payment.invoice.total_payable_amount,
        dueDate: payment.invoice.due_date,
      }
    : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Purchase Payment {formattedPayment.number}
        </h1>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/dashboard/purchase-payments">
            <Button variant="outline">← Back to Payments</Button>
          </Link>

          {invoice && (
            <Link to={`/dashboard/purchase-invoices/${invoice.invoice_id}`}>
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
        <div className="col-span-1 lg:col-span-2 border rounded-md p-5">
          <h2 className="font-semibold text-lg mb-4">Payment Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Payment Number</p>
                <p>{formattedPayment.number}</p>
              </div>

              <div>
                <p className="font-semibold">Recorded By</p>
                <p>{formattedPayment.recordedBy}</p>
              </div>

              <div>
                <p className="font-semibold">Method</p>
                <p>{formattedPayment.method}</p>
              </div>

              <div>
                <p className="font-semibold">Reference Number</p>
                <p>{formattedPayment.reference}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Payment Date</p>
                <p>{formattedPayment.date}</p>
              </div>

              <div>
                <p className="font-semibold">Status</p>
                <p className="capitalize">{formattedPayment.status}</p>
              </div>

              <div>
                <p className="font-semibold">Amount</p>
                <p className="text-xl font-bold">{formattedPayment.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-4">
          {/* Supplier */}
          {po?.supplier && (
            <div className="border rounded-md p-5">
              <h3 className="font-semibold text-lg">Supplier</h3>

              <p className="mt-2 font-semibold">{po.supplier.name}</p>
              <p className="text-sm">{po.supplier.email}</p>
              <p className="text-sm">{po.supplier.phone}</p>
              <p className="text-sm">Contact: {po.supplier.contact_person}</p>
            </div>
          )}

          {/* Purchase Order Summary */}
          {po && (
            <div className="border rounded-md p-5 space-y-3">
              <h3 className="font-semibold text-lg">Purchase Order</h3>

              <div className="flex justify-between text-sm">
                <span>PO Number</span>
                <span className="font-semibold">{po.number}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <span className="font-semibold">{currency} {po.total_payable_amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          {invoice && (
            <div className="border rounded-md p-5 space-y-3">
              <h3 className="font-semibold text-lg">Invoice Summary</h3>

              <div className="flex justify-between text-sm">
                <span>Invoice #</span>
                <span className="font-semibold">{invoice.number}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-semibold">{currency} {invoice.total_payable_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Due Date</span>
                <span className="font-semibold">{invoice.dueDate}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
