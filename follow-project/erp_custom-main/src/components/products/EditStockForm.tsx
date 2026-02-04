import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Button } from "../ui/button";
import {
  useGetProductByIdQuery,
  useUpdateStockMutation,
} from "@/store/features/admin/productsApiService";
import { toast } from "sonner";
import { Field, FieldError, FieldLabel } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useAppSelector } from "@/store/store";
import { ProductPermission, SuperAdminPermission } from "@/config/permissions";
import { ShieldAlert } from "lucide-react";

// 1️⃣ Define form schema using Zod
const stockFormSchema = z.object({
  product_id: z.number().min(1, "Required"),
  current_stock: z.number().min(0, "Current stock must be 0 or more"),
  quantity: z.number().min(1, "Stock must be greater than 0"),
  operation: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  movement_type: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

type StockFormValues = z.infer<typeof stockFormSchema>;

export default function EditStockForm({
  open,
  setOpen,
  productId,
  refetchStockMovements,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  productId: number;
  refetchStockMovements: () => void;
}) {
  const userPermissions = useAppSelector(
    (state) => state.auth.user?.role.permissions || []
  );

  const canEditStock =
    userPermissions.includes(ProductPermission.EDIT_STOCK) ||
    userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      product_id: 0,
      current_stock: 0,
      quantity: 0,
      operation: "add",
      date: new Date().toISOString().split("T")[0],
      movement_type: "adjustment",
      notes: "",
    },
  });

  const { control } = form;

  const { data: fetchedProduct, refetch: refetchProduct } =
    useGetProductByIdQuery(Number(productId), {
      skip: !Number(productId),
    });

  const selectedProduct = fetchedProduct?.data;

  console.log("Selected Product:", selectedProduct);

  useEffect(() => {
    if (selectedProduct) {
      form.reset({
        product_id: selectedProduct?.id,
        current_stock: selectedProduct?.stock_quantity,
        quantity: 0,
        operation: "add",
        date: new Date().toISOString().split("T")[0],
        movement_type: "adjustment",
        notes: "",
      });
    }
  }, [selectedProduct, form]);

  const [updateStock] = useUpdateStockMutation();
  const onSubmit = async (values: z.infer<typeof stockFormSchema>) => {
    if (!selectedProduct) return;
    const payload = {
      id: selectedProduct.id,
      body: {
        quantity: Number(values.quantity),
        operation: values.operation,
        movement_type: values.movement_type,
        date: values.date,
        notes: values.notes,
      },
    };
    console.log("Payload:", payload);
    try {
      const res = await updateStock(payload).unwrap();
      console.log("Stock updated successfully:", res);
      if (res.status) {
        toast.success("Stock updated successfully");
        refetchProduct?.();
        refetchStockMovements();
        setOpen(false);
      } else {
        toast.error(res.message || "Failed to update stock");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update stock");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Adjust Stock</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adjust Stock</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          {!canEditStock ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You do not have permission to edit a Stock. <br />
                Please contact your administrator if you believe this is an
                error.
              </p>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* PRODUCT DROPDOWN */}
                {/* <Controller
                control={control}
                name="product_id"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Product Name</FieldLabel>
                    <Input
                      type="text"
                      placeholder="Enter product name"
                      value={selectedProduct?.name || ""}
                      disabled
                    />
                  </Field>
                )}
              /> */}

                <Field>
                  <FieldLabel>Product Name</FieldLabel>
                  <Input
                    type="text"
                    value={selectedProduct?.name ?? ""}
                    disabled
                  />
                </Field>

                {/* STOCK INPUT */}
                <Controller
                  control={control}
                  name="current_stock"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Current Stock</FieldLabel>
                      <Input
                        type="number"
                        placeholder="Enter stock"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled
                      />

                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="quantity"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Quantity</FieldLabel>
                      <Input
                        type="number"
                        placeholder="Enter stock"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="operation"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Operation</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add">Add</SelectItem>
                          <SelectItem value="subtract">Subtract</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="movement_type"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Movement Type</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="sale">Sale</SelectItem>
                          <SelectItem value="return">Return</SelectItem>
                          <SelectItem value="adjustment">Adjustment</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="waste">Waste</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="date"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Notes</FieldLabel>
                      <Input type="date" {...field} className="block" />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="notes"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Notes</FieldLabel>
                      <Textarea placeholder="Write notes..." {...field} />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />

                <div className="flex justify-center items-center gap-2">
                  <Button type="submit">Adjust Stock</Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
