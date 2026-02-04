"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetSalesPaymentByIdQuery } from "@/store/features/salesOrder/salesOrder";
import { useAppSelector } from "@/store/store";
import { Link, useParams } from "react-router";
import { ArrowLeft, CreditCard, FileText, User, Calendar, Hash, Banknote, UserCheck } from "lucide-react";

export default function PaymentDetails() {
  const currency = useAppSelector((state) => state.currency.value);
  const { paymentId } = useParams();
  const { data, isLoading, error } = useGetSalesPaymentByIdQuery(paymentId as string);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <p className="text-muted-foreground text-lg">Loading payment details...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <p className="text-red-500 font-medium text-lg">Payment not found.</p>
      </div>
    );
  }

  const paymentData = data.data;

  const payment = {
    number: `PAY-${paymentData.id.toString().padStart(6, "0")}`,
    date: new Date(paymentData.payment_date).toLocaleDateString(),
    method: paymentData.payment_method
      .replaceAll("_", " ")
      .replace(/^\w/, (c: string) => c.toUpperCase()),
    reference: paymentData.reference_number || "-",
    notes: paymentData.notes || "-",
    amount: Number(paymentData.amount),
    recordedBy: paymentData.created_by || "-",
    invoice: paymentData.invoice
      ? {
        id: paymentData.invoice.id,
        number: paymentData.invoice.invoice_number,
        total: Number(paymentData.invoice.total_amount), // Use sales invoice total amount
      }
      : null,
  };

  const customer = paymentData.order?.customer
    ? {
      name: paymentData.order.customer.name,
      code: `CUST-${paymentData.order.customer.id.toString().padStart(3, "0")}`,
      email: paymentData.order.customer.email,
      phone: paymentData.order.customer.phone
    }
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in-50 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/dashboard/sales/payments" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Payments
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Payment #{paymentData.id.toString().padStart(6, "0")}
            </h1>
            <Badge className="bg-green-600 text-white capitalize px-3 py-1 shadow-sm">
              Completed
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {payment.invoice && (
            <Link to={`/dashboard/sales/invoices/${payment.invoice.id}`}>
              <Button variant="outline" className="gap-2 shadow-sm">
                <FileText className="w-4 h-4" /> View Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Payment Details */}
        <div className="lg:col-span-8 space-y-6">

          {/* Meta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Payment Date</span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-50" /> {payment.date}
                </span>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Payment Method</span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 opacity-50" /> {payment.method}
                </span>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-medium">Recorded By</span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 opacity-50" /> {payment.recordedBy}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Info Card */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="bg-muted/30 py-4 border-b-1 gap-0">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Reference Number</p>
                  <div className="flex items-center gap-2 font-mono text-sm bg-muted/40 p-2 rounded border border-border/50 w-fit">
                    <Hash className="w-3.5 h-3.5 opacity-50" /> {payment.reference}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-3xl font-bold text-green-600 tracking-tight">
                    {currency} {payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Notes / Remarks</p>
                <div className="bg-muted/20 p-4 rounded-lg border border-border/50 text-sm italic min-h-[80px]">
                  "{payment.notes}"
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Customer & Summary */}
        <div className="lg:col-span-4 space-y-6">

          {/* Customer Snapshot */}
          <Card className="shadow-sm border-border/60 gap-4">
            <CardHeader className="pt-4 gap-0">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" /> Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              {customer ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{customer.name}</p>
                      <span className="text-xs text-muted-foreground block">{customer.code}</span>
                    </div>
                  </div>
                  {(customer.email || customer.phone) && (
                    <div className="pt-3 border-t text-sm space-y-1 text-muted-foreground">
                      {customer.email && <p>{customer.email}</p>}
                      {customer.phone && <p>{customer.phone}</p>}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No customer information available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inovice Snapshot */}
          {payment.invoice && (
            <Card className="shadow-sm border-border/60 bg-blue-50/50 dark:bg-blue-900/10 gap-4">
              <CardHeader className="pt-4 gap-0">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Linked Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Invoice #</span>
                  <Link to={`/dashboard/sales/invoices/${payment.invoice.id}`} className="font-semibold text-blue-600 hover:underline">
                    {payment.invoice.number}
                  </Link>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{currency} {payment.invoice.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
