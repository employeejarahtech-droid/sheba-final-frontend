import { useParams } from "react-router";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import type { Settings } from "@/types/types";
import {
  useGetRawMaterialPurchaseInvoiceByIdQuery,
  type RawMaterialInvoice,
} from "@/store/features/admin/rawMaterialApiService";
import PrintableRMPurchaseInvoice from "./PrintableRMPurchaseInvoice";
import type { RawMaterialSupplier } from "@/store/features/admin/rawMaterialApiService";

export default function RMPurchaseInvoicePrintPreview() {
  const invoiceId = useParams().id;

  const { data: purchaseInvoiceData } = useGetRawMaterialPurchaseInvoiceByIdQuery(invoiceId as string, {
    skip: !invoiceId,
  });

  const invoice: RawMaterialInvoice | undefined = purchaseInvoiceData?.data;

  const { data: fetchedSettingsInfo } = useGetSettingsInfoQuery();

  const to: Settings | undefined = fetchedSettingsInfo?.data;

  const from: RawMaterialSupplier | undefined = invoice?.purchase_order?.supplier;

  return (
    <div className="">
      <PrintableRMPurchaseInvoice from={from} to={to} invoice={invoice} />
    </div>
  );
}
