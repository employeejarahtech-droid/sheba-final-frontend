import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "react-router";
import {
  useGetInvoiceByIdQuery,
  useUpdateInvoiceStatusMutation,
} from "@/store/features/salesOrder/salesOrder";
import { useAppSelector } from "@/store/store";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import { toast } from "sonner";
import { SalesPermission, SuperAdminPermission } from "@/config/permissions";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  FileText,
  Hash,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export default function InvoiceDetailsPage() {
  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);
  const canMarkAsPaid = userPermissions.includes(SalesPermission.MARK_AS_PAID) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);
  const canRecordPayment = userPermissions.includes(SalesPermission.PAYMENTS) || userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  const invoiceId = useParams().invoiceId;
  const { data: invoiceData } = useGetInvoiceByIdQuery(Number(invoiceId), { skip: !invoiceId });
  const invoice = invoiceData?.data;
  const currency = useAppSelector((state) => state.currency.value);
  const formatDate = (dateStr: string) => dateStr?.split("T")[0];

  const { data: fetchedSettingsInfo } = useGetSettingsInfoQuery();
  const from = fetchedSettingsInfo?.data;
  const to = invoice?.order?.customer;

  const total = (
    Number(invoice?.order?.total_amount) -
    Number(invoice?.order?.discount_amount) +
    Number(invoice?.order?.tax_amount)
  ).toFixed(2);

  const payableAmount = invoice?.payments
    ?.reduce((acc, cur) => acc + Number(cur.amount), 0)
    ?.toFixed(2) || "0.00";

  const balance = Number(total) - Number(payableAmount);

  const [updateInvoiceStatus] = useUpdateInvoiceStatusMutation();
  const handleUpdateInvoiceStatus = async (id: number) => {
    if (!id) return;
    if (invoice?.payments?.length === 0) {
      toast.error(`No payments found. Cannot mark as paid.`);
      return;
    }
    try {
      const res = await updateInvoiceStatus({
        invoiceId: id,
        invoiceData: { status: "paid" },
      }).unwrap();
      if (res.status) {
        toast.success(res.message || "Invoice updated successfully");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Error updating invoice status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-500 hover:bg-green-600';
      case 'unpaid': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'overdue': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in-50 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/dashboard/sales/invoices" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Invoices
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Invoice #{invoice?.invoice_number}
            </h1>
            <Badge className={`${getStatusColor(invoice?.status || '')} text-white capitalize px-3 py-1 shadow-sm`}>
              {invoice?.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRecordPayment && (
            <Link to={`/dashboard/sales/payments/create?invoiceId=${invoice?.id}`}>
              <Button className="gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700">
                <CreditCard className="w-4 h-4" /> Record Payment
              </Button>
            </Link>
          )}
          <Link to={`/dashboard/sales/invoices/${invoice?.id}/preview`}>
            <Button variant="outline" className="gap-2 shadow-sm">
              <Printer className="w-4 h-4" /> Print / Preview
            </Button>
          </Link>
          {canMarkAsPaid && invoice?.status !== "paid" && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
              onClick={() => handleUpdateInvoiceStatus(Number(invoice?.id))}
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="bg-muted/30 py-4 border-b-1 gap-0">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="pb-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">From</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{from?.company_name}</p>
                    <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {from?.address}</p>
                      <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {from?.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {from?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Bill To</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{to?.name}</p>
                    <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {to?.address}</p>
                      <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {to?.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {to?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Order No.</span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="w-4 h-4 opacity-50" /> {invoice?.order?.order_number || "-"}
                </span>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Invoice Date</span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-50" /> {formatDate(invoice?.invoice_date as string)}
                </span>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Due Date</span>
                <span className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-50" /> {formatDate(invoice?.due_date as string)}
                </span>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Created By</span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 opacity-50" /> {invoice?.creator?.name || "-"}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/30 py-4 border-b-1 gap-0">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" /> Line Items
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                  <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Product Details</th>
                    <th className="px-6 py-4 font-medium text-right">Unit Price</th>
                    <th className="px-6 py-4 font-medium text-center">Qty</th>
                    <th className="px-6 py-4 font-medium text-right">Discount</th>
                    <th className="px-6 py-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice?.order?.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{item?.product?.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item?.product?.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {currency} {Number(item?.unit_price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="font-mono text-xs">{item?.quantity}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {Number(item?.discount || 0) > 0 ? `- ${currency} ${Number(item?.discount).toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                        {currency} {Number(item?.line_total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {(!invoice?.order?.items || invoice?.order?.items.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No items found on this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="shadow-sm border-border/60 overflow-hidden">
            <CardHeader className="bg-muted/30 py-4 border-b-1 gap-0 flex flex-row justify-between items-center">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment History
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
                  <tr className="text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Ref #</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Collected By</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice?.payments && invoice.payments.length > 0 ? (
                    invoice?.payments?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          {item?.payment_date ? new Date(item.payment_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {item?.reference_number || "-"}
                        </td>
                        <td className="px-6 py-4 capitalize">
                          <Badge variant="secondary" className="font-normal">{item?.payment_method}</Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {item?.creator?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          {currency} {Number(item?.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No payments recorded for this invoice yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-border/60 gap-4">
            <CardHeader className="gap-0 pt-6 pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Customer Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{to?.name}</p>
                  <Link to={`/dashboard/customers/${to?.id}`} className="text-xs text-blue-600 hover:underline">View Profile</Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                  <a href={`mailto:${to?.email}`}>
                    <Mail className="w-3 h-3 mr-1.5" /> Email
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                  <a href={`tel:${to?.phone}`}>
                    <Phone className="w-3 h-3 mr-1.5" /> Call
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-border/60 bg-slate-50 dark:bg-slate-900 overflow-hidden gap-4">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <CardHeader className="gap-0 pt-1">
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{currency} {Number(invoice?.order?.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-red-500">- {currency} {Number(invoice?.order?.discount_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tax</span>
                  <span>+ {currency} {Number(invoice?.order?.tax_amount || 0).toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold text-lg text-gray-900 dark:text-gray-100">
                  <span>Grand Total</span>
                  <span>{currency} {total}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-green-600 pt-2">
                  <span>Total Paid</span>
                  <span>{currency} {payableAmount}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-border/50 shadow-inner">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Balance Due</p>
                    <p className={`text-2xl font-black tracking-tight ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {currency} {balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    {balance <= 0 ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 px-3 py-1">Fully Paid</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 px-3 py-1">Outstanding</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
