import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Receipt, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useGetCustomersQuery } from "@/store/features/customers/customersApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  useAddSalesPaymentMutation,
  useGetAllUnpaidSalesInvoicesQuery,
  useGetSalesInvoicesQuery,
  useGetInvoiceByIdQuery,
} from "@/store/features/salesOrder/salesOrder";
import { toast } from "sonner";
import { useAppSelector } from "@/store/store";

const paymentSchema = z.object({
  customer_id: z.number().min(1, "Required"),
  invoice_id: z.number().optional(),
  amount: z.any().refine((value) => Number(value)),
  payment_method: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function CreatePaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get("invoiceId");

  const currency = useAppSelector((state) => state.currency.value);

  const [addPayment] = useAddSalesPaymentMutation();

  // Fetch pre-selected invoice if param exists
  const { data: preSelectedInvoiceData } = useGetInvoiceByIdQuery(
    Number(invoiceIdParam),
    { skip: !invoiceIdParam }
  );
  const preSelectedInvoice = preSelectedInvoiceData?.data;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer_id: 0,
      invoice_id: 0,
      amount: undefined,
      payment_method: "",
      date: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
    },
  });

  // Effect to pre-fill form when invoice data loads
  useEffect(() => {
    if (preSelectedInvoice) {
      form.setValue("customer_id", preSelectedInvoice.order?.customer_id || 0);
      form.setValue("invoice_id", preSelectedInvoice.id);

      const totalAmount = Number(preSelectedInvoice.order?.total_amount || 0) -
        Number(preSelectedInvoice.order?.discount_amount || 0) +
        Number(preSelectedInvoice.order?.tax_amount || 0);
      const paidAmount = preSelectedInvoice.payments?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;
      const remainingBalance = totalAmount - paidAmount;

      form.setValue("amount", remainingBalance > 0 ? remainingBalance : 0);
    }
  }, [preSelectedInvoice, form]);

  /* -------------------- Customer  Select Fields -------------------- */
  const CustomerSelectField = ({
    field,
  }: {
    field: { value: number; onChange: (v: number) => void };
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { data, isLoading } = useGetCustomersQuery({
      page: 1,
      limit: 20,
      search: query,
    });
    const list = Array.isArray(data?.data) ? data.data : [];
    const selected = list.find((c) => c.id === field.value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full justify-between" variant="outline">
            {selected ? selected.name : "Select Customer..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 shadow-md rounded-lg bg-white z-1000">
          <Command>
            <CommandInput
              placeholder="Search customers..."
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No customers found</CommandEmpty>
              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}
                {!isLoading &&
                  list.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      onSelect={() => {
                        field.onChange(customer.id);
                        setOpen(false);
                      }}
                    >
                      {customer.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  /* -------------------- Invoice Select Field -------------------- */
  const InvoiceSelectField = ({
    field,
    customerId, // pass selected customer_id as prop
  }: {
    field: {
      value: number | undefined | null;
      onChange: (v: number | null) => void;
    };
    customerId: number;
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data, isLoading } = useGetAllUnpaidSalesInvoicesQuery(
      { page: 1, limit: 20, search: query, customerId },
      { skip: !customerId }
    );

    const unpaidInvoices = Array.isArray(data?.data) ? data.data : [];
    //console.log("Invoice List:", unpaidInvoices);
    const selected = unpaidInvoices.find(
      (inv) => Number(inv.id) === Number(field.value)
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className="w-full justify-between"
            variant="outline"
            disabled={!customerId}
          >
            {selected
              ? `${selected?.invoice_number}`
              : customerId
                ? "Select Invoice..."
                : "Select Customer first"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0 shadow-md rounded-lg bg-white">
          <Command>
            <CommandInput
              placeholder="Search invoices..."
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No invoices found to be paid</CommandEmpty>
              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}
                {!isLoading &&
                  unpaidInvoices?.map((invoice) => {
                    const amount =
                      (Number(invoice?.order?.total_amount) || 0) -
                      (Number(invoice?.order?.discount_amount) || 0) +
                      (Number(invoice?.order?.tax_amount) || 0);

                    return (
                      <CommandItem
                        key={invoice?.id}
                        onSelect={() => {
                          field.onChange(invoice?.id);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {invoice?.invoice_number}
                          </span>
                          <span className="text-xs text-gray-500">
                            Amount: {currency} {amount.toFixed(2)}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  /* --------------------------------------------------- */
  /* DYNAMIC SUMMARY WATCH VALUES */
  /* --------------------------------------------------- */
  const watchCustomer = form.watch("customer_id");
  const watchInvoice = form.watch("invoice_id");
  const watchAmount = form.watch("amount");
  const watchMethod = form.watch("payment_method");
  const watchDate = form.watch("date");

  const { data: customerData } = useGetCustomersQuery({
    page: 1,
    limit: 999,
    search: "",
  });
  const allCustomers = Array.isArray(customerData?.data)
    ? customerData.data
    : [];
  const customer = allCustomers.find((c) => c.id === watchCustomer);

  const { data: invoiceData } = useGetSalesInvoicesQuery({
    page: 1,
    limit: 999,
    search: "",
  });
  const allInvoices = Array.isArray(invoiceData?.data) ? invoiceData?.data : [];
  const invoice = allInvoices?.find((inv) => inv.id === watchInvoice);




  console.log("INVOICE:", invoice);

  async function onSubmit(values: PaymentFormValues) {
    // Construct payload dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {
      order_id: invoice?.order?.id,
      invoice_id: values.invoice_id, // invoice_id → order_id
      amount: Number(values.amount), // ensure numeric
      payment_method: values.payment_method.toLowerCase(), // lowercase
    };

    // Optional fields: add only if they have values
    if (values.customer_id) payload.customer_id = values.customer_id;
    if (values.date) payload.date = values.date;
    if (values.reference) payload.reference = values.reference;
    if (values.notes) payload.notes = values.notes;

    console.log("FINAL API PAYLOAD:", payload);

    try {
      const res = await addPayment(payload).unwrap();

      if (res.status) {
        toast.success(res.message || "Payment Added Successfully!");
        navigate("/dashboard/sales/payments");
      }
    } catch (error) {
      console.error("Payment Error:", error);

      const err = error as {
        data?: { message?: string };
      };

      toast.error(err?.data?.message || "Error Adding Payment");
    }
  }



  const isAmountInvalid =
    !invoice ||
    !watchAmount ||
    isNaN(Number(watchAmount)) ||
    Number(watchAmount) <= 0 ||
    Number(watchAmount) > Number(invoice?.remaining_balance ?? 0);


  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      {/* BACK BUTTON & HEADER */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Record Payment
          </h1>
          <p className="text-muted-foreground mt-2">Record a new payment for customer invoice</p>
        </div>
        <Link to="/dashboard/sales/payments">
          <button className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Payments
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT FORM */}
        <Card className="lg:col-span-2 overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Payment Details</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Customer, invoice, amount, and payment method</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* CUSTOMER */}
                  <FormField
                    name="customer_id"
                    control={form.control}
                    rules={{ required: "Customer required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <CustomerSelectField field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* INVOICE OPTIONAL */}

                  <FormField
                    name="invoice_id"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice </FormLabel>
                        <FormControl>
                          <InvoiceSelectField
                            field={field}
                            customerId={watchCustomer}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* AMOUNT */}
                  {/* <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount ({currency}){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                  <FormField
                    name="amount"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount ({currency}) <span className="text-red-500">*</span>
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;

                              // Allow clearing input
                              if (raw === "") {
                                form.clearErrors("amount");
                                field.onChange("");
                                return;
                              }

                              const value = Number(raw);
                              if (isNaN(value)) return;

                              if (invoice) {
                                const max = Number(
                                  invoice.remaining_balance ??
                                  (Number(invoice.total_payable || 0) -
                                    Number(invoice.paid_amount || 0))
                                );

                                if (value > max) {
                                  form.setError("amount", {
                                    type: "manual",
                                    message: `Amount cannot exceed remaining balance (${currency} ${max.toFixed(
                                      2
                                    )})`,
                                  });
                                } else {
                                  form.clearErrors("amount");
                                }
                              }

                              // Keep string for RHF (important!)
                              field.onChange(raw);
                            }}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  {/* METHOD */}
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Payment Method <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">
                              Bank Transfer
                            </SelectItem>
                            <SelectItem value="credit_card">
                              Credit Card
                            </SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PAYMENT DATE */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Payment Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input type="date" className="block" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* REFERENCE */}
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Cheque #, Transaction ID"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* NOTES */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional payment notes..."
                          className="h-28"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* BUTTONS */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    disabled={isAmountInvalid}
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Record Payment</span>
                  </button>
                  <Link to="/dashboard/sales/payments">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* RIGHT SIDE INFO */}
        <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-green-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:via-indigo-950/30 dark:to-indigo-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Payment Summary</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Review payment information</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">

            <div className="text-sm space-y-3 leading-relaxed">
              <p>
                <strong>Customer:</strong>{" "}
                {customer ? (
                  customer.name
                ) : (
                  <span className="text-gray-400">Not Selected</span>
                )}
              </p>

              <p>
                <strong>Invoice:</strong>{" "}
                {invoice ? (
                  `${invoice?.invoice_number}`
                ) : (
                  <span className="text-gray-400">None Selected</span>
                )}
              </p>

              {invoice &&
                (() => {
                  const invoiceTotal =
                    (Number(invoice?.order?.total_amount) || 0) -
                    (Number(invoice?.order?.discount_amount) || 0) +
                    (Number(invoice?.order?.tax_amount) || 0);

                  return (
                    <p>
                      <strong>Invoice Total:</strong> {currency}{" "}
                      {invoiceTotal.toFixed(2)}
                    </p>
                  );
                })()}

              <p>
                <strong>Payment Amount:</strong>{" "}
                {watchAmount ? (
                  <span>
                    {currency} {Number(watchAmount).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-gray-400">Not Entered</span>
                )}
              </p>

              <p>
                <strong>Method:</strong>{" "}
                {watchMethod ? (
                  watchMethod
                    .replaceAll("_", " ")
                    .replace(/^\w/, (c) => c.toUpperCase())
                ) : (
                  <span className="text-gray-400">Not Selected</span>
                )}
              </p>

              <p>
                <strong>Date:</strong> {watchDate}
              </p>

              {invoice &&
                watchAmount &&
                (() => {
                  const invoiceTotal =
                    (Number(invoice?.order?.total_amount) || 0) -
                    (Number(invoice?.order?.discount_amount) || 0) +
                    (Number(invoice?.order?.tax_amount) || 0);

                  const remaining = invoiceTotal - Number(watchAmount || 0);

                  return (
                    <p className="font-semibold text-blue-600">
                      Remaining Balance: RM {remaining.toFixed(2)}
                    </p>
                  );
                })()}
            </div>
          </CardContent>
        </Card>
      </div >
    </div >
  );
}







