/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "react-router";
import { useAppSelector } from "@/store/store";
import {
  useGetRawMaterialPurchaseInvoiceByIdQuery,
  useUpdateRawMaterialPurchaseInvoiceMutation,
  type RawMaterialInvoice,
} from "@/store/features/admin/rawMaterialApiService";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import { toast } from "sonner";

export default function RawMaterialInvoiceDetails() {
  const { id } = useParams();
  const currency = useAppSelector((state) => state.currency.value);
  const [markPaid, { isLoading: isMarkingPaid }] =
    useUpdateRawMaterialPurchaseInvoiceMutation();
  const { data: fetchedSettingsInfo } = useGetSettingsInfoQuery();
  const to = fetchedSettingsInfo?.data;

  const { data, isLoading } = useGetRawMaterialPurchaseInvoiceByIdQuery(
    id as string
  );

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Loading...</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Invoice not found</p>
      </div>
    );
  }

  const invoice: RawMaterialInvoice = data.data;
  const po = invoice?.purchase_order;
  const supplier = po?.supplier;

  // Invoice Calculations
  const subtotal = po?.total_amount || 0;
  const tax = 0; // Raw materials typically no tax
  const discount = 0; // No discount for raw materials
  const netAmount = subtotal - discount;
  //const total = subtotal + tax - discount;
  const paid = invoice?.paid_amount || 0;
  const balance = invoice?.due_amount || 0;
  const isFullyPaid = balance <= 0;
  const showMarkAsPaidButton = isFullyPaid && invoice?.status !== "paid";

  const handleMarkAsPaid = async () => {
    if (!isFullyPaid || invoice?.status === "paid") return;
    try {
      const res = await markPaid({
        id: Number(invoice?.id),
        body: {
          status: "paid",
        },
      }).unwrap();
      if (res) {
        toast.success(res.message || "Invoice marked as paid successfully");
      }
    } catch (error) {
      console.error("Failed to mark invoice as paid", error);
      toast.error("Failed to mark invoice as paid");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-5">
        <h1 className="text-3xl font-bold">
          Invoice {invoice?.invoice_number}
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/dashboard/raw-materials/invoices">
            <Button variant="outline">← Back to Invoices</Button>
          </Link>

          {id && (
            <Link to={`/dashboard/raw-materials/invoices/print/${id}`}>
              <Button variant="info">
                Print Preview
              </Button>
            </Link>
          )}

          {po?.id && (
            <Link
              to={`/dashboard/raw-materials/payments/create?poid=${po.id}`}
            >
              <Button variant="info">
                Record Payment
              </Button>
            </Link>
          )}
          {showMarkAsPaidButton && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleMarkAsPaid}
              disabled={isMarkingPaid}
            >
              {isMarkingPaid ? "Marking..." : "✔ Mark as Paid"}
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Info */}
        <div className="col-span-2 space-y-5">
          <div className="border rounded-md p-5">
            <h2 className="font-semibold text-lg mb-5">Invoice Details</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* From Supplier */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <p className="font-semibold">From (Supplier):</p>
                  <p>{supplier?.name}</p>
                  <p>
                    {supplier?.email} | {supplier?.phone}
                  </p>
                </div>

                {/* To (Your Company) */}
                <div>
                  <p className="font-semibold">To:</p>
                  <p>{to?.company_name}</p>
                  <p>{to?.address}</p>
                  <p>{to?.email} | {to?.phone}</p>
                </div>
              </div>

              {/* Invoice Numbers */}
              <div className="space-y-2">
                <p>
                  <strong>Invoice #:</strong> {invoice?.invoice_number}
                </p>
                <p>
                  <strong>PO #:</strong> {po?.po_number}
                </p>
                <p>
                  <strong>Invoice Date:</strong>{" "}
                  {new Date(invoice?.invoice_date).toISOString().split("T")[0]}
                </p>
                <p>
                  <strong>Due Date:</strong> {invoice?.due_date}
                </p>
                <p className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <Badge
                    className={`${invoice?.status === "paid"
                      ? "bg-green-600"
                      : invoice?.status === "pending"
                        ? "bg-yellow-600" : invoice?.status === "draft" ? "bg-blue-600"
                          : "bg-red-600"
                      } text-white capitalize`}
                  >
                    {invoice?.status}
                  </Badge>
                </p>
                <p>
                  <strong>Created By:</strong> {invoice?.creator?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="border rounded-md">
            <div className="p-4 font-semibold text-lg">Invoice Items</div>

            {!po?.items || po?.items.length === 0 ? (
              <div className="p-4 text-gray-600">No items found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 text-left">Raw Material</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Cost ({currency})</th>
                      <th className="p-3 text-right">
                        Total Price ({currency})
                      </th>
                      <th className="p-3 text-right">
                        Line Total ({currency})
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {po?.items.map((item: any) => (
                      <tr key={item.id} className="border-b">
                        {/* Raw Material ID */}
                        <td className="p-3">
                          <p className="font-medium">{item.product.name}</p>
                        </td>

                        {/* Quantity */}
                        <td className="p-3 text-right">{item.quantity}</td>

                        {/* Unit Cost */}
                        <td className="p-3 text-right">
                          {Number(item.unit_cost).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          {Number(item.total_price).toFixed(2)}
                        </td>
                        {/* Line Total */}
                        <td className="p-3 text-right font-semibold">
                          {(item.quantity * item.unit_cost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="border rounded-md p-4">
            <h2 className="font-semibold text-lg mb-2">Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-left">
                    <th className="p-3">Date</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount ({currency})</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Recorded By</th>
                  </tr>
                </thead>

                <tbody>
                  {invoice?.payments && invoice?.payments.length > 0 ? (
                    invoice?.payments?.map((payment: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3">
                          {payment?.payment_date
                            ? new Date(payment.payment_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                            : "-"}
                        </td>

                        <td className="p-3">
                          {payment?.payment_method || "-"}
                        </td>
                        <td className="p-3">
                          {Number(payment?.amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3">
                          {payment?.reference_number || "-"}
                        </td>
                        <td className="p-3">{payment?.creator?.name || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-3 text-center text-sm text-gray-500"
                      >
                        No payments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-5">
          <div className="border rounded-md p-5 space-y-3">
            <h2 className="font-semibold text-lg">Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Total Discount</span>
                  <span className="font-semibold">
                    {currency} {discount.toFixed(2)}
                  </span>
                </div>
              )}

              {discount > 0 && <Separator />}

              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Net Amount</span>
                  <span className="font-semibold">
                    {currency} {netAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold">
                    {currency} {tax.toFixed(2)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {currency} {Number(invoice?.total_payable_amount).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Paid</span>
                <span className="font-semibold">
                  {currency} {paid.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold mt-2 border-t pt-2">
                <span>Balance</span>
                <span>
                  {currency} {balance.toFixed(2)}
                </span>
              </div>

              <div>
                <Badge
                  className={`${invoice?.status === "paid" ? "bg-green-600" : "bg-yellow-500"
                    } text-white capitalize mt-2 justify-center`}
                >
                  {invoice?.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Supplier Box */}
          <div className="border rounded-md p-5">
            <h3 className="font-semibold text-lg">Supplier</h3>

            <p className="mt-2 font-semibold">{supplier?.name}</p>
            <p className="text-sm">{supplier?.email}</p>
            <p className="text-sm">{supplier?.phone}</p>
          </div>

          {/* Purchase Order Info */}
          <div className="border rounded-md p-5">
            <h3 className="font-semibold text-lg">Purchase Order</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>
                <strong>PO #:</strong> {po?.po_number}
              </p>
              <p>
                <strong>Order Date:</strong>{" "}
                {po?.order_date
                  ? new Date(po.order_date).toISOString().split("T")[0]
                  : "-"}
              </p>
              <p>
                <strong>Expected Delivery:</strong>{" "}
                {po?.expected_delivery_date
                  ? new Date(po.expected_delivery_date)
                    .toISOString()
                    .split("T")[0]
                  : "-"}
              </p>
              {po?.notes && (
                <p>
                  <strong>Notes:</strong> {po?.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
