"use client";
import { useFieldArray, useForm, type UseFormSetValue } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// select import removed; using Popover+Command for searchable selects
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";

import { toast } from "sonner";

import { useAddPurchaseOrderMutation } from "@/store/features/purchaseOrder/purchaseOrderApiService";
import { useNavigate, useSearchParams } from "react-router";
import { useGetAllSuppliersQuery, useGetSupplierByIdQuery } from "@/store/features/suppliers/supplierApiService";
import type { Supplier } from "@/types/supplier.types";
import { useGetAllProductsQuery } from "@/store/features/admin/productsApiService";
import { useState } from "react";
import { useAppSelector } from "@/store/store";
import { BackButton } from "@/components/BackButton";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, CheckCircle2, ShoppingCart } from "lucide-react";

const orderSchema = z
  .object({
    supplierId: z.number().min(1, "Required"),
    notes: z.string().optional(),
    order_date: z.string().min(1, "Required"),
    expected_delivery_date: z.string().min(1, "Required"),
    items: z.array(
      z.object({
        productId: z.number().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit_cost: z.number().min(1, "Unit price must be at least 1"),
        discount: z.number().min(0, "Discount must be 0 or more"),
        purchase_tax: z.number().min(0, "Purchase tax must be 0 or more"),
      })
    ),
  })
  .refine(
    (data) => {
      const orderDate = new Date(data.order_date);
      const dueDate = new Date(data.expected_delivery_date);

      return dueDate >= orderDate;
    },
    {
      message: "Expected delivery date cannot be earlier than order date",
      path: ["expected_delivery_date"], // 👈 error shows under Expected Delivery Date field
    }
  );

/* ---------------- TYPES ---------------- */

type PurchaseOrderFormValues = z.infer<typeof orderSchema>;

/* ---------------------------------------- */

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplierIdParam = searchParams.get("supplierId");

  const currency = useAppSelector((state) => state.currency.value);
  const [addPurchaseOrder, { isLoading }] = useAddPurchaseOrderMutation();

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      supplierId: supplierIdParam ? Number(supplierIdParam) : 0,
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      notes: "",
      items: [
        {
          productId: 0,
          quantity: 1,
          unit_cost: 0,
          discount: 0,
          purchase_tax: 0,
        },
      ],
    },
  });

  const { control, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  /* ---------------- Searchable select components ---------------- */

  function SupplierSelectField({
    field,
  }: {
    field: { value?: number; onChange: (v: number) => void };
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    // Call API with search query
    const { data, isLoading } = useGetAllSuppliersQuery({
      page: 1,
      limit: 20,
      search: query,
    });

    // Fetch single supplier if we have a value (to ensure display name is available)
    const { data: singleData } = useGetSupplierByIdQuery(field.value!, {
      skip: !field.value,
    });

    const list = Array.isArray(data?.data) ? data.data : [];

    const selected =
      list.find((s: Supplier) => Number(s.id) === Number(field.value)) ||
      (singleData?.data?.id && Number(singleData.data.id) === Number(field.value)
        ? singleData.data
        : undefined);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selected ? selected.name : "Select Supplier..."}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput
              placeholder="Search suppliers..."
              onValueChange={(value) => setQuery(value)}
            />

            <CommandList>
              <CommandEmpty>No suppliers found.</CommandEmpty>

              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}

                {!isLoading &&
                  list.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      onSelect={() => {
                        field.onChange(Number(supplier.id));
                        setOpen(false);
                      }}
                    >
                      {supplier.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // function ProductSelectField({
  //   field,
  // }: {
  //   field: { value?: string; onChange: (v: string) => void };
  // }) {
  //   const [open, setOpen] = useState(false);
  //   const [query, setQuery] = useState("");

  //   const { data, isLoading } = useGetAllProductsQuery({
  //     page: 1,
  //     limit: 50,
  //     search: query,
  //   });

  //   const list = Array.isArray(data?.data) ? data.data : [];

  //   const selected = list.find(
  //     (p) => String(p.id) === String(field.value)
  //   );

  //   return (
  //     <Popover open={open} onOpenChange={setOpen}>
  //       <PopoverTrigger asChild>
  //         <Button variant="outline" className="w-full justify-between">

  //           {selected
  //             ? `${selected.name} (SKU: ${selected.sku}) (${selected.unit?.name || "-"})`
  //             : "Select Product..."}
  //         </Button>
  //       </PopoverTrigger>

  //       <PopoverContent className="w-[320px] p-0">
  //         <Command>
  //           <CommandInput
  //             placeholder="Search products..."
  //             onValueChange={(value) => setQuery(value)}
  //           />

  //           <CommandList>
  //             <CommandEmpty>No products found.</CommandEmpty>

  //             <CommandGroup>
  //               {isLoading && (
  //                 <div className="py-2 px-3 text-sm text-gray-500">
  //                   Loading...
  //                 </div>
  //               )}

  //               {!isLoading &&
  //                 list.map((product) => (
  //                   <CommandItem
  //                     key={product.id}
  //                     onSelect={() => {
  //                       field.onChange(String(product.id));
  //                       setOpen(false);
  //                     }}
  //                   >
  //                     {product.name} (SKU: {product.sku}) ( {product.unit?.name || "-"})
  //                   </CommandItem>
  //                 ))}
  //             </CommandGroup>
  //           </CommandList>
  //         </Command>
  //       </PopoverContent>
  //     </Popover>
  //   );
  // }

  function ProductSelectField({
    field,
    index,
    setValue,
  }: {
    field: { value?: number; onChange: (v: number) => void };
    index: number;
    setValue: UseFormSetValue<PurchaseOrderFormValues>;
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data, isLoading } = useGetAllProductsQuery({
      page: 1,
      limit: 50,
      search: query,
    });

    const list = Array.isArray(data?.data) ? data.data : [];

    const selected = list.find((p) => Number(p.id) === Number(field.value));

    const handleSelect = (productId: number) => {
      const product = list.find((p) => p.id === productId);
      field.onChange(Number(productId));
      setOpen(false);

      // Auto-set purchase_tax for this row
      setValue(`items.${index}.purchase_tax`, product?.purchase_tax || 0);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selected
              ? `${selected.name} (SKU: ${selected.sku}) (${selected.unit?.name || "-"
              })`
              : "Select Product..."}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput
              placeholder="Search products..."
              onValueChange={(value) => setQuery(value)}
            />

            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>

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
                      onSelect={() => handleSelect(Number(product.id))}
                    >
                      {product.name} (SKU: {product.sku}) (
                      {product.unit?.name || "-"})
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // const subtotal = items.reduce(
  //   (sum, item) =>
  //     sum +
  //     Number(item.quantity) * Number(item.unit_cost) -
  //     Number(item.discount || 0),
  //   0
  // );

  // const totalDiscount = items.reduce(
  //   (sum, item) => sum + Number(item.discount || 0),
  //   0
  // );

  // const TAX_RATE = 0; // 0%

  // const taxAmount = (subtotal * TAX_RATE) / 100;

  // const grandTotal = subtotal + taxAmount;

  // Subtotal = sum of (unit_cost * quantity - discount)
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost),
    0
  );

  // Total Discount
  const totalDiscount = items.reduce(
    (sum, item) => sum + Number(item.discount || 0),
    0
  );

  // Total Tax = sum of each item's tax
  const totalTax = items.reduce(
    (sum, item) =>
      sum +
      ((Number(item.unit_cost) * Number(item.quantity) -
        Number(item.discount || 0)) *
        (Number(item.purchase_tax) || 0)) /
      100,
    0
  );

  // Grand Total
  const grandTotal = subtotal - totalDiscount + totalTax;

  /* ---------------- ON SUBMIT ---------------- */
  const onSubmit = async (values: PurchaseOrderFormValues) => {
    try {
      const payload = {
        supplier_id: Number(values.supplierId),
        order_date: values.order_date,
        expected_delivery_date: values.expected_delivery_date,
        notes: values.notes,
        items: values.items.map((item) => ({
          product_id: Number(item.productId),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
          discount: Number(item.discount),
          purchase_tax: Number(item.purchase_tax),
        })),
      };

      const response = await addPurchaseOrder(payload).unwrap();

      console.log("Purchase Order Created:", response);

      toast.success("Purchase Order Created Successfully");

      navigate("/dashboard/suppliers/purchase-orders");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create purchase order");
      console.error(error);
    }
  };

  /* ---------------------------------------- */
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Create Purchase Order
          </h1>
          <p className="text-muted-foreground mt-2">Create a new purchase order for your supplier</p>
        </div>
        <BackButton />
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* ---------------- SUPPLIER & DETAILS ---------------- */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Supplier & Order Details</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Select supplier and set order dates</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6">

              <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-4">
                {/* Supplier */}
                <FormField
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <SupplierSelectField field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Order Date */}
                <FormField
                  name="order_date"
                  control={control}
                  rules={{ required: "Order Date is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="block" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expected Date */}
                <FormField
                  name="expected_delivery_date"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="block" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                name="notes"
                control={control}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ---------------- ITEMS ---------------- */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Order Items</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Add products to this purchase order</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      productId: 0,
                      quantity: 1,
                      unit_cost: 0,
                      discount: 0,
                      purchase_tax: 0,
                    })
                  }
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 font-medium text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">

              <div className="space-y-4">
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200"
                  >
                    {/* Product */}
                    {/* <FormField
                    name={`items.${index}.productId`}
                    control={control}
                    rules={{ required: "Product required" }}
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Product</FormLabel>
                        <FormControl>
                          <ProductSelectField field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                    <FormField
                      name={`items.${index}.productId`}
                      control={control}
                      rules={{ required: "Product required" }}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Product</FormLabel>
                          <FormControl>
                            <ProductSelectField
                              field={field}
                              index={index}
                              setValue={form.setValue}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit Price */}
                    <FormField
                      name={`items.${index}.unit_cost`}
                      control={control}
                      rules={{ required: "Price required" }}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      name={`items.${index}.quantity`}
                      control={control}
                      rules={{ required: "Quantity required" }}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* discount */}
                    <FormField
                      name={`items.${index}.discount`}
                      control={control}
                      rules={{ required: "Discount required" }}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Discount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
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
                      name={`items.${index}.purchase_tax`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>Tax%</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              readOnly
                            />
                          </FormControl>
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
                          ((items[index].quantity * items[index].unit_cost -
                            items[index].discount) *
                            (items[index].purchase_tax || 0)) /
                          100
                        }
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Line Total */}
                    {/* <div className="col-span-1">
                    <FormLabel>Total</FormLabel>
                    <div className="font-semibold">
                      {currency} {(
                        items[index].quantity * items[index].unit_cost -
                        items[index].discount
                      ).toFixed(2)}

                    </div>
                  </div> */}

                    {/* Line Total */}
                    <div className="sm:col-span-1">
                      <FormLabel>Total</FormLabel>
                      <div className="font-semibold">
                        {currency}{" "}
                        {(
                          items[index].quantity * items[index].unit_cost -
                          items[index].discount +
                          ((items[index].quantity * items[index].unit_cost -
                            items[index].discount) *
                            (items[index].purchase_tax || 0)) /
                          100
                        ).toFixed(2)}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="outline-destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        X
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-xl border-2 border-blue-100 dark:border-blue-900 max-w-[300px] ml-auto">
                <div className="text-right space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-semibold">{currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                    <span className="font-medium">Discount:</span>
                    <span className="font-semibold">- {currency} {totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="font-semibold">{currency} {totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-1 border-blue-200 dark:border-blue-800 pt-3 mt-2">
                    <span>Grand Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">{currency} {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/suppliers/purchase-orders')}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Cancel
            </button>
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
                  <span>Create Purchase Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
