import { createFileRoute } from '@tanstack/react-router'
import { useGetSettingsInfoQuery, type Settings } from "@/features/purchase/api/queries";
import { useGetPurchaseInvoiceByIdQuery, type PurchaseInvoice } from "@/features/purchase/api/purchaseQueries";
import PrintablePurchaseInvoice from "../../PrintablePurchaseInvoice";

export const Route = createFileRoute('/_authenticated/purchase/invoices/$id/preview/')({
    component: PurchaseInvoicePrintPreview,
})

function PurchaseInvoicePrintPreview() {
    const { id } = Route.useParams();

    const { data: purchaseInvoiceData, isLoading } = useGetPurchaseInvoiceByIdQuery(id);

    const invoice: PurchaseInvoice | undefined = purchaseInvoiceData?.data;

    const { data: fetchedSettingsInfo } = useGetSettingsInfoQuery();

    const to: Settings | undefined = fetchedSettingsInfo?.data;

    // Cast or ensure the type matches. The mock data structure needs to align with Supplier interface.
    const from = invoice?.purchase_order?.supplier;

    if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;
    if (!invoice) return <div className="flex justify-center p-8 text-red-500">Invoice not found for preview</div>;

    return (
        <div className="">
            <PrintablePurchaseInvoice from={from} to={to} invoice={invoice} />
        </div>
    );
}
