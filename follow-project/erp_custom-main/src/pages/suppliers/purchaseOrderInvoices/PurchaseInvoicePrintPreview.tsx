import { useParams } from "react-router";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import type { Settings } from "@/types/types";
import { useGetPurchaseInvoiceByIdQuery } from "@/store/features/purchaseOrder/purchaseOrderApiService";
import type { PurchaseInvoice } from "@/types/PurchaseInvoice.types";
import PrintablePurchaseInvoice from "./PrintablePurchaseInvoice";
import type { Supplier } from "@/types/supplier.types";

export default function PurchaseInvoicePrintPreview() {
  const invoiceId = useParams().id;

  //console.log('invoiceId', invoiceId);

  const { data: purchaseInvoiceData } = useGetPurchaseInvoiceByIdQuery(Number(invoiceId), {
    skip: !invoiceId,
  });

  console.log('purchaseInvoiceData', purchaseInvoiceData);

  const invoice: PurchaseInvoice | undefined = purchaseInvoiceData?.data;

  console.log('invoice in purchase', invoice);

  const { data: fetchedSettingsInfo } = useGetSettingsInfoQuery();

  const to: Settings | undefined = fetchedSettingsInfo?.data;

  const from: Supplier | undefined = invoice?.purchase_order?.supplier;

  return (
    <div className="">
      <PrintablePurchaseInvoice from={from} to={to} invoice={invoice} />
    </div>
  );
}
