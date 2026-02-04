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
import { ChevronLeft } from "lucide-react";
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
  useAddPurchasePaymentMutation,
  useGetAllApprovedPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
} from "@/store/features/purchaseOrder/purchaseOrderApiService";
import { useAppSelector } from "@/store/store";

const paymentSchema = z.object({
  purchase_order_id: z.number().min(1, "Required"),
  amount: z.number().min(0.01, "Required"),
  payment_method: z.string().min(1, "Required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function CreatePurchasePayments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purchase_order_number = searchParams.get("pon");
  const [addPayment] = useAddPurchasePaymentMutation();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      purchase_order_id: 0,
      amount: undefined,
      payment_method: "",
      reference: "",
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
    const [query, setQuery] = useState(purchase_order_number || "");
    const { data, isLoading } = useGetAllApprovedPurchaseOrdersQuery({
      page: 1,
      limit: 10,
      search: query,
    });

    const list = Array.isArray(data?.data) ? data.data : [];

    // Auto-select purchase order if found in search results
    useEffect(() => {
      if (!field.value && list.length > 0 && purchase_order_number) {
        const po = list.find((po) => po.po_number === purchase_order_number);
        if (po) field.onChange(po.id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list, field, purchase_order_number]);

    const selected = list.find((po) => po.id === field.value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full justify-between" variant="outline">
            {selected ? selected.po_number : "Select Purchase Order..."}
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
                        field.onChange(po.id);
                        setOpen(false);
                      }}
                    >
                      {po.po_number} - {currency} {po.total_payable_amount}
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
      amount: Number(values.amount),
      payment_method: values.payment_method.toLowerCase(),
      reference: values.reference || undefined,
      notes: values.notes || undefined,
    };

    console.log("FINAL PAYLOAD:", payload);

    try {
      const res = await addPayment(payload).unwrap();
      if (res.status) {
        toast.success(res.message || "Payment Added Successfully!");
        navigate("/dashboard/purchase-payments");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      toast.error("Failed to add payment.");
    }
  }

  const watchPO = form.watch("purchase_order_id");
  const watchAmount = form.watch("amount");
  const watchMethod = form.watch("payment_method");

  const { data } = useGetPurchaseOrderByIdQuery(watchPO, {
    skip: !watchPO,
  });
  const purchaseOrderDetails = data?.data;

  //  ------------  calculation variable of purchase order invoices ----

  const subtotal = purchaseOrderDetails?.total_amount ?? 0;
  const tax = purchaseOrderDetails?.tax_amount ?? 0;
  const discount = purchaseOrderDetails?.discount_amount ?? 0;

  const total = subtotal + tax - discount;
  const paid = purchaseOrderDetails?.total_paid_amount ?? 0;
  const balance = total - paid;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* BACK BUTTON */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard/purchase-payments">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} /> Back to Payments
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Record Purchase Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM */}
        <div className="lg:col-span-2 rounded-lg border p-6 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PURCHASE ORDER */}
                <FormField
                  name="purchase_order_id"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Order</FormLabel>
                      <FormControl>
                        <PurchaseOrderSelectField field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* AMOUNT */}
                {/* <FormField
                  name="amount"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (৳)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                          }
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
                      <FormLabel>Amount ({currency})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;

                            if (raw === "") {
                              form.clearErrors("amount");
                              field.onChange("");
                              return;
                            }

                            const value = Number(raw);
                            if (isNaN(value)) return;

                            if (purchaseOrderDetails) {
                              const max =
                                (purchaseOrderDetails.total_amount ?? 0) +
                                (purchaseOrderDetails.tax_amount ?? 0) -
                                (purchaseOrderDetails.discount_amount ?? 0) -
                                (purchaseOrderDetails.total_paid_amount ?? 0);

                              if (value > max) {
                                form.setError("amount", {
                                  type: "manual",
                                  message: `Amount cannot exceed due (${currency} ${max.toFixed(
                                    2
                                  )})`,
                                });
                              } else {
                                form.clearErrors("amount");
                              }
                            }

                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PAYMENT METHOD */}
                <FormField
                  name="payment_method"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
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

                {/* REFERENCE */}
                <FormField
                  name="reference"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Transaction ID or Cheque #"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NOTES */}
                <FormField
                  name="notes"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
                          className="h-28"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  disabled={
                    !watchPO ||
                    !watchAmount ||
                    (purchaseOrderDetails &&
                      watchAmount >
                      purchaseOrderDetails.total_amount +
                      purchaseOrderDetails.tax_amount -
                      purchaseOrderDetails.discount_amount -
                      purchaseOrderDetails.total_paid_amount)
                  }
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Record Payment
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* SUMMARY PANEL */}
        {/* SUMMARY PANEL */}
        <div className="rounded-xl border-2 border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-900 shadow-xl shadow-blue-500/10 overflow-hidden sticky top-6">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 p-4 border-b border-blue-100 dark:border-blue-900">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Payment Summary
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {purchaseOrderDetails ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">PO Number</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{purchaseOrderDetails.po_number}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{currency} {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Tax</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{currency} {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Discount</span>
                      <span className="font-medium text-red-500">- {currency} {discount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Total Amount</span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{currency} {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600 font-medium">Already Paid</span>
                      <span className="text-emerald-600 font-bold">{currency} {paid.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-amber-900 dark:text-amber-100">Remaining Balance</span>
                      <span className="font-bold text-xl text-amber-600 dark:text-amber-400">{currency} {balance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Current Payment</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Amount</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {watchAmount ? `${currency} ${Number(watchAmount).toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Method</span>
                    <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
                      {watchMethod ? watchMethod.replaceAll("_", " ") : "-"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Select a Purchase Order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
