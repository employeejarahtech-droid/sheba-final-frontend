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
import { ChevronLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import {
  useAddRawMaterialPaymentMutation,
  useGetAllRawMaterialPurchaseOrdersQuery,
  useGetAllRawMaterialPurchaseInvoicesQuery,
  useGetRawMaterialPurchaseInvoiceByIdQuery,
} from "@/store/features/admin/rawMaterialApiService";
import { useAppSelector } from "@/store/store";

const paymentSchema = z.object({
  purchase_order_id: z.number().min(1, "Please select a purchase order"),
  invoice_id: z.number().min(1, "Please select an invoice"),
  amount: z.number().positive("Amount must be greater than 0"),
  payment_method: z.string().min(1, "Please select a payment method"),
  payment_date: z.string().min(1, "Payment date is required"),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function MakeSupplierPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const po_number = searchParams.get("pon");
  const [addPayment, { isLoading: isSubmitting }] = useAddRawMaterialPaymentMutation();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      purchase_order_id: 0,
      invoice_id: 0,
      amount: undefined,
      payment_method: "",
      payment_date: new Date().toISOString().split("T")[0],
      reference_number: "",
      notes: "",
    },
  });

  const currency = useAppSelector((state) => state.currency.value);

  /* -------------------- Purchase Order Select -------------------- */
  const PurchaseOrderSelectField = ({
    field,
  }: {
    field: { value: number; onChange: (v: number) => void };
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(po_number || "");
    const { data, isLoading } = useGetAllRawMaterialPurchaseOrdersQuery({
      page: 1,
      limit: 10,
      search: query,
    });

    const list = Array.isArray(data?.data) ? data.data : [];

    // Auto-select PO if found in search results
    useEffect(() => {
      if (!field.value && list.length > 0 && po_number) {
        const po = list.find((po) => po.po_number === po_number);
        if (po) field.onChange(po.id || 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list, field, po_number]);

    const selected = list.find((po) => po.id === field.value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full justify-between" variant="outline">
            {selected ? `${selected.po_number}` : "Select Purchase Order..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-white shadow ring-1 ring-black/5 rounded-md">
          <Command>
            <CommandInput
              placeholder="Search Purchase Orders..."
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No Purchase Orders found</CommandEmpty>
              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}
                {!isLoading &&
                  list.map((po) => (
                    <CommandItem
                      key={po.id}
                      onSelect={() => {
                        field.onChange(po.id || 0);
                        setOpen(false);
                        // Reset invoice when PO changes
                        form.setValue("invoice_id", 0);
                      }}
                    >
                      {po.po_number}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  /* -------------------- Invoice Select (Filtered by PO) -------------------- */
  const InvoiceSelectField = ({
    field,
  }: {
    field: { value: number; onChange: (v: number) => void };
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const watchPO = form.watch("purchase_order_id");

    const { data, isLoading } = useGetAllRawMaterialPurchaseInvoicesQuery({
      page: 1,
      limit: 100,
      search: query,
    });

    const allInvoices = Array.isArray(data?.data) ? data.data : [];

    // Filter invoices by selected PO
    const filteredInvoices = watchPO
      ? allInvoices.filter((inv) => inv.purchase_order_id === watchPO)
      : [];

    const selected = filteredInvoices.find((inv) => inv.id === field.value);

    if (!watchPO) {
      return (
        <Button className="w-full justify-between" variant="outline" disabled>
          Select Purchase Order First
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full justify-between" variant="outline">
            {selected
              ? `${selected.invoice_number} - ${currency} ${selected.total_payable_amount}`
              : "Select Invoice..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-white shadow ring-1 ring-black/5 rounded-md">
          <Command>
            <CommandInput
              placeholder="Search Invoices..."
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {filteredInvoices.length === 0 && watchPO
                  ? "No Invoices found for this PO"
                  : "No Invoices found"}
              </CommandEmpty>
              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}
                {!isLoading &&
                  filteredInvoices.map((inv) => (
                    <CommandItem
                      key={inv.id}
                      onSelect={() => {
                        field.onChange(inv.id || 0);
                        setOpen(false);
                      }}
                    >
                      {inv.invoice_number} - {currency}{" "}
                      {inv.total_payable_amount}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  async function onSubmit(values: PaymentFormValues) {
    const payload = {
      purchase_order_id: values.purchase_order_id,
      invoice_id: values.invoice_id,
      amount: Number(values.amount),
      payment_date: values.payment_date,
      payment_method: values.payment_method,
      reference_number: values.reference_number || undefined,
      notes: values.notes || undefined,
    };

    try {
      const res = await addPayment(payload).unwrap();
      if (res.status) {
        toast.success(res.message || "Payment recorded successfully!");
        navigate("/dashboard/raw-materials/payments");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      toast.error("Failed to record payment.");
    }
  }

  const watchInvoice = form.watch("invoice_id");
  const watchAmount = form.watch("amount");

  const { data } = useGetRawMaterialPurchaseInvoiceByIdQuery(
    String(watchInvoice),
    {
      skip: !watchInvoice,
    }
  );
  const invoiceDetails = data?.data;

  const total = invoiceDetails?.total_payable_amount ?? 0;
  const paid = invoiceDetails?.paid_amount ?? 0;
  const balance = invoiceDetails?.due_amount ?? 0;

  // Validate amount against due amount
  useEffect(() => {
    if (watchAmount && balance > 0) {
      if (watchAmount > balance) {
        form.setError("amount", {
          type: "manual",
          message: `Amount cannot exceed the due amount of ${currency} ${balance.toFixed(2)}`,
        });
      } else {
        form.clearErrors("amount");
      }
    }
  }, [watchAmount, balance, form, currency]);

  return (
    <div className="w-full">
      {/* BACK BUTTON */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard/raw-materials/payments">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} /> Back to Payments
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Record Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Purchase Order Select */}
              <FormField
                control={form.control}
                name="purchase_order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Purchase Order *</FormLabel>
                    <FormControl>
                      <PurchaseOrderSelectField field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Select */}
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Invoice *</FormLabel>
                    <FormControl>
                      <InvoiceSelectField field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="block" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paying ({currency}) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
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
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="mobile_money">
                          Mobile Money
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reference Number */}
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Transaction ID, Check No, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-500 w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment
              </Button>
            </form>
          </Form>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {invoiceDetails && (
            <>
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Invoice Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>PO Number:</span>
                    <span className="font-medium">
                      {invoiceDetails.purchase_order?.po_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invoice Number:</span>
                    <span className="font-medium">
                      {invoiceDetails.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">
                      {currency} {total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Amount:</span>
                    <span className="font-medium">
                      {currency} {paid.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span>Balance Due:</span>
                    <span className="font-bold">
                      {currency} {balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {watchAmount && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">After Payment</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Payment Amount:</span>
                      <span className="font-medium">
                        {currency} {Number(watchAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Balance:</span>
                      <span className="font-bold">
                        {currency}{" "}
                        {Math.max(0, balance - Number(watchAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

