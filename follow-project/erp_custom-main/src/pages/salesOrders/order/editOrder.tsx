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
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ordersData } from "@/data/data";
//import { useEffect } from "react";

interface OrderItem {
  productId: string;
  stock: number;
  price: number;
  qty: number;
  discount: number;
}

interface OrderFormValues {
  customerId: string;
  orderDate: string;
  dueDate: string;
  notes: string;
  items: OrderItem[];
  taxPercent: number;
}

export default function EditOrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  console.log(orderId);

  const order = ordersData.find((order) => order.orderNumber === orderId);
  console.log(order);

  const form = useForm<OrderFormValues>({
    defaultValues: {
      customerId: "",
      orderDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      notes: "",
      taxPercent: 0,
      items: [
        {
          productId: "",
          stock: 0,
          price: 0,
          qty: 1,
          discount: 0,
        },
      ],
    },
  });

  const { control, watch } = form;

//   useEffect(() => {
//     if (order) {
//       form.reset({
//         customerId: order?.customerId,
//         orderDate: order?.date,
//         dueDate: order?.dueDate,
//       });
//     }
//   }, [orderId]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const items = watch("items");
  const taxPercent = watch("taxPercent");

  /* -------------------------------
     CALCULATIONS
  --------------------------------*/
  const subtotal = items?.reduce((sum, item) => sum + item?.qty * item?.price, 0);

  const totalDiscount = items.reduce(
    (sum, item) => sum + (item?.qty * item?.price * item?.discount) / 100,
    0
  );

  const taxAmount = ((subtotal - totalDiscount) * taxPercent) / 100;

  const grandTotal = subtotal - totalDiscount + taxAmount;

  const onSubmit = (values: OrderFormValues) => {
    console.log("Order Submitted:", values);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center">
        <h1 className="text-3xl font-bold">Edit Order</h1>
        <Link to="/dashboard/orders" className="ml-auto">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* ---------------- CUSTOMER SECTION ---------------- */}
          <div className="border rounded-md p-4">
            <h2 className="font-semibold mb-4">Customer & Details</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Customer */}
              <FormField
                name="customerId"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Customer A</SelectItem>
                          <SelectItem value="2">Customer B</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Order Date */}
              <FormField
                name="orderDate"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date</FormLabel>
                    <Input type="date" {...field} />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Input type="date" {...field} />
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
                  <Textarea placeholder="Optional notes..." {...field} />
                </FormItem>
              )}
            />
          </div>

          {/* ---------------- ITEMS SECTION ---------------- */}
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Order Items</h2>
              <Button
                type="button"
                onClick={() =>
                  append({
                    productId: "",
                    stock: 0,
                    price: 0,
                    qty: 1,
                    discount: 0,
                  })
                }
              >
                + Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-7 gap-3 items-center bg-gray-50 p-3 rounded"
                >
                  {/* Product */}
                  <FormField
                    name={`items.${index}.productId`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="p1">Product A</SelectItem>
                              <SelectItem value="p2">Product B</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Stock */}
                  <FormField
                    name={`items.${index}.stock`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <Input {...field} type="number" readOnly />
                      </FormItem>
                    )}
                  />

                  {/* Unit Price */}
                  <FormField
                    name={`items.${index}.price`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <Input type="number" step="0.01" {...field} />
                      </FormItem>
                    )}
                  />

                  {/* Qty */}
                  <FormField
                    name={`items.${index}.qty`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <Input type="number" {...field} />
                      </FormItem>
                    )}
                  />

                  {/* Discount */}
                  <FormField
                    name={`items.${index}.discount`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disc %</FormLabel>
                        <Input type="number" {...field} />
                      </FormItem>
                    )}
                  />

                  {/* Line Total */}
                  <div>
                    <FormLabel>Line Total</FormLabel>
                    <div className="font-semibold">
                      {(
                        items[index].qty *
                        items[index].price *
                        (1 - items[index].discount / 100)
                      ).toFixed(2)}
                    </div>
                  </div>

                  {/* Remove */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline-destructive"
                    onClick={() => remove(index)}
                    className="w-10"
                  >
                    X
                  </Button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 space-y-1 text-right pr-2">
              <div>Subtotal: {subtotal.toFixed(2)}</div>
              <div>Discount: {totalDiscount.toFixed(2)}</div>
              <div>
                Tax ({taxPercent}%): {taxAmount.toFixed(2)}
              </div>
              <div className="font-bold text-lg">
                Total: {grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button className="px-6" type="submit">
              Create Order
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
