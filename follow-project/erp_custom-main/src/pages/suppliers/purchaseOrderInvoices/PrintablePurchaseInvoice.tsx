import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/store/store";
import type { PurchaseInvoice } from "@/types/PurchaseInvoice.types";
import type { POItem } from "@/types/purchaseOrder.types";
import type { Supplier } from "@/types/supplier.types";
import type { Settings } from "@/types/types";

interface Props {
  invoice: PurchaseInvoice | undefined;
  from: Supplier | undefined;
  to: Settings | undefined;
}

export default function PrintablePurchaseInvoice({ invoice, from, to }: Props) {
  console.log("invoice", invoice);

  const total =
    Number(invoice?.purchase_order?.total_amount ?? 0) +
    Number(invoice?.purchase_order?.tax_amount ?? 0) -
    Number(invoice?.purchase_order?.discount_amount ?? 0);

  const payableAmount = invoice?.payments
    ?.reduce((acc, cur) => acc + Number(cur.amount), 0)
    ?.toFixed(2);

  const balance = Number(total) - Number(payableAmount);

  const currency = useAppSelector((state) => state.currency.value);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      {/* INVOICE CONTENT */}
      <div
        id="invoice"
        className="bg-white p-6 sm:p-8 max-w-4xl mx-auto print-container"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-sm text-gray-500">#{invoice?.invoice_number}</p>
          </div>

          {/* Company Info */}
          <div className="text-right flex flex-col items-end">
            <img
              src={
                to?.logo_url ||
                "https://inleadsit.com.my/wp-content/uploads/2023/07/favicon-2.png"
              } // <-- Replace with your logo
              alt="Company Logo"
              className="h-16 w-auto object-contain inline-block"
            />
            <p className="font-semibold">{to?.company_name}</p>
            <p className="text-sm">{to?.address}</p>
            <p className="text-sm">{to?.email}</p>
            <p className="text-sm">{to?.phone}</p>
          </div>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="font-semibold text-lg mb-2">Bill From</h2>
            <p className="font-semibold">{from?.name}</p>
            <p className="text-sm">{from?.address}</p>
            <p className="text-sm">{from?.email}</p>
            <p className="text-sm">{from?.phone}</p>
          </div>

          <div className="text-sm space-y-1">
            <p>
              <strong>Invoice Date:</strong> {invoice?.invoice_date}
            </p>
            <p>
              <strong>Due Date:</strong> {invoice?.due_date}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Badge className={`${invoice?.status === "paid" ? "bg-green-600" : "bg-yellow-600"} text-white capitalize`}>
                {invoice?.status}
              </Badge>
            </p>
            <p>
              <strong>Order #:</strong> {invoice?.purchase_order?.po_number}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="border rounded-md overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr className="text-left">
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Unit Price ({currency})</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Total Price ({currency})</th>
                <th className="p-3">Discount ({currency})</th>
                <th className="p-3 text-right">Line Total ({currency})</th>
              </tr>
            </thead>

            <tbody>
              {invoice?.purchase_order?.items?.map((item: POItem) => (
                <tr key={item?.id} className="border-b">
                  <td className="p-3">{item?.product?.name}</td>
                  <td className="p-3">{item?.product?.sku}</td>
                  <td className="p-3">{Number(item?.unit_cost).toFixed(2)}</td>
                  <td className="p-3">{item?.quantity}</td>
                  <td className="p-3">
                    {Number(item?.total_price).toFixed(2)}
                  </td>
                  <td className="p-3">{item?.discount?.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    {Number(item?.line_total)?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center">
          {/* LEFT: PAID badge */}
          {invoice?.status === "paid" && (
            <div className="flex justify-center items-center gap-2 w-full sm:w-1/2">
              <div className="px-6 py-3 border-2 border-green-600 text-green-700 font-bold text-xl rounded-lg rotate-[-6deg]">
                PAID
              </div>
            </div>
          )}
          <div className="w-64 ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">
                {currency} {Number(invoice?.total_amount)?.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Total Discount</span>
              <span className="font-semibold">
                {currency}{" "}
                {Number(invoice?.purchase_order?.discount_amount)?.toFixed(2)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span>Net Amount</span>
              <span className="font-semibold">
                {currency}{" "}
                {Number(invoice?.purchase_order?.net_amount)?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax</span>
              <span className="font-semibold">
                {currency}{" "}
                {Number(invoice?.purchase_order?.tax_amount)?.toFixed(2)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-semibold">
                {currency} {Number(total)?.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Paid</span>
              <span className="font-semibold">
                {currency} {Number(payableAmount)?.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Balance</span>
              <span>
                {currency} {Number(balance)?.toFixed(2)}
              </span>
            </div>

            {/* Print Button */}
            <div className="mt-10 print:hidden text-right">
              <Button onClick={handlePrint} variant="outline">
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs mt-16 text-gray-500">
          Thank you for being with us.
        </div>
      </div>
    </div>
  );
}
