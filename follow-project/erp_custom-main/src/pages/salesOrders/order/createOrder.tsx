"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, User, ShoppingCart, Receipt, CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { useGetAllProductsQuery } from "@/store/features/admin/productsApiService";
import {
  useAddSalesInvoiceMutation,
  useAddSalesOrderMutation,
} from "@/store/features/salesOrder/salesOrder";
import { useGetCustomersQuery } from "@/store/features/customers/customersApi";
import type { SalesOrderFormValues } from "@/types/salesOrder.types";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAppSelector } from "@/store/store";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@/types/types";

const orderSchema = z
  .object({
    customer_id: z.number().min(1, "Customer is required"),
    shipping_address: z.string().min(5, "Shipping address is required"),
    order_date: z.string().min(1, "Order date is required"),
    due_date: z.string().min(1, "Due date is required"),
    items: z.array(
      z.object({
        product_id: z.number().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit_price: z.number().min(1, "Unit price must be at least 1"),
        discount: z.number().min(0, "Discount must be 0 or more"),
        sales_tax: z.number().min(0, "Sales tax must be 0 or more"),
        stock_quantity: z.number().optional(),
      })
    ),
  })
  .refine(
    (data) => {
      const orderDate = new Date(data.order_date);
      const dueDate = new Date(data.due_date);

      return dueDate >= orderDate;
    },
    {
      message: "Due date cannot be earlier than order date",
      path: ["due_date"], // 👈 error shows under Due Date field
    }
  );

export default function CreateSalesOrderPage() {
  const [searchParam] = useSearchParams();
  const customerIdFromParam = searchParam.get("customerId");
  const navigate = useNavigate();
  const [addSalesOrder, { isLoading }] = useAddSalesOrderMutation();
  const [createInvoice] = useAddSalesInvoiceMutation();

  const currency = useAppSelector((state) => state.currency.value);


  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: 0,
      shipping_address: "",
      order_date: "",
      due_date: "",
      items: [{ product_id: 0, quantity: 1, unit_price: 0, discount: 0, sales_tax: 0, stock_quantity: 0 }],
    },
  });

  const { control, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // const items = watch("items");

  // const subtotal = items.reduce(
  //   (sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity || 0),
  //   0
  // );

  // const totalDiscount = items.reduce(
  //   (sum, it) => sum + Number(it.discount || 0),
  //   0
  // );

  // //console.log("totalDiscount", totalDiscount);

  // const total = subtotal - totalDiscount;

  // const taxedAmount = total * items[0].sales_tax / 100;

  // const grandTotal = total + taxedAmount;

  const items = watch("items") ?? [];

  const calculatedItems = items.map((it) => {
    const unitPrice = Number(it.unit_price || 0);
    const qty = Number(it.quantity || 0);
    const discount = Number(it.discount || 0);
    const taxRate = Number(it.sales_tax || 0);

    // 1️⃣ Subtotal (before discount & tax)
    const subtotal = unitPrice * qty;

    // 2️⃣ Amount after discount
    const taxableAmount = subtotal - discount;

    // 3️⃣ Tax amount
    const taxAmount = taxableAmount * (taxRate / 100);

    // 4️⃣ Line total (final)
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discount,
      taxableAmount,
      taxAmount,
      total,
    };
  });

  // 🔢 Totals across all products
  const totalSubtotal = calculatedItems.reduce(
    (sum, it) => sum + it.subtotal,
    0
  );

  const totalDiscount = calculatedItems.reduce(
    (sum, it) => sum + it.discount,
    0
  );

  // const totalTaxableAmount = calculatedItems.reduce(
  //   (sum, it) => sum + it.taxableAmount,
  //   0
  // );

  const totalTax = calculatedItems.reduce((sum, it) => sum + it.taxAmount, 0);

  const grandTotal = calculatedItems.reduce((sum, it) => sum + it.total, 0);

  const onSubmit = async (values: SalesOrderFormValues) => {
    if (values.customer_id === 0)
      return toast.error("Please select a customer");
    if (values.items.some((i) => i.product_id === 0))
      return toast.error("Please select all products");

    try {
      const payload = {
        order_date: values.order_date,
        due_date: values.due_date,
        customer_id: values.customer_id,
        shipping_address: values.shipping_address,
        items: values.items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount: Number(i.discount),
          sales_tax: Number(i.sales_tax),
        })),
      };

      // ➤ STEP 1: Create Sales Order
      const orderRes = await addSalesOrder(payload).unwrap();

      if (orderRes.status && orderRes?.data?.id) {
        toast.success("Sales Order Created! Creating Invoice...");

        // ➤ STEP 2: Create Invoice Automatically
        const invoicePayload = {
          order_id: orderRes.data.id,
          due_date: values.due_date, // same due date as order
        };

        const invoiceRes = await createInvoice(invoicePayload).unwrap();

        if (invoiceRes.status) {
          toast.success("Invoice Created Successfully!");
        } else {
          toast.error("Order created but invoice failed to generate.");
        }

        // ➤ Redirect
        navigate("/dashboard/sales/orders");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create sales order");
      console.error(error);
    }
  };

  /* -------------------- Customer & Product Select Fields -------------------- */
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

    if (customerIdFromParam) {
      const preselected = list.find(
        (c) => c.id === Number(customerIdFromParam)
      );
      if (preselected) field.onChange(preselected.id);
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full justify-between" variant="outline">
            {selected ? selected.name : "Select Customer..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
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

  const ProductSelectField = ({
    field,
    onProductSelect,
  }: {
    field: {
      value: number;
      onChange: (v: number) => void;
    };
    onProductSelect?: (product: Product) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { data, isLoading } = useGetAllProductsQuery({
      page: 1,
      limit: 50,
      search: query,
    });
    const list = Array.isArray(data?.data) ? data.data : [];
    const selected = list.find((p) => p.id === field.value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full justify-between overflow-hidden" variant="outline">
            <span className="truncate text-left flex-1">
              {selected
                ? `${selected.name} (SKU: ${selected.sku}) (Unit: ${selected.unit.name})`
                : "Select product..."}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search products..."
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No products found</CommandEmpty>
              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}
                {!isLoading &&
                  list.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => {
                        field.onChange(product.id);
                        onProductSelect?.(product);
                        setOpen(false);
                      }}
                    >
                      {product.name} (SKU: {product.sku}) (Unit:{" "}
                      {product.unit.name})
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Create Sales Order
          </h1>
          <p className="text-muted-foreground mt-2">Create a new sales order with customer and product details</p>
        </div>
        <Link to="/dashboard/sales/orders">
          <button className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </button>
        </Link>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Customer & Shipping */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Customer & Shipping</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Select customer and shipping details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <FormField
                  name="customer_id"
                  control={control}
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

                <FormField
                  name="order_date"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Date</FormLabel>
                      <Input type="date" {...field} className="block" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="due_date"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <Input type="date" {...field} className="block" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="shipping_address"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter shipping address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Order Items</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Add products to the order</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      product_id: 0,
                      quantity: 1,
                      unit_price: 0,
                      discount: 0,
                      sales_tax: 0,
                      stock_quantity: 0,
                    })
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-green-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-green-500/40 active:translate-y-0 active:shadow-none"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">

              <div className="space-y-3">
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-gray-50 p-3 rounded"
                  >
                    <FormField
                      name={`items.${index}.product_id`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-3">
                          <FormLabel>Product</FormLabel>
                          <FormControl>
                            <ProductSelectField
                              field={field}
                              onProductSelect={(product) => {
                                setValue(`items.${index}.sales_tax`, product.sales_tax ?? 0);
                                setValue(`items.${index}.stock_quantity`, product.stock_quantity ?? 0);
                                setValue(`items.${index}.unit_price`, Number(product.price) ?? 0);
                                if ((product.stock_quantity ?? 0) === 0) {
                                  setValue(`items.${index}.quantity`, 0);
                                } else {
                                  setValue(`items.${index}.quantity`, 1);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`items.${index}.stock_quantity`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`items.${index}.unit_price`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Unit Price ({currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              className="bg-white"
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const stock = watch(`items.${index}.stock_quantity`) ?? 0;
                                if (val > stock) {
                                  field.onChange(stock);
                                } else {
                                  field.onChange(val);
                                }
                              }}
                              className="bg-white"
                              disabled={(watch(`items.${index}.stock_quantity`) ?? 0) === 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`items.${index}.discount`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Discount</FormLabel>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className="bg-white"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`items.${index}.sales_tax`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Tax %</FormLabel>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            className="bg-white"
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            readOnly
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="sm:col-span-1">
                      <label className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 data-[error=true]:text-destructive mb-2">
                        Total Tax
                      </label>
                      <Input
                        type="number"
                        value={
                          calculatedItems[index]?.taxAmount.toFixed(2) ?? "0.00"
                        }
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    <div className="sm:col-span-1 font-semibold text-right self-center">
                      {currency} {calculatedItems[index]?.total.toFixed(2)}
                    </div>

                    <div className="sm:col-span-1 sm:flex sm:justify-end mt-2 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-red-300 dark:border-red-600 font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-2 border-blue-100 dark:border-blue-900 py-3 gap-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Order Summary</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Total calculations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-3 max-w-[300px] ml-auto">
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Subtotal:</div>
                  <div className="text-lg font-medium">{currency} {totalSubtotal.toFixed(2)}</div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Total Discount:</div>
                  <div className="text-lg font-medium text-red-600">- {currency} {totalDiscount.toFixed(2)}</div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Total Tax:</div>
                  <div className="text-lg font-medium">{currency} {totalTax.toFixed(2)}</div>
                </div>
                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg px-4 mt-4">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Grand Total:</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currency} {grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Create Sales Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
