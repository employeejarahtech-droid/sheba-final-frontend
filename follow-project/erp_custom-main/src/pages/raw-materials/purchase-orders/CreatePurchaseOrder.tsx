"use client";
import { useFieldArray, useForm } from "react-hook-form";
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
import { useNavigate } from "react-router";
import { useState } from "react";
import { useAppSelector } from "@/store/store";
import { BackButton } from "@/components/BackButton";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAllRawMaterialSuppliersQuery } from "@/store/features/admin/rawMaterialApiService";
import { useGetAllRawMaterialsQuery } from "@/store/features/admin/rawMaterialApiService";
import { useAddRawMaterialPurchaseOrderMutation } from "@/store/features/admin/rawMaterialApiService";
import { Trash2 } from "lucide-react";

const orderSchema = z
  .object({
    supplierId: z.number().min(1, "Required"),
    notes: z.string().min(1, "Required"),
    order_date: z.string().min(1, "Required"),
    expected_delivery_date: z.string().min(1, "Required"),
    items: z.array(
      z.object({
        rawMaterialId: z.number().min(1, "Raw material is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit_cost: z.number().min(1, "Unit price must be at least 1"),
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
      path: ["expected_delivery_date"],
    }
  );

type PurchaseOrderFormValues = z.infer<typeof orderSchema>;

export default function CreateRMPurchaseOrder() {
  const navigate = useNavigate();
  const currency = useAppSelector((state) => state.currency.value);
  const [addPurchaseOrder, { isLoading }] = useAddRawMaterialPurchaseOrderMutation();

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      supplierId: 0,
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      notes: "",
      items: [
        {
          rawMaterialId: 0,
          quantity: 1,
          unit_cost: 0,
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

  function SupplierSelectField({
    field,
  }: {
    field: { value?: number; onChange: (v: number) => void };
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data, isLoading } = useGetAllRawMaterialSuppliersQuery({
      page: 1,
      limit: 20,
      search: query,
    });

    const list = Array.isArray(data?.data) ? data.data : [];
    const selected = list.find((s) => Number(s.id) === Number(field.value));

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

  function RawMaterialSelectField({
    field,
  }: {
    field: { value?: number; onChange: (v: number) => void };
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data, isLoading } = useGetAllRawMaterialsQuery({
      page: 1,
      limit: 50,
      search: query,
    });

    const list = Array.isArray(data?.data) ? data.data : [];
    const selected = list.find((m) => Number(m.id) === Number(field.value));

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left">
            {selected
              ? `${selected.name} (SKU: ${selected.sku || "-"})`
              : "Select Raw Material..."}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput
              placeholder="Search raw materials..."
              onValueChange={(value) => setQuery(value)}
            />

            <CommandList>
              <CommandEmpty>No raw materials found.</CommandEmpty>

              <CommandGroup>
                {isLoading && (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Loading...
                  </div>
                )}

                {!isLoading &&
                  list.map((material) => (
                    <CommandItem
                      key={material.id}
                      onSelect={() => {
                        field.onChange(Number(material.id));
                        setOpen(false);
                      }}
                    >
                      {material.name} (SKU: {material.sku || "-"})
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    try {
      const payload = {
        supplier_id: values.supplierId,
        order_date: values.order_date,
        expected_delivery_date: values.expected_delivery_date,
        notes: values.notes,
        items: values.items.map((item) => ({
          product_id: item.rawMaterialId,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      };

      const res = await addPurchaseOrder(payload).unwrap();
      if (res?.status) {
        toast.success("Purchase Order created successfully!");
        navigate("/dashboard/raw-materials/purchase-orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create purchase order");
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity * item.unit_cost),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        <BackButton />
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* SUPPLIER & DETAILS */}
          <div className="border rounded-md p-4">
            <h2 className="font-semibold mb-4">Supplier & Details</h2>

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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input type="date" {...field} />
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
          </div>

          {/* ORDER ITEMS */}
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Order Items</h2>
              <Button
                type="button"
                onClick={() =>
                  append({
                    rawMaterialId: 0,
                    quantity: 1,
                    unit_cost: 0,
                  })
                }
              >
                + Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start border p-3 rounded bg-slate-50">
                  {/* Raw Material */}
                  <FormField
                    name={`items.${index}.rawMaterialId`}
                    control={control}
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormLabel className="text-xs">Raw Material</FormLabel>
                        <FormControl>
                          <RawMaterialSelectField field={field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    name={`items.${index}.quantity`}
                    control={control}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Unit Cost */}
                  <FormField
                    name={`items.${index}.unit_cost`}
                    control={control}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Unit Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Total */}
                  <div className="col-span-2 pt-6">
                    <Input
                      type="number"
                      disabled
                      value={(items[index].quantity * items[index].unit_cost).toFixed(2)}
                      className="bg-gray-100 text-right"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t text-right">
              <div className="text-lg font-semibold">
                Total: {currency} {totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
