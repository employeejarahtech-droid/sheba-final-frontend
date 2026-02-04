import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import {
  useGetAllRawMaterialCategoriesQuery,
  useAddRawMaterialMutation,
} from "@/store/features/admin/rawMaterialApiService";
import { useGetAllUnitsQuery } from "@/store/features/admin/productsApiService";
import { BackButton } from "@/components/BackButton";

/* ------------------ ZOD SCHEMA ------------------ */
const rawMaterialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.number().min(1, "Category is required"),
  supplier: z.string().optional(),
  unit: z.number().min(1, "Unit of measure is required"),
  cost: z.number().min(0, "Cost must be at least 0"),
  initialStock: z.number().min(0, "Initial stock must be at least 0"),
  minStock: z.number().min(0, "Min stock must be at least 0"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

type RawMaterialFormValues = z.infer<typeof rawMaterialSchema>;

/* ------------------ PAGE ------------------ */
const AddRawMaterial = () => {
  const navigate = useNavigate();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  // Fetch categories
  const { data: fetchedCategories } = useGetAllRawMaterialCategoriesQuery({
    search: categorySearch,
  });

  // Fetch units
  const { data: fetchedUnits } = useGetAllUnitsQuery({
    search: unitSearch,
  });

  // Add raw material mutation
  const [addRawMaterial, { isLoading: isSubmitting }] =
    useAddRawMaterialMutation();

  const form = useForm<RawMaterialFormValues>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: 0,
      supplier: "",
      unit: 0,
      cost: 0,
      initialStock: 0,
      minStock: 0,
      description: "",
      is_active: true,
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit = async (values: RawMaterialFormValues) => {
    try {
      await addRawMaterial({
        name: values.name,
        sku: values.sku,
        category_id: values.category,
        supplier: values.supplier || "",
        unit_id: values.unit,
        cost: values.cost,
        initial_stock: values.initialStock,
        min_stock: values.minStock,
        description: values.description || "",
        is_active: values.is_active ?? true,
      }).unwrap();

      toast.success("Raw material added successfully!");
      navigate("/dashboard/raw-materials");
      form.reset();
    } catch (error) {
      console.error("Error adding raw material:", error);
      toast.error("Failed to add raw material");
      if (error instanceof Error) {
        toast.error("Error: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Add Raw Material</h1>
        <BackButton />
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* BASIC INFO */}
          <Card>
            <CardHeader>
              <CardTitle>Material Details</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              {/* NAME */}
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Material Name</FieldLabel>
                    <Input placeholder="e.g. Cotton Fabric" {...field} />
                    <FieldError>{fieldState?.error?.message}</FieldError>
                  </Field>
                )}
              />

              {/* SKU */}
              <Controller
                control={control}
                name="sku"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>SKU</FieldLabel>
                    <Input placeholder="e.g. RM-001" {...field} />
                    <FieldError>{fieldState?.error?.message}</FieldError>
                  </Field>
                )}
              />

              {/* CATEGORY */}
              <Controller
                control={control}
                name="category"
                render={({ field, fieldState }) => {
                  const selected = fetchedCategories?.data?.find(
                    (cat) => cat.id === field.value
                  );

                  return (
                    <Field>
                      <FieldLabel>Category</FieldLabel>
                      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={categoryOpen}
                            className="w-full justify-between"
                          >
                            {selected?.name || "Select category..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search category..."
                              value={categorySearch}
                              onValueChange={setCategorySearch}
                            />
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {fetchedCategories?.data?.map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    value={String(category.id)}
                                    onSelect={(currentValue) => {
                                      field.onChange(
                                        parseInt(currentValue) === field.value
                                          ? 0
                                          : parseInt(currentValue)
                                      );
                                      setCategoryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === category.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {category.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FieldError>{fieldState?.error?.message}</FieldError>
                    </Field>
                  );
                }}
              />

              {/* SUPPLIER */}
              <Controller
                control={control}
                name="supplier"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Supplier</FieldLabel>
                    <Input placeholder="Select supplier" {...field} />
                    <FieldError>{fieldState?.error?.message}</FieldError>
                  </Field>
                )}
              />

              {/* UNIT */}
              <Controller
                control={control}
                name="unit"
                render={({ field, fieldState }) => {
                  const selected = fetchedUnits?.data?.find(
                    (u) => u.id === field.value
                  );

                  return (
                    <Field>
                      <FieldLabel>Unit of Measure</FieldLabel>
                      <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={unitOpen}
                            className="w-full justify-between"
                          >
                            {selected?.name || "Select unit..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search unit..."
                              value={unitSearch}
                              onValueChange={setUnitSearch}
                            />
                            <CommandEmpty>No unit found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {fetchedUnits?.data?.map((unit) => (
                                  <CommandItem
                                    key={unit.id}
                                    value={String(unit.id)}
                                    onSelect={(currentValue) => {
                                      field.onChange(
                                        parseInt(currentValue) === field.value
                                          ? 0
                                          : parseInt(currentValue)
                                      );
                                      setUnitOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === unit.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {unit.name} ({unit.symbol})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FieldError>{fieldState?.error?.message}</FieldError>
                    </Field>
                  );
                }}
              />

              {/* COST */}
              <Controller
                control={control}
                name="cost"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Cost Price (per unit)</FieldLabel>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                    <FieldError>{fieldState?.error?.message}</FieldError>
                  </Field>
                )}
              />

              {/* INITIAL STOCK */}
              <Controller
                control={control}
                name="initialStock"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Initial Stock</FieldLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                    <FieldError>{fieldState?.error?.message}</FieldError>
                  </Field>
                )}
              />

              {/* MIN STOCK */}
              <Controller
                control={control}
                name="minStock"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Reorder Point (Min Stock)</FieldLabel>
                    <Input
                      type="number"
                      placeholder="10"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                    <FieldError>{fieldState?.error?.message}</FieldError>
                  </Field>
                )}
              />

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Description (Optional)</FieldLabel>
                      <Textarea
                        rows={4}
                        placeholder="Additional details..."
                        {...field}
                      />
                      <FieldError>{fieldState?.error?.message}</FieldError>
                    </Field>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 pt-4">
            <Link to="/dashboard/raw-materials">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Material
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddRawMaterial;
