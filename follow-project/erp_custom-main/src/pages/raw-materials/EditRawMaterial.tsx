import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import {
  useGetAllRawMaterialCategoriesQuery,
  useUpdateRawMaterialMutation,
  useGetRawMaterialByIdQuery,
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
const EditRawMaterial = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const materialId = id ? parseInt(id, 10) : null;

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  // Fetch material details
  const { data: materialData } = useGetRawMaterialByIdQuery(materialId || 0, {
    skip: !materialId,
  });

  // Fetch categories
  const { data: fetchedCategories } = useGetAllRawMaterialCategoriesQuery({
    search: categorySearch,
  });

  // Fetch units
  const { data: fetchedUnits } = useGetAllUnitsQuery({
    search: unitSearch,
  });

  // Update mutation
  const [updateRawMaterial, { isLoading: isSubmitting }] =
    useUpdateRawMaterialMutation();

  const form = useForm<RawMaterialFormValues>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      name: "",
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

  const { control, handleSubmit, reset } = form;

  // Populate form when material data is loaded
  useEffect(() => {
    if (materialData?.data) {
      const material = materialData.data;
      reset({
        name: material.name,
        sku: material.sku || "",
        category: material.category_id,
        supplier: material.supplier || "",
        unit: material.unit_id,
        cost: material.cost,
        initialStock: material.initial_stock,
        minStock: material.min_stock,
        description: material.description || "",
        is_active: material.is_active,
      });
    }
  }, [materialData, reset]);

  const onSubmit = async (values: RawMaterialFormValues) => {
    if (!materialId) {
      toast.error("Invalid material ID");
      return;
    }

    try {
      await updateRawMaterial({
        id: materialId,
        body: {
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
        },
      }).unwrap();

      toast.success("Raw material updated successfully!");
      navigate("/dashboard/raw-materials");
    } catch (error) {
      console.error("Error updating raw material:", error);
      toast.error("Failed to update raw material");
      if (error instanceof Error) {
        toast.error("Error: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Edit Raw Material</h1>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Material Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NAME */}
                <div>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Material Name *</FieldLabel>
                        <Input
                          placeholder="e.g., Cotton Fabric"
                          {...field}
                        />
                        <FieldError>{fieldState?.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>

                {/* SKU */}
                <div>
                  <Controller
                    control={control}
                    name="sku"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>SKU *</FieldLabel>
                        <Input
                          placeholder="e.g., RM-001"
                          {...field}
                        />
                        <FieldError>{fieldState?.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>

                {/* CATEGORY */}
                <div>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Category *</FieldLabel>
                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between"
                            >
                              {field.value
                                ? fetchedCategories?.data?.find(
                                    (cat) => cat.id === field.value
                                  )?.name
                                : "Select category"}
                              <ChevronDown className="w-4 h-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search categories..."
                                value={categorySearch}
                                onValueChange={setCategorySearch}
                              />
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {fetchedCategories?.data?.map((category) => (
                                    <CommandItem
                                      key={category.id}
                                      value={category.name}
                                      onSelect={() => {
                                        field.onChange(category.id);
                                        setCategoryOpen(false);
                                      }}
                                    >
                                      {category.name}
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FieldError>{fieldState?.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>

                    {/* SUPPLIER */}
                    <div>
                      <Controller
                        control={control}
                        name="supplier"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Supplier (Optional)</FieldLabel>
                            <Input placeholder="e.g., Textile Corp" {...field} />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                    </div>

                    {/* UNIT */}
                    <div>
                      <Controller
                        control={control}
                        name="unit"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Unit of Measure *</FieldLabel>
                            <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between"
                                >
                                  {field.value
                                    ? fetchedUnits?.data?.find(
                                        (unit) => unit.id === field.value
                                      )?.name
                                    : "Select unit"}
                                  <ChevronDown className="w-4 h-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput
                                    placeholder="Search units..."
                                    value={unitSearch}
                                    onValueChange={setUnitSearch}
                                  />
                                  <CommandEmpty>No unit found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandList>
                                      {fetchedUnits?.data?.map((unit) => (
                                        <CommandItem
                                          key={unit.id}
                                          value={unit.name}
                                          onSelect={() => {
                                            field.onChange(unit.id);
                                            setUnitOpen(false);
                                          }}
                                        >
                                          {unit.name}
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FieldError>{fieldState?.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                    </div>

                    {/* COST */}
                    <div>
                      <Controller
                        control={control}
                        name="cost"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Cost Price *</FieldLabel>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                    </div>

                    {/* INITIAL STOCK */}
                    <div>
                      <Controller
                        control={control}
                        name="initialStock"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Initial Stock *</FieldLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                    </div>

                    {/* MIN STOCK */}
                    <div>
                      <Controller
                        control={control}
                        name="minStock"
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel>Min Stock *</FieldLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                    </div>

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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Update Material
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
    );
};

export default EditRawMaterial;
