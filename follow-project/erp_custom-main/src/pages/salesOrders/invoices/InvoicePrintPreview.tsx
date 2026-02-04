import { useParams } from "react-router";
import PrintableInvoice from "./PrintableInvoice";
import { useGetInvoiceByIdQuery } from "@/store/features/salesOrder/salesOrder";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import type { Settings } from "@/types/types";
import type { SalesInvoice } from "@/types/salesInvoice.types";
import type { Customer } from "@/store/features/customers/types";

export default function InvoicePrintPreview() {
  const invoiceId = useParams().invoiceId;

  const { data: invoiceData } = useGetInvoiceByIdQuery(Number(invoiceId), {
    skip: !invoiceId,
  });

  const invoice: SalesInvoice | undefined = invoiceData?.data;

  const { data: fetchedSettingsInfo } = useGetSettingsInfoQuery();

  const from: Settings | undefined = fetchedSettingsInfo?.data;

  const to: Customer | undefined = invoice?.order?.customer;

  return (
    <div className="">
      <PrintableInvoice from={from} to={to} invoice={invoice} />
    </div>
  );
}
