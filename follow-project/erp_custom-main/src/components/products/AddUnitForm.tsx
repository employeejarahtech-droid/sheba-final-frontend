import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Form } from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAddUnitMutation } from "@/store/features/admin/productsApiService";
import { toast } from "sonner";
import { Loader, ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/store/store";
import { ProductPermission, SuperAdminPermission } from "@/config/permissions";

const unitSchema = z.object({
  name: z.string().min(1, "Required"),
  symbol: z.string().min(1, "Required"),
  is_active: z.boolean().optional(),
});
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetchUnits: () => void;
}

export default function AddUnitForm({
  open,
  onOpenChange,
  refetchUnits,
}: Props) {
  const userPermissions = useAppSelector(
    (state) => state.auth.user?.role.permissions || []
  );

  // Units permissions

  const canCreateUnits =
    userPermissions.includes(ProductPermission.CREATE_UNITS) ||
    userPermissions.includes(SuperAdminPermission.ACCESS_ALL);

  const form = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      symbol: "",
      is_active: true,
    },
  });

  const [addUnit, { isLoading }] = useAddUnitMutation();

  const onSubmit = async (data: z.infer<typeof unitSchema>) => {
    console.log("Form data:", data);

    const payload = {
      name: data.name,
      symbol: data.symbol,
      is_active: data.is_active,
    };

    try {
      const res = await addUnit(payload).unwrap();
      console.log("Unit added successfully:", res);
      if (res.status) {
        toast.success("Unit added successfully");
        onOpenChange(false);
        form.reset();
        refetchUnits();
      }
    } catch (error: any) {
      console.error("Error adding unit:", error);
      toast.error(error?.data?.message || "Failed to add unit");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Unit</SheetTitle>
        </SheetHeader>

        <div className="px-4">
          {!canCreateUnits ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You do not have permission to add a new Unit. <br />
                Please contact your administrator if you believe this is an
                error.
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  {/* Unit Name */}
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="name">Unit Name</FieldLabel>
                        <Input
                          id="name"
                          placeholder="Unit name (e.g., Pieces)"
                          {...field}
                          required
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />

                  {/* Symbol */}
                  <Controller
                    name="symbol"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="symbol">Unit Code</FieldLabel>
                        <Input
                          id="symbol"
                          placeholder="Abbreviation (e.g., pcs)"
                          {...field}
                          required
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />

                  {/* Is Active */}
                  <Controller
                    name="is_active"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="is_active">Active</FieldLabel>

                        <Select
                          value={field.value ? "true" : "false"}
                          onValueChange={(val) =>
                            field.onChange(val === "true")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>

                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />

                  {/* Submit Button */}
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Adding...
                      </div>
                    ) : (
                      "Add Unit"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
